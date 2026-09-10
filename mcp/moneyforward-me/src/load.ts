import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

import { decodeCsv, normalizeHeader, parseAmount, parseCsv, parseDate, parseFlag } from "./csv.js";
import type { AssetPoint, Dataset, SourceFileInfo, Transaction } from "./types.js";

/** ヘッダ名 → 列インデックスの索引。 */
type HeaderIndex = Map<string, number>;

const TXN_ALIASES = {
  included: ["計算対象"],
  date: ["日付", "取引日", "利用日"],
  content: ["内容", "摘要", "取引内容"],
  amount: ["金額（円）", "金額(円)", "金額", "入出金金額"],
  institution: ["保有金融機関", "金融機関", "口座"],
  category: ["大項目", "カテゴリ", "費目"],
  subcategory: ["中項目", "サブカテゴリ", "小項目"],
  memo: ["メモ", "備考"],
  isTransfer: ["振替"],
  id: ["ID", "Id", "id", "取引ID"],
} as const;

const ASSET_NAME_ALIASES = ["名称", "項目", "資産項目", "種類", "資産の種類", "口座", "金融機関", "保有金融機関"];
const ASSET_AMOUNT_ALIASES = ["残高", "金額", "評価額", "合計", "資産額", "金額（円）", "金額(円)"];
const DATE_ALIASES = ["日付", "年月", "日時", "基準日"];

function indexHeaders(header: string[]): HeaderIndex {
  const map: HeaderIndex = new Map();
  header.forEach((h, i) => {
    const key = normalizeHeader(h);
    if (key !== "" && !map.has(key)) map.set(key, i);
  });
  return map;
}

function pick(idx: HeaderIndex, aliases: readonly string[]): number | undefined {
  for (const a of aliases) {
    const i = idx.get(normalizeHeader(a));
    if (i !== undefined) return i;
  }
  return undefined;
}

function cell(row: string[], i: number | undefined): string {
  if (i === undefined) return "";
  return (row[i] ?? "").trim();
}

/** ヘッダの内容だけを見て CSV の種類を判定する（ファイル名には依存しない）。 */
export function classify(header: string[]): "transactions" | "assets" | "unknown" {
  const idx = indexHeaders(header);
  const hasDate = pick(idx, DATE_ALIASES) !== undefined;
  const hasAmount = pick(idx, TXN_ALIASES.amount) !== undefined;
  const hasCategory = pick(idx, TXN_ALIASES.category) !== undefined;
  const hasContent = pick(idx, TXN_ALIASES.content) !== undefined;

  if (hasDate && (hasCategory || (hasContent && hasAmount))) return "transactions";
  if (hasDate) {
    // 日付 + 名称 + 金額（縦持ち） か 日付 + 複数の数値列（横持ち）
    const hasName = pick(idx, ASSET_NAME_ALIASES) !== undefined;
    const hasAssetAmount = pick(idx, ASSET_AMOUNT_ALIASES) !== undefined;
    if (hasName && hasAssetAmount) return "assets";
    if (idx.size >= 2) return "assets";
  }
  return "unknown";
}

function parseTransactionRows(rows: string[][], file: string): Transaction[] {
  const header = rows[0];
  if (!header) return [];
  const idx = indexHeaders(header);
  const cIncluded = pick(idx, TXN_ALIASES.included);
  const cDate = pick(idx, TXN_ALIASES.date);
  const cContent = pick(idx, TXN_ALIASES.content);
  const cAmount = pick(idx, TXN_ALIASES.amount);
  const cInst = pick(idx, TXN_ALIASES.institution);
  const cCat = pick(idx, TXN_ALIASES.category);
  const cSub = pick(idx, TXN_ALIASES.subcategory);
  const cMemo = pick(idx, TXN_ALIASES.memo);
  const cTransfer = pick(idx, TXN_ALIASES.isTransfer);
  const cId = pick(idx, TXN_ALIASES.id);

  const out: Transaction[] = [];
  for (const row of rows.slice(1)) {
    const date = parseDate(cell(row, cDate));
    const amount = parseAmount(cell(row, cAmount));
    if (date === null || amount === null) continue;
    const content = cell(row, cContent);
    const institution = cell(row, cInst);
    const rawId = cell(row, cId);
    out.push({
      id: rawId !== "" ? rawId : `${date}|${content}|${amount}|${institution}`,
      date,
      content,
      amount,
      institution,
      category: cell(row, cCat) || "未分類",
      subcategory: cell(row, cSub),
      memo: cell(row, cMemo),
      isTransfer: parseFlag(cTransfer === undefined ? undefined : cell(row, cTransfer), false),
      included: parseFlag(cIncluded === undefined ? undefined : cell(row, cIncluded), true),
      sourceFile: file,
    });
  }
  return out;
}

function parseAssetRows(rows: string[][], file: string): AssetPoint[] {
  const header = rows[0];
  if (!header) return [];
  const idx = indexHeaders(header);
  const cDate = pick(idx, DATE_ALIASES);
  if (cDate === undefined) return [];
  const cName = pick(idx, ASSET_NAME_ALIASES);
  const cAmount = pick(idx, ASSET_AMOUNT_ALIASES);
  const out: AssetPoint[] = [];

  // 縦持ち: 日付, 名称, 金額
  if (cName !== undefined && cAmount !== undefined) {
    for (const row of rows.slice(1)) {
      const date = parseDate(cell(row, cDate));
      const amount = parseAmount(cell(row, cAmount));
      if (date === null || amount === null) continue;
      const name = cell(row, cName) || "不明";
      out.push({ date, name, amount, sourceFile: file });
    }
    return out;
  }

  // 横持ち: 日付, 列 A, 列 B, ...（列名が資産項目）
  for (const row of rows.slice(1)) {
    const date = parseDate(cell(row, cDate));
    if (date === null) continue;
    header.forEach((h, i) => {
      if (i === cDate) return;
      const name = normalizeHeader(h);
      if (name === "") return;
      const amount = parseAmount(cell(row, i));
      if (amount === null) return;
      out.push({ date, name, amount, sourceFile: file });
    });
  }
  return out;
}

function walkCsvFiles(dir: string, depth = 0): string[] {
  if (depth > 4) return [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const e of entries) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walkCsvFiles(full, depth + 1));
    else if (/\.csv$/i.test(e.name)) files.push(full);
  }
  return files.sort();
}

/** MF_DATA_DIR（未設定なら ~/moneyforward-me）を解決する。 */
export function resolveDataDir(): string {
  const raw = process.env.MF_DATA_DIR ?? process.env.MONEYFORWARD_DATA_DIR ?? "~/moneyforward-me";
  const expanded = raw.startsWith("~") ? path.join(homedir(), raw.slice(1)) : raw;
  return path.resolve(expanded);
}

function minMax(dates: string[]): { from?: string; to?: string } {
  if (dates.length === 0) return {};
  let from = dates[0]!;
  let to = dates[0]!;
  for (const d of dates) {
    if (d < from) from = d;
    if (d > to) to = d;
  }
  return { from, to };
}

/** データディレクトリ配下の CSV をすべて読み、取引・資産に振り分けて重複を除く。 */
export function loadDataset(dataDir: string): Dataset {
  const files = walkCsvFiles(dataDir);
  const txnById = new Map<string, Transaction>();
  const assetByKey = new Map<string, AssetPoint>();
  const infos: SourceFileInfo[] = [];

  for (const full of files) {
    const rel = path.relative(dataDir, full) || path.basename(full);
    let rows: string[][];
    try {
      rows = parseCsv(decodeCsv(readFileSync(full)));
    } catch (err) {
      infos.push({
        file: rel,
        kind: "unknown",
        rows: 0,
        accepted: 0,
        note: `読み込みに失敗: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }
    const header = rows[0];
    if (!header) {
      infos.push({ file: rel, kind: "unknown", rows: 0, accepted: 0, note: "空ファイル" });
      continue;
    }
    const kind = classify(header);
    const dataRows = Math.max(rows.length - 1, 0);

    if (kind === "transactions") {
      const parsed = parseTransactionRows(rows, rel);
      let accepted = 0;
      for (const t of parsed) {
        if (!txnById.has(t.id)) accepted++;
        // 同一 ID は後勝ち（新しくダウンロードした CSV の方が修正済みのことが多い）
        txnById.set(t.id, t);
      }
      infos.push({ file: rel, kind, rows: dataRows, accepted, ...minMax(parsed.map((t) => t.date)) });
    } else if (kind === "assets") {
      const parsed = parseAssetRows(rows, rel);
      let accepted = 0;
      for (const a of parsed) {
        const key = `${a.date}|${a.name}`;
        if (!assetByKey.has(key)) accepted++;
        assetByKey.set(key, a);
      }
      infos.push({ file: rel, kind, rows: dataRows, accepted, ...minMax(parsed.map((a) => a.date)) });
    } else {
      infos.push({
        file: rel,
        kind,
        rows: dataRows,
        accepted: 0,
        note: `ヘッダから種類を判定できませんでした: ${header.slice(0, 6).join(", ")}`,
      });
    }
  }

  const transactions = [...txnById.values()].sort((a, b) =>
    a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date),
  );
  const assets = [...assetByKey.values()].sort((a, b) =>
    a.date === b.date ? a.name.localeCompare(b.name) : a.date.localeCompare(b.date),
  );

  return { transactions, assets, files: infos, dataDir, loadedAt: new Date().toISOString() };
}

/** ファイルの mtime / サイズから、再読み込みが必要かどうかを判断するための署名。 */
function signature(dataDir: string): string {
  return walkCsvFiles(dataDir)
    .map((f) => {
      try {
        const s = statSync(f);
        return `${f}:${s.mtimeMs}:${s.size}`;
      } catch {
        return `${f}:missing`;
      }
    })
    .join("\n");
}

let cache: { dataDir: string; sig: string; dataset: Dataset } | null = null;

/** キャッシュ付きのデータセット取得。CSV を追加・更新すると自動で読み直す。 */
export function getDataset(dataDir = resolveDataDir()): Dataset {
  if (!existsSync(dataDir)) {
    return { transactions: [], assets: [], files: [], dataDir, loadedAt: new Date().toISOString() };
  }
  const sig = signature(dataDir);
  if (cache && cache.dataDir === dataDir && cache.sig === sig) return cache.dataset;
  const dataset = loadDataset(dataDir);
  cache = { dataDir, sig, dataset };
  return dataset;
}

/** テスト用にキャッシュを捨てる。 */
export function clearCache(): void {
  cache = null;
}
