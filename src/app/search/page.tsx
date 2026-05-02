import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const books = q
    ? (
        await supabase
          .from("books")
          .select("id,title,authors,cover_url")
          .or(`title.ilike.%${q}%,notes.ilike.%${q}%`)
          .limit(30)
      ).data ?? []
    : [];

  const highlights = q
    ? (
        await supabase
          .from("highlights")
          .select("id,book_id,text,note,page,books(title)")
          .or(`text.ilike.%${q}%,note.ilike.%${q}%`)
          .limit(30)
      ).data ?? []
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">検索</h1>
      <form className="flex gap-2 mb-6" action="/search" method="get">
        <Input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="タイトル、著者、ハイライト本文..."
        />
        <Button type="submit">検索</Button>
      </form>

      {q && (
        <>
          <h2 className="text-sm font-semibold mb-2 text-muted">本 ({books.length})</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {books.map((b) => (
              <li key={b.id}>
                <Link href={`/books/${b.id}`} className="block">
                  <Card className="h-full">
                    <p className="text-sm font-medium line-clamp-2">{b.title}</p>
                    <p className="text-xs text-muted line-clamp-1">{b.authors?.join(", ")}</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="text-sm font-semibold mb-2 text-muted">
            ハイライト ({highlights.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {highlights.map((h: any) => (
              <li key={h.id}>
                <Link href={`/books/${h.book_id}`}>
                  <Card>
                    <p className="text-xs text-muted mb-1">
                      {h.books?.title} {h.page != null ? `· p.${h.page}` : ""}
                    </p>
                    <p className="text-sm whitespace-pre-wrap line-clamp-3">{h.text}</p>
                    {h.note && <p className="text-xs text-muted mt-1">— {h.note}</p>}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
