"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

type Highlight = {
  id: string;
  page: number | null;
  text: string;
  note: string | null;
  created_at: string;
};

export function HighlightsSection({ bookId, initial }: { bookId: string; initial: Highlight[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [page, setPage] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    await fetch(`/api/books/${bookId}/highlights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        page: page ? Number(page) : null,
        note: note || null,
      }),
    });
    setText("");
    setPage("");
    setNote("");
    setBusy(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("削除しますか?")) return;
    await fetch(`/api/books/${bookId}/highlights/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3">ハイライト・引用</h3>

      <form onSubmit={add} className="flex flex-col gap-2 mb-4">
        <Textarea
          rows={3}
          placeholder="気になった一節をそのまま書く"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="ページ"
            className="w-24"
            value={page}
            onChange={(e) => setPage(e.target.value)}
          />
          <Input
            placeholder="自分のメモ(任意)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={busy || !text.trim()}>
          追加
        </Button>
      </form>

      {initial.length === 0 ? (
        <p className="text-sm text-muted">まだハイライトはありません</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {initial.map((h) => (
            <li key={h.id} className="border-l-2 border-accent pl-3 group">
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm whitespace-pre-wrap">{h.text}</p>
                <button
                  onClick={() => remove(h.id)}
                  className="text-muted hover:text-red-600 opacity-0 group-hover:opacity-100"
                  aria-label="削除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {h.note && <p className="text-xs text-muted mt-1">— {h.note}</p>}
              {h.page != null && <p className="text-xs text-muted mt-1">p.{h.page}</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
