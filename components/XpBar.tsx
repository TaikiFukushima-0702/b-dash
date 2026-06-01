export default function XpBar({
  ratio,
  current,
  next,
}: {
  ratio: number;
  current: number;
  next: number;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return (
    <div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-[var(--muted)]">
        <span>次のレベルまで</span>
        <span>
          {current} / {next} XP
        </span>
      </div>
    </div>
  );
}
