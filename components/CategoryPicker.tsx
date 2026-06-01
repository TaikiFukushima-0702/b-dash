"use client";

import { useState } from "react";
import { FE_CATEGORIES, SYLLABUS_ORDER } from "@/lib/fe-categories";

/** カテゴリ複数選択（チェックを name="categories" で送信）。 */
export default function CategoryPicker({ defaultSelected = [] }: { defaultSelected?: string[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected));

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {SYLLABUS_ORDER.map((syl) => (
        <div key={syl}>
          <p className="mb-1 text-xs font-semibold text-[var(--muted)]">{syl}</p>
          <div className="flex flex-wrap gap-1.5">
            {FE_CATEGORIES.filter((c) => c.syllabus === syl).map((c) => {
              const on = selected.has(c.name);
              return (
                <button
                  type="button"
                  key={c.name}
                  onClick={() => toggle(c.name)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    on
                      ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-fg)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {[...selected].map((name) => (
        <input key={name} type="hidden" name="categories" value={name} />
      ))}
    </div>
  );
}
