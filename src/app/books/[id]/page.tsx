import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { STATUS_LABEL, formatDate, formatDuration } from "@/lib/utils";
import { BookActions } from "./BookActions";
import { HighlightsSection } from "./HighlightsSection";
import { SessionTimer } from "./SessionTimer";

export const dynamic = "force-dynamic";

export default async function BookDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: book } = await supabase.from("books").select("*").eq("id", id).single();
  if (!book) notFound();

  const { data: highlights } = await supabase
    .from("highlights")
    .select("*")
    .eq("book_id", id)
    .order("page", { ascending: true, nullsFirst: false });

  const { data: sessions } = await supabase
    .from("reading_sessions")
    .select("started_at,ended_at,duration_min,pages_read")
    .eq("book_id", id)
    .order("started_at", { ascending: false })
    .limit(10);

  const totalMin = (sessions ?? []).reduce((a, s) => a + (s.duration_min ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="text-sm text-muted">← 本棚に戻る</Link>

      <Card>
        <div className="flex gap-4">
          {book.cover_url ? (
            <div className="relative w-28 h-40 shrink-0 rounded overflow-hidden border border-border">
              <Image src={book.cover_url} alt="" fill sizes="112px" className="object-cover" />
            </div>
          ) : null}
          <div className="flex-1">
            <h1 className="text-xl font-bold">{book.title}</h1>
            <p className="text-sm text-muted">{book.authors?.join(", ")}</p>
            {book.publisher && <p className="text-xs text-muted">{book.publisher}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
              <span className="px-2 py-0.5 rounded bg-card border border-border">
                {STATUS_LABEL[book.status]}
              </span>
              {book.rating ? <span>{"★".repeat(book.rating)}</span> : null}
              {book.total_pages ? (
                <span className="text-muted">
                  {book.current_page}/{book.total_pages}p (
                  {Math.round((book.current_page / book.total_pages) * 100)}%)
                </span>
              ) : null}
            </div>
            {book.total_pages ? (
              <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${Math.min(100, (book.current_page / book.total_pages) * 100)}%` }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <BookActions book={book} />

      <SessionTimer bookId={book.id} totalMin={totalMin} />

      {book.notes && (
        <Card>
          <h3 className="text-sm font-semibold mb-1">メモ</h3>
          <p className="text-sm whitespace-pre-wrap">{book.notes}</p>
        </Card>
      )}

      <HighlightsSection bookId={book.id} initial={highlights ?? []} />

      {sessions && sessions.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold mb-2">最近の読書セッション</h3>
          <ul className="text-sm divide-y divide-border">
            {sessions.map((s, i) => (
              <li key={i} className="py-2 flex justify-between">
                <span>{formatDate(s.started_at)}</span>
                <span className="text-muted">
                  {formatDuration(s.duration_min)}
                  {s.pages_read ? ` / ${s.pages_read}p` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
