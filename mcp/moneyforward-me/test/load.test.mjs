import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { classify, loadDataset } from "../dist/load.js";

const SAMPLE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "sample-data");

test("ヘッダの内容だけで CSV の種類を判定する", () => {
  assert.equal(classify(["計算対象", "日付", "内容", "金額（円）", "保有金融機関", "大項目"]), "transactions");
  assert.equal(classify(["日付", "合計", "預金・現金", "投資信託"]), "assets");
  assert.equal(classify(["日付", "名称", "残高"]), "assets");
  assert.equal(classify(["名前", "備考"]), "unknown");
});

test("サンプルの Shift_JIS CSV を読み、重なった月の明細を ID で重複排除する", () => {
  const ds = loadDataset(SAMPLE);
  // 7 月分 10 件 + 8 月分 14 件（うち 2 件は 7 月と重複）
  assert.equal(ds.transactions.length, 22);
  assert.equal(ds.files.filter((f) => f.kind === "transactions").length, 2);
  assert.equal(new Set(ds.transactions.map((t) => t.id)).size, 22);

  const starbucks = ds.transactions.filter((t) => t.content === "スターバックス");
  assert.equal(starbucks.length, 1);
  assert.equal(starbucks[0].amount, -680);
});

test("振替・計算対象外のフラグを取り込む", () => {
  const ds = loadDataset(SAMPLE);
  assert.equal(ds.transactions.filter((t) => t.isTransfer).length, 2);
  assert.equal(ds.transactions.filter((t) => !t.included).length, 1);
});

test("横持ちの資産 CSV を日付 × 項目に展開する", () => {
  const ds = loadDataset(SAMPLE);
  assert.equal(ds.assets.length, 18); // 3 日付 × 6 列
  const latest = ds.assets.filter((a) => a.date === "2026-08-31");
  assert.equal(latest.find((a) => a.name === "合計").amount, 5_042_000);
  assert.equal(latest.find((a) => a.name === "投資信託").amount, 1_852_000);
});

test("存在しないフォルダでも落ちない", () => {
  const ds = loadDataset(path.join(SAMPLE, "no-such-dir"));
  assert.deepEqual(ds.transactions, []);
  assert.deepEqual(ds.files, []);
});
