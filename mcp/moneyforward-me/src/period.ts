/** 集計対象期間（両端含む）。 */
export type Period = { start: string; end: string; label: string };

export const PERIOD_PRESETS = [
  "today",
  "this_month",
  "last_month",
  "this_year",
  "last_year",
  "last_3_months",
  "last_6_months",
  "last_12_months",
  "all",
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

const pad = (n: number) => String(n).padStart(2, "0");

/** ローカルタイムの YYYY-MM-DD。 */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 月末日を返す（month は 1-12）。 */
export function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function monthStart(year: number, month: number): string {
  return `${year}-${pad(month)}-01`;
}

export function monthEnd(year: number, month: number): string {
  return `${year}-${pad(month)}-${pad(lastDayOfMonth(year, month))}`;
}

/** YYYY-MM-DD の月部分（YYYY-MM）。 */
export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** n ヶ月前の {year, month}（month は 1-12）。 */
function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const idx = year * 12 + (month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

/**
 * "2024"・"2024-05"・"2024/05"・"2024-05-31" を境界日に展開する。
 * side が "start" なら期間の始まり、"end" なら終わりに寄せる。
 */
export function parseBoundary(raw: string, side: "start" | "end"): string | null {
  const s = raw.trim().replace(/\//g, "-");
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m as unknown as [string, string, string, string];
    return `${y}-${pad(Number(mo))}-${pad(Number(d))}`;
  }
  m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (m) {
    const [, y, mo] = m as unknown as [string, string, string];
    const year = Number(y);
    const month = Number(mo);
    if (month < 1 || month > 12) return null;
    return side === "start" ? monthStart(year, month) : monthEnd(year, month);
  }
  m = s.match(/^(\d{4})$/);
  if (m) {
    const year = Number(m[1]);
    return side === "start" ? `${year}-01-01` : `${year}-12-31`;
  }
  return null;
}

export class PeriodError extends Error {}

/**
 * preset と from/to から期間を決める。from/to は preset より優先される。
 * 何も指定が無ければ「今月」。
 */
export function resolvePeriod(
  opts: { from?: string; to?: string; preset?: PeriodPreset },
  now: Date = new Date(),
): Period {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const todayIso = toIsoDate(now);
  const preset = opts.preset ?? (opts.from || opts.to ? undefined : "this_month");

  let start: string;
  let end: string;
  let label: string;

  switch (preset) {
    case "today":
      start = todayIso;
      end = todayIso;
      label = `${todayIso}`;
      break;
    case "last_month": {
      const p = shiftMonth(y, m, -1);
      start = monthStart(p.year, p.month);
      end = monthEnd(p.year, p.month);
      label = `${p.year}年${p.month}月`;
      break;
    }
    case "this_year":
      start = `${y}-01-01`;
      end = todayIso;
      label = `${y}年（年初〜本日）`;
      break;
    case "last_year":
      start = `${y - 1}-01-01`;
      end = `${y - 1}-12-31`;
      label = `${y - 1}年`;
      break;
    case "last_3_months":
    case "last_6_months":
    case "last_12_months": {
      const n = preset === "last_3_months" ? 3 : preset === "last_6_months" ? 6 : 12;
      const p = shiftMonth(y, m, -(n - 1));
      start = monthStart(p.year, p.month);
      end = todayIso;
      label = `直近${n}ヶ月（当月含む）`;
      break;
    }
    case "all":
      start = "0000-01-01";
      end = "9999-12-31";
      label = "全期間";
      break;
    case "this_month":
      start = monthStart(y, m);
      end = monthEnd(y, m);
      label = `${y}年${m}月`;
      break;
    default:
      start = "0000-01-01";
      end = "9999-12-31";
      label = "";
      break;
  }

  if (opts.from) {
    const parsed = parseBoundary(opts.from, "start");
    if (!parsed) throw new PeriodError(`from の日付を解釈できません: "${opts.from}"（YYYY-MM-DD / YYYY-MM / YYYY）`);
    start = parsed;
    label = "";
  }
  if (opts.to) {
    const parsed = parseBoundary(opts.to, "end");
    if (!parsed) throw new PeriodError(`to の日付を解釈できません: "${opts.to}"（YYYY-MM-DD / YYYY-MM / YYYY）`);
    end = parsed;
    label = "";
  }
  if (start > end) throw new PeriodError(`期間の開始 (${start}) が終了 (${end}) より後になっています`);
  if (label === "") label = `${start} 〜 ${end}`;
  return { start, end, label };
}

/** 同じ長さの直前の期間（前月比・前年比などの比較用）。 */
export function previousPeriod(period: Period): Period {
  const startDate = new Date(`${period.start}T00:00:00`);
  const endDate = new Date(`${period.end}T00:00:00`);

  // 月初〜月末ちょうどなら、そのまま「1 ヶ月前」に寄せる（日数のズレを避ける）
  const sy = startDate.getFullYear();
  const sm = startDate.getMonth() + 1;
  if (period.start === monthStart(sy, sm) && period.end === monthEnd(endDate.getFullYear(), endDate.getMonth() + 1)) {
    const months =
      (endDate.getFullYear() * 12 + endDate.getMonth()) - (sy * 12 + startDate.getMonth()) + 1;
    const ps = shiftMonth(sy, sm, -months);
    const pe = shiftMonth(sy, sm, -1);
    return {
      start: monthStart(ps.year, ps.month),
      end: monthEnd(pe.year, pe.month),
      label: months === 1 ? `${ps.year}年${ps.month}月` : `${ps.year}-${pad(ps.month)} 〜 ${pe.year}-${pad(pe.month)}`,
    };
  }

  const days = Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
  const prevEnd = new Date(startDate.getTime() - 86_400_000);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 86_400_000);
  return {
    start: toIsoDate(prevStart),
    end: toIsoDate(prevEnd),
    label: `${toIsoDate(prevStart)} 〜 ${toIsoDate(prevEnd)}`,
  };
}
