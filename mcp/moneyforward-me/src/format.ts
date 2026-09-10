/** 円表記。小数は四捨五入する。 */
export function yen(n: number): string {
  const v = Math.round(n);
  const sign = v < 0 ? "-" : "";
  return `${sign}¥${Math.abs(v).toLocaleString("ja-JP")}`;
}

/** 増減の符号付き表記。 */
export function signedYen(n: number): string {
  const v = Math.round(n);
  if (v === 0) return "±¥0";
  return `${v > 0 ? "+" : "-"}¥${Math.abs(v).toLocaleString("ja-JP")}`;
}

/** 0.83 → "83%" */
export function pct(ratio: number | null, digits = 0): string {
  if (ratio === null || !Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** GitHub 風の Markdown テーブル。 */
export function mdTable(headers: string[], rows: (string | number)[][]): string {
  if (rows.length === 0) return "（データなし）";
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.map((c) => String(c)).join(" | ")} |`).join("\n");
  return [head, sep, body].join("\n");
}

/** 消化率を視覚化する簡易バー（幅 10）。 */
export function bar(ratio: number, width = 10): string {
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)));
  return "█".repeat(filled) + "░".repeat(width - filled);
}
