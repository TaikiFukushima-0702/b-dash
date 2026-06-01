"use client";

import { useEffect, useState } from "react";

// PWA インストール促進。Android は beforeinstallprompt、iOS は手動手順を案内。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BIPEvent = any;

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed || !deferred) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span>📲 ホーム画面に追加してアプリのように使えます</span>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              await deferred.prompt();
              setDeferred(null);
            }}
            className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-bold text-[var(--primary-fg)]"
          >
            追加
          </button>
          <button onClick={() => setDismissed(true)} className="px-2 text-xs text-[var(--muted)]">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
