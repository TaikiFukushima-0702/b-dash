import { monthOf } from "./period.js";
import type { AssetPoint } from "./types.js";

const TOTAL_NAMES = new Set(["合計", "総資産", "資産合計", "total", "Total"]);
const LIABILITY_HINTS = ["負債", "ローン", "借入", "カード残高"];

export type AssetSnapshot = {
  date: string;
  items: { name: string; amount: number }[];
  /** CSV に「合計」列があればその値、無ければ明細の合計 */
  total: number;
  /** 合計が CSV 由来か計算値か */
  totalSource: "csv" | "computed";
  liabilities: number;
};

/** 指定日以前で最も新しい日付のスナップショットを返す。 */
export function latestSnapshot(assets: AssetPoint[], asOf?: string): AssetSnapshot | null {
  const candidates = asOf ? assets.filter((a) => a.date <= asOf) : assets;
  if (candidates.length === 0) return null;
  const date = candidates.reduce((max, a) => (a.date > max ? a.date : max), candidates[0]!.date);
  return snapshotAt(assets, date);
}

/** その日ちょうどのスナップショット。 */
export function snapshotAt(assets: AssetPoint[], date: string): AssetSnapshot | null {
  const rows = assets.filter((a) => a.date === date);
  if (rows.length === 0) return null;
  const totalRow = rows.find((r) => TOTAL_NAMES.has(r.name));
  const items = rows
    .filter((r) => !TOTAL_NAMES.has(r.name))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .map((r) => ({ name: r.name, amount: r.amount }));
  const computed = items.reduce((s, r) => s + r.amount, 0);
  // 負債は「名前が負債系の項目」または「マイナス残高の項目」。常に 0 以下で返す。
  const liabilities = items.reduce((sum, r) => {
    if (LIABILITY_HINTS.some((h) => r.name.includes(h))) return sum - Math.abs(r.amount);
    if (r.amount < 0) return sum + r.amount;
    return sum;
  }, 0);
  return {
    date,
    items,
    total: totalRow ? totalRow.amount : computed,
    totalSource: totalRow ? "csv" : "computed",
    liabilities,
  };
}

export type AssetTrendPoint = { period: string; date: string; total: number; diff: number | null };

/**
 * 月次（既定）または日次の資産推移。
 * 月次では、その月に記録がある最終日の値を採用する。
 */
export function assetTrend(
  assets: AssetPoint[],
  opts: { start: string; end: string; granularity?: "month" | "day" },
): AssetTrendPoint[] {
  const granularity = opts.granularity ?? "month";
  const inRange = assets.filter((a) => a.date >= opts.start && a.date <= opts.end);
  const dates = [...new Set(inRange.map((a) => a.date))].sort();

  const chosen = new Map<string, string>();
  for (const d of dates) {
    const period = granularity === "month" ? monthOf(d) : d;
    const prev = chosen.get(period);
    if (!prev || d > prev) chosen.set(period, d);
  }

  const points: AssetTrendPoint[] = [];
  let previousTotal: number | null = null;
  for (const period of [...chosen.keys()].sort()) {
    const date = chosen.get(period)!;
    const snap = snapshotAt(assets, date);
    if (!snap) continue;
    points.push({ period, date, total: snap.total, diff: previousTotal === null ? null : snap.total - previousTotal });
    previousTotal = snap.total;
  }
  return points;
}
