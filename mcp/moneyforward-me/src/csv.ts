/**
 * CSV の読み取りユーティリティ。
 * マネーフォワード ME がはき出す CSV は Shift_JIS（BOM 無し）が既定だが、
 * 環境によっては UTF-8 で保存されることもあるため自動判別する。
 */

/** BOM / UTF-8 妥当性を見て Shift_JIS と UTF-8 を自動判別しデコードする。 */
export function decodeCsv(buf: Uint8Array): string {
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(buf.subarray(3));
  }
  try {
    // fatal: true なので、Shift_JIS のバイト列はここで例外になる。
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("shift_jis").decode(buf);
  }
}

/** RFC 4180 準拠の CSV パーサ（引用符内の改行・カンマ・"" のエスケープに対応）。 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // 完全な空行は落とす
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** ヘッダ名の表記ゆれ（BOM・全角空白・前後空白・引用符）を吸収する。 */
export function normalizeHeader(raw: string): string {
  return raw
    .replace(/^﻿/, "")
    .replace(/[　\s]/g, "")
    .replace(/^"|"$/g, "")
    .trim();
}

/**
 * "2024/01/05"・"2024-1-5"・"2024/01/05 12:34" などを YYYY-MM-DD に正規化する。
 * 解釈できない場合は null。
 */
export function parseDate(raw: string): string | null {
  const s = raw.trim();
  const m = s.match(/^(\d{4})[/\-年](\d{1,2})[/\-月](\d{1,2})/);
  if (!m) return null;
  const [, y, mo, d] = m as unknown as [string, string, string, string];
  const month = Number(mo);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * "-1,234"・"¥1,234"・"1234円"・"(1,234)" などを数値に変換する。
 * 数値として読めない場合は null。
 */
export function parseAmount(raw: string): number | null {
  let s = raw.trim().replace(/[¥￥,、\s円]/g, "");
  if (s === "") return null;
  let sign = 1;
  if (/^\((.*)\)$/.test(s)) {
    sign = -1;
    s = s.replace(/^\(|\)$/g, "");
  }
  // 全角数字・全角記号を半角に
  s = s.replace(/[０-９．＋－]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0),
  );
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n * sign;
}

/** "1" / "true" / "はい" などを真とみなす。空文字は fallback。 */
export function parseFlag(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  const s = raw.trim();
  if (s === "") return fallback;
  return s === "1" || /^(true|yes|はい|○)$/i.test(s);
}
