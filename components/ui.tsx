import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 px-4 pt-6 pb-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`px-4 ${className}`}>{children}</section>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <span className="text-lg font-bold">{value}</span>
      {hint && <span className="text-[11px] text-[var(--muted)]">{hint}</span>}
    </div>
  );
}

export function Pill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "warn" | "ok" }) {
  const tones = {
    default: "bg-[var(--border)] text-[var(--foreground)]",
    warn: "bg-[var(--accent)]/20 text-[var(--accent)]",
    ok: "bg-[var(--success)]/15 text-[var(--success)]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function LinkButton({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-fg)] active:scale-95 transition ${className}`}
    >
      {children}
    </Link>
  );
}

export function NoticeCard({ children }: { children: ReactNode }) {
  return (
    <Card className="border-dashed">
      <div className="text-sm leading-relaxed text-[var(--muted)]">{children}</div>
    </Card>
  );
}
