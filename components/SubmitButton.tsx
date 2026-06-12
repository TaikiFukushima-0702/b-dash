"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-[var(--primary-fg)] transition active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "送信中…" : children}
    </button>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]";
export const labelClass = "mb-1 block text-xs font-semibold text-[var(--muted)]";
