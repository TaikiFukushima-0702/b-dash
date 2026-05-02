import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const startSchema = z.object({ action: z.literal("start") });
const endSchema = z.object({
  action: z.literal("end"),
  session_id: z.string().uuid(),
  pages_read: z.number().int().min(0).default(0),
  current_page: z.number().int().min(0).optional(),
});
const manualSchema = z.object({
  action: z.literal("manual"),
  started_at: z.string(),
  ended_at: z.string(),
  pages_read: z.number().int().min(0).default(0),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: book_id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = z.union([startSchema, endSchema, manualSchema]).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  if (parsed.data.action === "start") {
    const { data, error } = await supabase
      .from("reading_sessions")
      .insert({ book_id, user_id: user.id, started_at: new Date().toISOString() })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    // Mark book as 'reading' if currently to_read
    await supabase
      .from("books")
      .update({ status: "reading", started_at: new Date().toISOString() })
      .eq("id", book_id)
      .eq("status", "to_read");
    return NextResponse.json({ id: data.id });
  }

  if (parsed.data.action === "end") {
    const { error } = await supabase
      .from("reading_sessions")
      .update({ ended_at: new Date().toISOString(), pages_read: parsed.data.pages_read })
      .eq("id", parsed.data.session_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (parsed.data.current_page !== undefined) {
      await supabase.from("books").update({ current_page: parsed.data.current_page }).eq("id", book_id);
    }
    return NextResponse.json({ ok: true });
  }

  // manual entry
  const { error } = await supabase.from("reading_sessions").insert({
    book_id,
    user_id: user.id,
    started_at: parsed.data.started_at,
    ended_at: parsed.data.ended_at,
    pages_read: parsed.data.pages_read,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
