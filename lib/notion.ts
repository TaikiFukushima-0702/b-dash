import "server-only";
import { Client } from "@notionhq/client";

// Notion クライアントとDB ID をサーバー側だけで扱う。トークンは絶対にクライアントへ出さない。

export const NOTION_DB = {
  studyLog: process.env.NOTION_DB_STUDY_LOG ?? "",
  review: process.env.NOTION_DB_REVIEW ?? "",
  schedule: process.env.NOTION_DB_SCHEDULE ?? "",
  character: process.env.NOTION_DB_CHARACTER ?? "",
  categoryStats: process.env.NOTION_DB_CATEGORY_STATS ?? "",
} as const;

const token = process.env.NOTION_TOKEN ?? "";

/** Notion が設定済みか（トークン＋最低限のDB ID）。未設定ならアプリはセットアップ案内を表示する。 */
export function isNotionConfigured(): boolean {
  return Boolean(token && NOTION_DB.studyLog && NOTION_DB.character);
}

let _client: Client | null = null;
export function notion(): Client {
  if (!token) throw new Error("NOTION_TOKEN が未設定です。");
  if (!_client) _client = new Client({ auth: token });
  return _client;
}

// ---- データソース（DB）参照ヘルパー ----
// Notion API 2025-09 以降は data_source_id を使うが、@notionhq/client v5 は
// database_id を渡すと内部で解決する互換 API を維持している。ここでは database_id を使う。

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPage = any;

export async function queryDb(
  databaseId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: Record<string, any> = {},
): Promise<AnyPage[]> {
  if (!databaseId) return [];
  const res = await notion().databases.query({
    database_id: databaseId,
    ...options,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (res as any).results ?? [];
}

// ---- プロパティ読み取りヘルパー ----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pProps(page: AnyPage): Record<string, any> {
  return page?.properties ?? {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readTitle(prop: any): string {
  return (prop?.title ?? []).map((t: { plain_text: string }) => t.plain_text).join("") || "";
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readRichText(prop: any): string {
  return (prop?.rich_text ?? []).map((t: { plain_text: string }) => t.plain_text).join("") || "";
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readNumber(prop: any): number {
  return typeof prop?.number === "number" ? prop.number : 0;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readSelect(prop: any): string {
  return prop?.select?.name ?? "";
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readMultiSelect(prop: any): string[] {
  return (prop?.multi_select ?? []).map((s: { name: string }) => s.name);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readCheckbox(prop: any): boolean {
  return Boolean(prop?.checkbox);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readUrl(prop: any): string {
  return prop?.url ?? "";
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readDateStart(prop: any): string | null {
  return prop?.date?.start ?? null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readDateEnd(prop: any): string | null {
  return prop?.date?.end ?? null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readFormulaNumber(prop: any): number {
  return typeof prop?.formula?.number === "number" ? prop.formula.number : 0;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readFormulaBoolean(prop: any): boolean {
  return Boolean(prop?.formula?.boolean);
}

// ---- プロパティ書き込みヘルパー ----
export const prop = {
  title: (text: string) => ({ title: [{ text: { content: text.slice(0, 2000) } }] }),
  richText: (text: string) => ({ rich_text: text ? [{ text: { content: text.slice(0, 2000) } }] : [] }),
  number: (n: number) => ({ number: Number.isFinite(n) ? n : 0 }),
  select: (name: string) => (name ? { select: { name } } : { select: null }),
  multiSelect: (names: string[]) => ({ multi_select: names.map((name) => ({ name })) }),
  checkbox: (v: boolean) => ({ checkbox: v }),
  url: (u: string) => ({ url: u || null }),
  date: (start: string | null, end?: string | null) =>
    start ? { date: { start, end: end ?? null } } : { date: null },
};
