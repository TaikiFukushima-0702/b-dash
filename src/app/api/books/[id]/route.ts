import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  authors: z.array(z.string()).optional(),
  publisher: z.string().nullable().optional(),
  cover_url: z.string().nullable().optional(),
  total_pages: z.number().int().positive().nullable().optional(),
  current_page: z.number().int().min(0).optional(),
  status: z.enum(["to_read", "reading", "finished", "dnf"]).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  started_at: z.string().nullable().optional(),
  finished_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const patch: Record<string, unknown> = { ...parsed.data };

  // Auto-stamp started_at / finished_at when status transitions
  if (parsed.data.status === "reading" && !("started_at" in parsed.data)) {
    patch.started_at = new Date().toISOString();
  }
  if (parsed.data.status === "finished" && !("finished_at" in parsed.data)) {
    patch.finished_at = new Date().toISOString();
  }

  const { error } = await supabase.from("books").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
