import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const createSchema = z.object({
  isbn: z.string().nullable().optional(),
  title: z.string().min(1),
  authors: z.array(z.string()).default([]),
  publisher: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  cover_url: z.string().nullable().optional(),
  total_pages: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("books")
    .insert({ ...parsed.data, user_id: user.id })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}
