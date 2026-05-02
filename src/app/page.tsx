import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { STATUS_LABEL } from "@/lib/utils";
import Image from "next/image";

export const dynamic = "force-dynamic";

type Book = {
  id: string;
  title: string;
  authors: string[];
  cover_url: string | null;
  status: keyof typeof STATUS_LABEL;
  rating: number | null;
  current_page: number;
  total_pages: number | null;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("books")
    .select("id,title,authors,cover_url,status,rating,current_page,total_pages")
    .order("updated_at", { ascending: false });
  if (status && status in STATUS_LABEL) query = query.eq("status", status);
  const { data: books } = await query;

  const filters: { value?: string; label: string }[] = [
    { label: "すべて" },
    { value: "reading", label: "読書中" },
    { value: "to_read", label: "積読" },
    { value: "finished", label: "読了" },
    { value: "dnf", label: "中断" },
  ];

  return (
    <div>
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">本棚</h1>
        <form action="/auth/sign-out" method="post">
          <button className="text-xs text-muted hover:text-fg">ログアウト</button>
        </form>
      </header>
      <nav className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4">
        {filters.map((f) => {
          const href = f.value ? `/?status=${f.value}` : "/";
          const active = (status ?? "") === (f.value ?? "");
          return (
            <Link
              key={f.label}
              href={href}
              className={`px-3 py-1.5 rounded-full text-sm border whitespace-nowrap ${
                active ? "bg-accent text-white border-accent" : "border-border text-muted"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {!books?.length ? (
        <Card className="text-center py-12 text-muted">
          まだ本がありません。
          <br />
          <Link href="/books/new" className="text-accent underline">
            最初の1冊を追加
          </Link>
        </Card>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {books.map((b) => (
            <li key={b.id}>
              <Link href={`/books/${b.id}`} className="block group">
                <div className="aspect-[2/3] rounded-lg overflow-hidden border border-border bg-card relative">
                  {b.cover_url ? (
                    <Image
                      src={b.cover_url}
                      alt={b.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full p-3 text-center text-xs text-muted">
                      {b.title}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium line-clamp-2">{b.title}</p>
                  <p className="text-xs text-muted line-clamp-1">{b.authors?.join(", ")}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                    <span className="px-1.5 py-0.5 rounded bg-card border border-border">
                      {STATUS_LABEL[b.status]}
                    </span>
                    {b.rating ? <span>{"★".repeat(b.rating)}</span> : null}
                    {b.total_pages ? (
                      <span>
                        {b.current_page}/{b.total_pages}p
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
