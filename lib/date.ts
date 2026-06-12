// 日付ユーティリティ（JST / Asia-Tokyo 基準）。
// Notion はタイムゾーンを持つので、アプリ内では常に「YYYY-MM-DD」(JST) を正とする。

const JST_TZ = "Asia/Tokyo";

/** JST の本日を "YYYY-MM-DD" で返す。 */
export function todayJst(): string {
  return toJstDateString(new Date());
}

/** Date を JST の "YYYY-MM-DD" に変換する。 */
export function toJstDateString(d: Date): string {
  // en-CA ロケールは "YYYY-MM-DD" 形式を返す。
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** "YYYY-MM-DD" に日数を加算して "YYYY-MM-DD" を返す。 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** a - b の日数差（a,b は "YYYY-MM-DD"）。a が後なら正。 */
export function diffDays(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  return Math.round((da - db) / 86_400_000);
}

/** dateStr が今日以前（期限到来）か。 */
export function isDueOrPast(dateStr: string | null | undefined, today = todayJst()): boolean {
  if (!dateStr) return false;
  return diffDays(today, dateStr) >= 0;
}

/** 表示用の和風フォーマット "M月D日(曜)"。 */
export function formatJaShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const week = ["日", "月", "火", "水", "木", "金", "土"][dt.getUTCDay()];
  return `${m}月${d}日(${week})`;
}
