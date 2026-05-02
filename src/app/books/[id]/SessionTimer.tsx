"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Play, Square } from "lucide-react";
import { formatDuration } from "@/lib/utils";

const STORAGE_KEY = "bdash:active-session";

type Active = { sessionId: string; bookId: string; startedAt: number };

export function SessionTimer({ bookId, totalMin }: { bookId: string; totalMin: number }) {
  const router = useRouter();
  const [active, setActive] = useState<Active | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [pages, setPages] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<string>("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const a: Active = JSON.parse(raw);
      if (a.bookId === bookId) setActive(a);
    }
  }, [bookId]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setElapsed(Date.now() - active.startedAt), 1000);
    return () => clearInterval(id);
  }, [active]);

  async function start() {
    const res = await fetch(`/api/books/${bookId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    if (!res.ok) return;
    const { id } = await res.json();
    const a: Active = { sessionId: id, bookId, startedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
    setActive(a);
    router.refresh();
  }

  async function stop() {
    if (!active) return;
    await fetch(`/api/books/${bookId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "end",
        session_id: active.sessionId,
        pages_read: pages ? Number(pages) : 0,
        current_page: currentPage ? Number(currentPage) : undefined,
      }),
    });
    localStorage.removeItem(STORAGE_KEY);
    setActive(null);
    setPages("");
    setCurrentPage("");
    router.refresh();
  }

  const elapsedMin = Math.floor(elapsed / 60000);
  const elapsedSec = Math.floor((elapsed % 60000) / 1000);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-muted">合計読書時間</div>
          <div className="text-lg font-semibold">{formatDuration(totalMin)}</div>
        </div>
        {active ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-lg">
              {String(elapsedMin).padStart(2, "0")}:{String(elapsedSec).padStart(2, "0")}
            </span>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="読んだページ"
              className="w-28"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
            />
            <Input
              type="number"
              inputMode="numeric"
              placeholder="現在ページ"
              className="w-28"
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
            />
            <Button onClick={stop} variant="destructive" size="sm">
              <Square className="h-4 w-4" /> 終了
            </Button>
          </div>
        ) : (
          <Button onClick={start}>
            <Play className="h-4 w-4" /> 読書開始
          </Button>
        )}
      </div>
    </Card>
  );
}
