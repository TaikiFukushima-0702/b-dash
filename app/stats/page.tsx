import { Card, PageHeader, Pill, Section, Stat } from "@/components/ui";
import CategoryAccuracyChart from "@/components/CategoryAccuracyChart";
import SetupNotice from "@/components/SetupNotice";
import { isNotionConfigured } from "@/lib/notion";
import { listCategoryStats, listStudyLogs } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const configured = isNotionConfigured();
  const [stats, logs] = await Promise.all([
    configured ? listCategoryStats() : Promise.resolve([]),
    configured ? listStudyLogs(100) : Promise.resolve([]),
  ]);

  const totalAttempted = stats.reduce((s, c) => s + c.totalAttempted, 0);
  const totalCorrect = stats.reduce((s, c) => s + c.totalCorrect, 0);
  const overall = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
  const totalMinutes = logs.reduce((s, l) => s + l.minutes, 0);
  const weak = stats.filter((s) => s.weak).sort((a, b) => a.accuracy - b.accuracy);

  return (
    <main className="flex-1">
      <PageHeader title="統計" subtitle="分野別の正答率と弱点" />
      <Section className="space-y-4">
        {!configured && <SetupNotice />}

        <Card>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="総学習時間" value={`${Math.floor(totalMinutes / 60)}h${totalMinutes % 60}m`} />
            <Stat label="総挑戦数" value={`${totalAttempted}問`} />
            <Stat label="総合正答率" value={`${overall}%`} />
          </div>
        </Card>

        {weak.length > 0 && (
          <Card>
            <p className="mb-2 text-sm font-semibold text-[var(--danger)]">⚠️ 重点強化したい分野</p>
            <div className="flex flex-wrap gap-2">
              {weak.map((w) => (
                <Pill key={w.id} tone="warn">
                  {w.name}（{Math.round(w.accuracy * 100)}%）
                </Pill>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[var(--muted)]">
              苦手分野は「復習」タブでトピックを追加し、間隔反復で潰しましょう。
            </p>
          </Card>
        )}

        <Card>
          <p className="mb-3 text-sm font-semibold">分野別 正答率</p>
          <CategoryAccuracyChart stats={stats} />
        </Card>
      </Section>
    </main>
  );
}
