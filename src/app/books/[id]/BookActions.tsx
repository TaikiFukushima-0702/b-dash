"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Book = {
  id: string;
  status: "to_read" | "reading" | "finished" | "dnf";
  rating: number | null;
  current_page: number;
  total_pages: number | null;
};

export function BookActions({ book }: { book: Book }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(book.current_page);

  function patch(payload: Record<string, unknown>) {
    startTransition(async () => {
      await fetch(`/api/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      router.refresh();
    });
  }

  async function remove() {
    if (!confirm("この本を削除しますか?")) return;
    await fetch(`/api/books/${book.id}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {(["to_read", "reading", "finished", "dnf"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={book.status === s ? "default" : "outline"}
            onClick={() => patch({ status: s })}
            disabled={isPending}
          >
            {{ to_read: "積読", reading: "読書中", finished: "読了", dnf: "中断" }[s]}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">★評価</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => patch({ rating: n })}
            className={`text-2xl leading-none ${(book.rating ?? 0) >= n ? "text-yellow-500" : "text-border"}`}
            aria-label={`${n}星`}
          >
            ★
          </button>
        ))}
        {book.rating ? (
          <button
            onClick={() => patch({ rating: null })}
            className="text-xs text-muted ml-2"
          >
            クリア
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted shrink-0">現在ページ</span>
        <Input
          type="number"
          inputMode="numeric"
          value={page}
          onChange={(e) => setPage(Number(e.target.value))}
          className="w-24"
        />
        {book.total_pages && <span className="text-xs text-muted">/ {book.total_pages}</span>}
        <Button size="sm" onClick={() => patch({ current_page: page })} disabled={isPending}>
          更新
        </Button>
      </div>

      <button onClick={remove} className="text-xs text-red-600 self-start">
        この本を削除
      </button>
    </Card>
  );
}
