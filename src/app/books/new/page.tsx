"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { IsbnScanner } from "@/components/IsbnScanner";
import Image from "next/image";
import type { LookupResult } from "@/lib/book-lookup";

export default function NewBookPage() {
  const router = useRouter();
  const [isbn, setIsbn] = useState("");
  const [data, setData] = useState<Partial<LookupResult> & { totalPages?: number; notes?: string }>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(scannedIsbn?: string) {
    const target = scannedIsbn ?? isbn;
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lookup?isbn=${encodeURIComponent(target)}`);
      if (!res.ok) {
        setError("書誌情報が見つかりませんでした。手動で入力してください。");
        setData((d) => ({ ...d, isbn: target }));
        return;
      }
      const j = (await res.json()) as LookupResult;
      setData({ ...j });
      setIsbn(target);
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isbn: data.isbn ?? isbn ?? null,
          title: data.title,
          authors: data.authors ?? [],
          publisher: data.publisher,
          published_at: parseDate(data.publishedAt),
          cover_url: data.coverUrl,
          total_pages: data.totalPages ?? null,
          notes: data.notes ?? null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "保存に失敗しました");
        return;
      }
      const { id } = await res.json();
      router.push(`/books/${id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">本を追加</h1>
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="ISBN (978...)"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="button" onClick={() => lookup()} disabled={busy}>
              検索
            </Button>
            <IsbnScanner onDetect={(code) => { setIsbn(code); lookup(code); }} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </Card>

      <form onSubmit={save} className="flex flex-col gap-3">
        <Card>
          <div className="flex gap-3">
            {data.coverUrl ? (
              <div className="relative w-24 h-36 shrink-0 rounded overflow-hidden border border-border">
                <Image src={data.coverUrl} alt="" fill sizes="96px" className="object-cover" />
              </div>
            ) : null}
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-xs text-muted">タイトル *</label>
              <Input
                required
                value={data.title ?? ""}
                onChange={(e) => setData({ ...data, title: e.target.value })}
              />
              <label className="text-xs text-muted">著者(カンマ区切り)</label>
              <Input
                value={(data.authors ?? []).join(", ")}
                onChange={(e) =>
                  setData({ ...data, authors: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted">出版社</label>
                  <Input
                    value={data.publisher ?? ""}
                    onChange={(e) => setData({ ...data, publisher: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted">総ページ数</label>
                  <Input
                    type="number"
                    value={data.totalPages ?? ""}
                    onChange={(e) =>
                      setData({ ...data, totalPages: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <label className="text-xs text-muted">メモ</label>
          <Textarea
            rows={4}
            value={data.notes ?? ""}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            placeholder="この本を選んだ理由、期待することなど"
          />
        </Card>
        <Button type="submit" size="lg" disabled={busy || !data.title}>
          保存
        </Button>
      </form>
    </div>
  );
}

function parseDate(s?: string): string | null {
  if (!s) return null;
  // "2020", "2020-01", "2020-01-15" etc を ISO 日付に
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  return s;
}
