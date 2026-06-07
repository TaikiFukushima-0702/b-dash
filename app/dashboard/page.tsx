import Link from "next/link";
import { Card, LinkButton, PageHeader, Section, Stat } from "@/components/ui";
import CharacterCard from "@/components/CharacterCard";
import SetupNotice from "@/components/SetupNotice";
import InstallPrompt from "@/components/InstallPrompt";
import { isNotionConfigured } from "@/lib/notion";
import { getCharacterState, listDueReviews, listSchedule, listStudyLogs } from "@/lib/data";
import { todayJst, formatJaShort, diffDays } from "@/lib/date";
import { summarize } from "@/lib/summary";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const configured = isNotionConfigured();
  const [character, logs, dueReviews, schedule] = await Promise.all([
    getCharacterState(),
    configured ? listStudyLogs(60) : Promise.resolve([]),
    configured ? listDueReviews() : Promise.resolve([]),
    configured ? listSchedule() : Promise.resolve([]),
  ]);

  const today = todayJst();
  const todayLogs = logs.filter((l) => l.date === today);
  const todayMinutes = todayLogs.reduce((s, l) => s + l.minutes, 0);
  const todayXp = todayLogs.reduce((s, l) => s + l.xp, 0);
  const week = summarize(logs, today, 7);

  const exam = schedule
    .filter((e) => e.type === "試験本番" && e.date && diffDays(e.date, today) >= 0)
    .sort((a, b) => (a.date! < b.date! ? -1 : 1))[0];
  const nextEvent = schedule
    .filter((e) => !e.done && e.date && diffDays(e.date, today) >= 0)
    .sort((a, b) => (a.date! < b.date! ? -1 : 1))[0];

  return (
    <main className="flex-1">
      <PageHeader title="FE道場" subtitle={formatJaShort(today)} />

      <Section className="space-y-4">
        {!configured && <SetupNotice />}
        <InstallPrompt />

        <Link href="/character">
          <CharacterCard character={character} />
        </Link>

        {exam && (
          <Card className="flex items-center justify-between bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent)]/10">
            <div>
              <p className="text-xs text-[var(--muted)]">試験本番まで</p>
              <p className="text-2xl font-extrabold">あと {diffDays(exam.date!, today)} 日</p>
            </div>
            <span className="text-3xl">🎯</span>
          </Card>
        )}

        <Card>
          <p className="mb-3 text-sm font-semibold">今日の学習</p>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="学習時間" value={`${todayMinutes}分`} />
            <Stat label="獲得XP" value={`${todayXp}`} />
            <Stat label="復習待ち" value={`${dueReviews.length}件`} />
          </div>
          {todayMinutes === 0 && (
            <p className="mt-3 rounded-lg bg-[var(--accent)]/15 px-3 py-2 text-xs text-[var(--accent)]">
              今日はまだ未学習です。少しでも記録してストリークを伸ばそう🔥
            </p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">今週のまとめ（直近7日）</p>
            <span className="text-xs text-[var(--muted)]">{week.studiedDays}/7 日 学習</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="学習時間" value={`${Math.floor(week.minutes / 60)}h${week.minutes % 60}m`} />
            <Stat label="獲得XP" value={`${week.xp}`} />
            <Stat
              label="過去問正答率"
              value={week.accuracy === null ? "—" : `${Math.round(week.accuracy * 100)}%`}
              hint={week.problemsAttempted > 0 ? `${week.problemsCorrect}/${week.problemsAttempted}問` : undefined}
            />
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full bg-[var(--success)] transition-all"
              style={{ width: `${Math.round((week.studiedDays / 7) * 100)}%` }}
            />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <LinkButton href="/log" className="w-full">
            ✏️ 学習を記録
          </LinkButton>
          <LinkButton href="/kakomon" className="w-full bg-[var(--accent)] text-[#22252e]">
            📝 過去問を記録
          </LinkButton>
        </div>

        {dueReviews.length > 0 && (
          <Link href="/review">
            <Card className="flex items-center justify-between">
              <span className="text-sm font-medium">🔁 今日の復習が {dueReviews.length} 件あります</span>
              <span className="text-[var(--primary)]">→</span>
            </Card>
          </Link>
        )}

        {nextEvent && (
          <Link href="/schedule">
            <Card className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--muted)]">次の予定</p>
                <p className="text-sm font-medium">{nextEvent.name}</p>
              </div>
              <span className="text-xs text-[var(--muted)]">{formatJaShort(nextEvent.date!)}</span>
            </Card>
          </Link>
        )}
      </Section>
    </main>
  );
}
