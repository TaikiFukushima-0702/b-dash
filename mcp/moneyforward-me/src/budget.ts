import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { expenseOf } from "./analyze.js";
import { lastDayOfMonth, monthEnd, monthStart } from "./period.js";
import type { Transaction } from "./types.js";

export type Budget = {
  version: 1;
  /** 大項目名 → 月額予算（円） */
  monthly: Record<string, number>;
  /** 全体の月額予算（円）。未設定なら大項目の合計を使う。 */
  total?: number;
  updatedAt?: string;
};

export const EMPTY_BUDGET: Budget = { version: 1, monthly: {} };

/** 0 以上の有限な数値だけを通す。それ以外（null・NaN・真偽値・空文字）は null。 */
function toAmount(value: unknown): number | null {
  if (value === null || value === undefined || typeof value === "boolean") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function sanitizeMonthly(value: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (typeof value !== "object" || value === null) return out;
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const amount = toAmount(raw);
    if (amount !== null) out[key] = amount;
  }
  return out;
}

export function budgetPath(dataDir: string): string {
  return path.join(dataDir, "budget.json");
}

export function loadBudget(dataDir: string): Budget {
  const file = budgetPath(dataDir);
  if (!existsSync(file)) return { ...EMPTY_BUDGET };
  try {
    const raw = JSON.parse(readFileSync(file, "utf-8")) as { monthly?: unknown; total?: unknown; updatedAt?: unknown };
    const monthly = sanitizeMonthly(raw.monthly);
    const total = toAmount(raw.total);
    return {
      version: 1,
      monthly,
      ...(total !== null && total > 0 ? { total } : {}),
      ...(typeof raw.updatedAt === "string" ? { updatedAt: raw.updatedAt } : {}),
    };
  } catch (err) {
    throw new Error(`budget.json を読めませんでした (${file}): ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function saveBudget(dataDir: string, budget: Budget): string {
  mkdirSync(dataDir, { recursive: true });
  const file = budgetPath(dataDir);
  // NaN / 負数 / 数値でない値は、JSON に書き出す前に落とす（null として保存されるのを防ぐ）
  const total = toAmount(budget.total);
  const payload: Budget = {
    version: 1,
    monthly: sanitizeMonthly(budget.monthly),
    ...(total !== null && total > 0 ? { total } : {}),
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
  return file;
}

/** 対象月のうち、今日時点で何割が経過したか（過去月なら 1、未来月なら 0）。 */
export function elapsedRatio(month: string, now: Date): number {
  const [yStr, mStr] = month.split("-");
  const year = Number(yStr);
  const m = Number(mStr);
  const days = lastDayOfMonth(year, m);
  const nowMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (month < nowMonth) return 1;
  if (month > nowMonth) return 0;
  return Math.min(1, now.getDate() / days);
}

export type BudgetStatus = "順調" | "注意" | "ペース超過" | "超過" | "予算未設定";

export type BudgetRow = {
  category: string;
  limit: number | null;
  spent: number;
  remaining: number | null;
  /** spent / limit */
  usage: number | null;
  /** 今のペースで月末に到達する見込み額 */
  projected: number;
  status: BudgetStatus;
};

export type BudgetReport = {
  month: string;
  elapsed: number;
  daysLeft: number;
  rows: BudgetRow[];
  totalRow: BudgetRow;
  /** 予算未設定なのに支出がある大項目 */
  unbudgeted: { category: string; spent: number }[];
};

function judge(limit: number | null, spent: number, projected: number): BudgetStatus {
  if (limit === null || limit === 0) return "予算未設定";
  if (spent >= limit) return "超過";
  if (projected > limit) return "ペース超過";
  if (spent / limit >= 0.8) return "注意";
  return "順調";
}

/** 対象月の支出を予算と突き合わせる。振替・計算対象外は除外済みの取引を渡すこと。 */
export function budgetReport(
  txns: Transaction[],
  budget: Budget,
  month: string,
  now: Date = new Date(),
): BudgetReport {
  const start = monthStart(Number(month.slice(0, 4)), Number(month.slice(5, 7)));
  const end = monthEnd(Number(month.slice(0, 4)), Number(month.slice(5, 7)));
  const inMonth = txns.filter((t) => t.date >= start && t.date <= end && !t.isTransfer && t.included);

  const spentByCategory = new Map<string, number>();
  for (const t of inMonth) {
    const e = expenseOf(t);
    if (e === 0) continue;
    spentByCategory.set(t.category, (spentByCategory.get(t.category) ?? 0) + e);
  }

  const elapsed = elapsedRatio(month, now);
  const days = lastDayOfMonth(Number(month.slice(0, 4)), Number(month.slice(5, 7)));
  const daysLeft = Math.max(0, Math.round(days * (1 - elapsed)));
  const project = (spent: number) => (elapsed > 0 ? spent / elapsed : spent);

  const rows: BudgetRow[] = Object.entries(budget.monthly)
    .map(([category, limit]) => {
      const spent = spentByCategory.get(category) ?? 0;
      const projected = project(spent);
      return {
        category,
        limit,
        spent,
        remaining: limit - spent,
        usage: limit > 0 ? spent / limit : null,
        projected,
        status: judge(limit, spent, projected),
      };
    })
    .sort((a, b) => (b.usage ?? 0) - (a.usage ?? 0));

  const totalSpent = [...spentByCategory.values()].reduce((s, v) => s + v, 0);
  const totalLimit =
    budget.total ?? (rows.length > 0 ? rows.reduce((s, r) => s + (r.limit ?? 0), 0) : null);
  const totalProjected = project(totalSpent);
  const totalRow: BudgetRow = {
    category: "合計",
    limit: totalLimit,
    spent: totalSpent,
    remaining: totalLimit === null ? null : totalLimit - totalSpent,
    usage: totalLimit ? totalSpent / totalLimit : null,
    projected: totalProjected,
    status: judge(totalLimit, totalSpent, totalProjected),
  };

  const unbudgeted = [...spentByCategory.entries()]
    .filter(([category]) => budget.monthly[category] === undefined)
    .map(([category, spent]) => ({ category, spent }))
    .sort((a, b) => b.spent - a.spent);

  return { month, elapsed, daysLeft, rows, totalRow, unbudgeted };
}
