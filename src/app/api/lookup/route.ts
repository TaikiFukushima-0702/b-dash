import { NextResponse } from "next/server";
import { lookupByIsbn } from "@/lib/book-lookup";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const isbn = url.searchParams.get("isbn");
  if (!isbn) return NextResponse.json({ error: "isbn required" }, { status: 400 });
  const result = await lookupByIsbn(isbn);
  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(result);
}
