import { Card, Pill } from "./ui";
import { formatJaShort } from "@/lib/date";
import type { StudyLog } from "@/lib/types";

export default function RecentLogs({ logs }: { logs: StudyLog[] }) {
  if (logs.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 px-1 text-sm font-semibold text-[var(--muted)]">最近の記録</h2>
      <div className="space-y-2">
        {logs.map((l) => (
          <Card key={l.id} className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{formatJaShort(l.date)}</span>
              <div className="flex items-center gap-2">
                <Pill>{l.source}</Pill>
                <span className="text-xs font-bold text-[var(--primary)]">+{l.xp} XP</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {l.minutes > 0 && `${l.minutes}分`}
              {l.problemsAttempted > 0 && ` ・ ${l.problemsCorrect}/${l.problemsAttempted}問`}
              {l.chapter && ` ・ ${l.chapter}`}
            </p>
            {l.reflection && <p className="mt-1 text-xs">📝 {l.reflection}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
