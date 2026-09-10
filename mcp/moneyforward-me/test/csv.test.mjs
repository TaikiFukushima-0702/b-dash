import assert from "node:assert/strict";
import { test } from "node:test";

import { decodeCsv, parseAmount, parseCsv, parseDate, parseFlag } from "../dist/csv.js";

test("Shift_JIS の CSV をデコードできる", () => {
  const sjis = Buffer.from([0x93, 0xfa, 0x95, 0x74, 0x2c, 0x8b, 0xe0, 0x8a, 0x7a]); // 日付,金額
  assert.equal(decodeCsv(sjis), "日付,金額");
});

test("UTF-8 (BOM 有無どちらも) をデコードできる", () => {
  assert.equal(decodeCsv(Buffer.from("日付,金額", "utf-8")), "日付,金額");
  assert.equal(decodeCsv(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("日付", "utf-8")])), "日付");
});

test("引用符内のカンマ・改行・エスケープを扱える", () => {
  const rows = parseCsv('"a,1","b\nc","d""e"\r\n"f","g","h"\r\n');
  assert.deepEqual(rows, [
    ["a,1", "b\nc", 'd"e'],
    ["f", "g", "h"],
  ]);
});

test("空行は捨てる", () => {
  assert.deepEqual(parseCsv("a,b\n\n\nc,d\n"), [
    ["a", "b"],
    ["c", "d"],
  ]);
});

test("日付の表記ゆれを YYYY-MM-DD に正規化する", () => {
  assert.equal(parseDate("2026/07/02"), "2026-07-02");
  assert.equal(parseDate("2026-7-2"), "2026-07-02");
  assert.equal(parseDate("2026/07/02 12:34"), "2026-07-02");
  assert.equal(parseDate("よくわからない値"), null);
});

test("金額の表記ゆれを数値化する", () => {
  assert.equal(parseAmount("-1,234"), -1234);
  assert.equal(parseAmount("¥1,234"), 1234);
  assert.equal(parseAmount("1234円"), 1234);
  assert.equal(parseAmount("(1,234)"), -1234);
  assert.equal(parseAmount("１２３"), 123);
  assert.equal(parseAmount(""), null);
  assert.equal(parseAmount("—"), null);
});

test("フラグ列は空なら既定値にフォールバックする", () => {
  assert.equal(parseFlag("1", false), true);
  assert.equal(parseFlag("0", true), false);
  assert.equal(parseFlag("", true), true);
  assert.equal(parseFlag(undefined, true), true);
});
