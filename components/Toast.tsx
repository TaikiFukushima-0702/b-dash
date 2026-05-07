"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export interface ToastMsg {
  id: string;
  title: string;
  body?: string;
  emoji?: string;
  tone?: "info" | "success" | "warning";
}

interface ToastContext {
  push: (t: Omit<ToastMsg, "id">) => void;
}

const Ctx = createContext<ToastContext | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastMsg[]>([]);

  const push = useCallback((t: Omit<ToastMsg, "id">) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const msg: ToastMsg = { id, ...t };
    setItems((prev) => [...prev, msg]);
    setTimeout(() => {
      setItems((prev) => prev.filter((p) => p.id !== id));
    }, 3800);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            className={`animate-pop-in pointer-events-auto w-full max-w-sm rounded-2xl border-4 border-frame-dark px-4 py-3 shadow-pop ${
              t.tone === "success"
                ? "bg-pop-green"
                : t.tone === "warning"
                  ? "bg-pop-orange"
                  : "bg-pop-yellow"
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-2xl">{t.emoji ?? "✨"}</span>
              <div>
                <div className="font-bold text-frame-dark">{t.title}</div>
                {t.body && <div className="text-xs text-frame-dark/80">{t.body}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
