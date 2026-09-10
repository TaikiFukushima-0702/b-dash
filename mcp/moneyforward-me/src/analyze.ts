import { monthOf } from "./period.js";
import type { Transaction } from "./types.js";

export type TxnKind = "expense" | "income" | "all";

export type TxnFilter = {
  start: string;
  end: string;
  kind?: TxnKind;
  categories?: string[];
  subcategories?: string[];
  institutions?: string[];
  /** 内容・メモ・費目・金融機関のいずれかに含まれれば一致（大文字小文字を無視） */
  keyword?: string;
  /** 金額の絶対値の下限・上限（円） */
  minAmount?: number;
  maxAmount?: number;
  /** 振替（口座間移動）を含めるか。既定は false。 */
  includeTransfers?: boolean;
  /** 「計算対象 = 0」の行を含めるか。既定は false。 */
  includeExcluded?: boolean;
};

/** 支出額（正の値）。収入行は 0。 */
export const expenseOf = (t: Transaction): number => (t.amount < 0 ? -t.amount : 0);
/** 収入額（正の値）。支出行は 0。 */
export const incomeOf = (t: Transaction): number => (t.amount > 0 ? t.amount : 0);

const matchesAny = (value: string, list: string[] | undefined): boolean => {
  if (!list || list.length === 0) return true;
  return list.some((x) => value === x || value.includes(x));
};

export function filterTransactions(txns: Transaction[], f: TxnFilter): Transaction[] {
  const kind = f.kind ?? "all";
  const keyword = f.keyword?.trim().toLowerCase();
  return txns.filter((t) => {
    if (t.date < f.start || t.date > f.end) return false;
    if (!f.includeTransfers && t.isTransfer) return false;
    if (!f.includeExcluded && !t.included) return false;
    if (kind === "expense" && t.amount >= 0) return false;
    if (kind === "income" && t.amount <= 0) return false;
    if (!matchesAny(t.category, f.categories)) return false;
    if (!matchesAny(t.subcategory, f.subcategories)) return false;
    if (!matchesAny(t.institution, f.institutions)) return false;
    const abs = Math.abs(t.amount);
    if (f.minAmount !== undefined && abs < f.minAmount) return false;
    if (f.maxAmount !== undefined && abs > f.maxAmount) return false;
    if (keyword) {
      const haystack = `${t.content} ${t.memo} ${t.category} ${t.subcategory} ${t.institution}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
}

export type GroupKey = "month" | "day" | "category" | "subcategory" | "institution" | "content";

export type SummaryRow = {
  key: string;
  expense: number;
  income: number;
  /** 収入 - 支出 */
  net: number;
  count: number;
};

const keyOf = (t: Transaction, groupBy: GroupKey): string => {
  switch (groupBy) {
    case "month":
      return monthOf(t.date);
    case "day":
      return t.date;
    case "category":
      return t.category || "未分類";
    case "subcategory":
      return `${t.category || "未分類"} / ${t.subcategory || "（中項目なし）"}`;
    case "institution":
      return t.institution || "（金融機関なし）";
    case "content":
      return t.content || "（内容なし）";
  }
};

export function summarize(txns: Transaction[], groupBy: GroupKey): SummaryRow[] {
  const map = new Map<string, SummaryRow>();
  for (const t of txns) {
    const key = keyOf(t, groupBy);
    const row = map.get(key) ?? { key, expense: 0, income: 0, net: 0, count: 0 };
    row.expense += expenseOf(t);
    row.income += incomeOf(t);
    row.net += t.amount;
    row.count += 1;
    map.set(key, row);
  }
  const rows = [...map.values()];
  // 月・日は時系列、それ以外は支出の大きい順
  if (groupBy === "month" || groupBy === "day") return rows.sort((a, b) => a.key.localeCompare(b.key));
  return rows.sort((a, b) => b.expense - a.expense || b.income - a.income);
}

export function totals(txns: Transaction[]): { expense: number; income: number; net: number; count: number } {
  return txns.reduce(
    (acc, t) => ({
      expense: acc.expense + expenseOf(t),
      income: acc.income + incomeOf(t),
      net: acc.net + t.amount,
      count: acc.count + 1,
    }),
    { expense: 0, income: 0, net: 0, count: 0 },
  );
}

export type DiffRow = {
  key: string;
  current: number;
  previous: number;
  /** current - previous */
  diff: number;
  /** previous が 0 のときは null */
  ratio: number | null;
};

/** 2 期間の集計を突き合わせ、増減の絶対値が大きい順に並べる。 */
export function comparePeriods(
  current: SummaryRow[],
  previous: SummaryRow[],
  metric: "expense" | "income" | "net" = "expense",
): DiffRow[] {
  const keys = new Set<string>([...current.map((r) => r.key), ...previous.map((r) => r.key)]);
  const cur = new Map(current.map((r) => [r.key, r]));
  const prev = new Map(previous.map((r) => [r.key, r]));
  const rows: DiffRow[] = [];
  for (const key of keys) {
    const c = cur.get(key)?.[metric] ?? 0;
    const p = prev.get(key)?.[metric] ?? 0;
    rows.push({ key, current: c, previous: p, diff: c - p, ratio: p === 0 ? null : c / p });
  }
  return rows.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

/** 使われている大項目・中項目・金融機関の一覧（件数付き）。 */
export function inventory(txns: Transaction[]): {
  categories: { name: string; count: number; expense: number }[];
  subcategories: { name: string; count: number; expense: number }[];
  institutions: { name: string; count: number; expense: number }[];
} {
  const build = (fn: (t: Transaction) => string) => {
    const map = new Map<string, { name: string; count: number; expense: number }>();
    for (const t of txns) {
      const name = fn(t) || "（未設定）";
      const row = map.get(name) ?? { name, count: 0, expense: 0 };
      row.count += 1;
      row.expense += expenseOf(t);
      map.set(name, row);
    }
    return [...map.values()].sort((a, b) => b.expense - a.expense || b.count - a.count);
  };
  return {
    categories: build((t) => t.category),
    subcategories: build((t) => (t.subcategory ? `${t.category} / ${t.subcategory}` : "")),
    institutions: build((t) => t.institution),
  };
}
