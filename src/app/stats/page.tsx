import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { getMonthlySummary, getOverallStats } from "@/lib/stats";
import { formatDuration } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const sp = await searchParams;
  const year = Number(sp.year ?? now.getUTCFullYear());
  const month = Number(sp.month ?? now.getUTCMonth() + 1);

  const [overall, monthly] = await Promise.all([
    getOverallStats(supabase, user.id),
    getMonthlySummary(supabase, user.id, year, month),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">統計</h1>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="今年読了" value={`${overall.this_year_finished}冊`} />
        <Stat label="連続読書日数" value={`${overall.current_streak_days}日`} />
        <Stat label="累計読書時間" value={formatDuration(overall.total_minutes)} />
        <Stat label="累計ハイライト" value={`${overall.total_highlights}件`} />
        <Stat label="読書中" value={`${overall.reading}冊`} />
        <Stat label="積読" value={`${overall.to_read}冊`} />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{year}年 {month}月</h2>
          <MonthNav year={year} month={month} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="読了" value={`${monthly.totals.books_finished}冊`} />
          <Stat label="読み始め" value={`${monthly.totals.books_started}冊`} />
          <Stat label="読書時間" value={formatDuration(monthly.totals.minutes_read)} />
          <Stat label="読んだページ" value={`${monthly.totals.pages_read}p`} />
          <Stat label="セッション" value={`${monthly.totals.sessions}回`} />
          <Stat label="ハイライト追加" value={`${monthly.totals.highlights_added}件`} />
        </div>
      </Card>

      {monthly.finished.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold mb-2">この月読み終えた本</h3>
          <ul className="text-sm divide-y divide-border">
            {monthly.finished.map((b) => (
              <li key={b.id} className="py-2">
                <Link href={`/books/${b.id}`} className="flex justify-between">
                  <span className="line-clamp-1">{b.title}</span>
                  <span className="text-muted">{b.rating ? "★".repeat(b.rating) : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="bg-accent/5 border-accent/30">
        <h3 className="text-sm font-semibold mb-1">Claudeに今月の傾向を聞く</h3>
        <p className="text-xs text-muted mb-3">
          MCPサーバーが /api/mcp で動作中。Claude Desktop / Claude.ai に登録すると、
          「今月の読書を要約して」と聞くだけで自動で集計&要約してくれます。
        </p>
        <Link
          href="/settings/mcp"
          className="text-sm text-accent underline"
        >
          MCP接続情報を見る →
        </Link>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </Card>
  );
}

function MonthNav({ year, month }: { year: number; month: number }) {
  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  return (
    <div className="flex gap-2 text-sm">
      <Link href={`/stats?year=${prev.y}&month=${prev.m}`} className="text-muted">←</Link>
      <Link href={`/stats?year=${next.y}&month=${next.m}`} className="text-muted">→</Link>
    </div>
  );
}
