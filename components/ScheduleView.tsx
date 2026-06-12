import { toggleScheduleDone } from "@/app/actions/schedule";
import { Card, Pill } from "./ui";
import { formatJaShort, isDueOrPast, todayJst } from "@/lib/date";
import type { ScheduleEvent } from "@/lib/types";

const TYPE_TONE: Record<string, "default" | "warn" | "ok"> = {
  試験本番: "warn",
  模試: "warn",
  復習: "ok",
  学習計画: "default",
};

export default function ScheduleView({ events }: { events: ScheduleEvent[] }) {
  const today = todayJst();
  const upcoming = events.filter((e) => e.date && !e.done && !isDueOrPast(e.date, today) || (e.date === today && !e.done));
  const past = events.filter((e) => !upcoming.includes(e));

  return (
    <div className="space-y-5">
      <Group title="これからの予定" events={upcoming} />
      {past.length > 0 && <Group title="過去・完了" events={past} muted />}
      {events.length === 0 && (
        <p className="px-1 text-sm text-[var(--muted)]">まだ予定がありません。下から追加しましょう。</p>
      )}
    </div>
  );
}

function Group({
  title,
  events,
  muted = false,
}: {
  title: string;
  events: ScheduleEvent[];
  muted?: boolean;
}) {
  if (events.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-[var(--muted)]">{title}</h2>
      <div className={`space-y-2 ${muted ? "opacity-70" : ""}`}>
        {events.map((e) => (
          <Card key={e.id} className="flex items-center gap-3 py-3">
            <form action={toggleScheduleDone}>
              <input type="hidden" name="id" value={e.id} />
              <input type="hidden" name="done" value={String(e.done)} />
              <button
                type="submit"
                aria-label="完了切替"
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs ${
                  e.done ? "border-[var(--success)] bg-[var(--success)] text-white" : "border-[var(--border)]"
                }`}
              >
                {e.done ? "✓" : ""}
              </button>
            </form>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-medium ${e.done ? "line-through" : ""}`}>{e.name}</p>
              <p className="text-[11px] text-[var(--muted)]">{e.date ? formatJaShort(e.date) : "日付未設定"}</p>
            </div>
            <Pill tone={TYPE_TONE[e.type] ?? "default"}>{e.type}</Pill>
          </Card>
        ))}
      </div>
    </div>
  );
}
