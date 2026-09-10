import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { comparePeriods, filterTransactions, inventory, summarize, totals } from "../dist/analyze.js";
import { loadDataset } from "../dist/load.js";

const SAMPLE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "sample-data");
const ALL = loadDataset(SAMPLE).transactions;
const AUGUST = { start: "2026-08-01", end: "2026-08-31" };

test("既定では振替と計算対象外を除外する", () => {
  const kept = filterTransactions(ALL, { start: "2026-07-01", end: "2026-08-31" });
  assert.equal(kept.length, 19); // 22 件 - 振替 2 件 - 計算対象外 1 件
  assert.equal(
    filterTransactions(ALL, { start: "2026-07-01", end: "2026-08-31", includeTransfers: true, includeExcluded: true })
      .length,
    22,
  );
});

test("支出だけを取り出し、符号を反転して合計する", () => {
  const expenses = filterTransactions(ALL, { ...AUGUST, kind: "expense" });
  const sum = totals(expenses);
  assert.equal(sum.income, 0);
  // 8 月の支出（振替 61,000 円を除く）
  assert.equal(sum.expense, 980 + 13200 + 11200 + 9800 + 2640 + 98000 + 6600 + 4100 + 3280 + 7650);
});

test("大項目で集計し、支出の大きい順に並べる", () => {
  const rows = summarize(filterTransactions(ALL, { ...AUGUST, kind: "expense" }), "category");
  assert.equal(rows[0].key, "住宅");
  assert.equal(rows[0].expense, 98000);
  const food = rows.find((r) => r.key === "食費");
  assert.equal(food.expense, 980 + 11200 + 9800 + 7650);
  assert.equal(food.count, 4);
});

test("キーワードは内容・メモ・費目・金融機関を横断して部分一致する", () => {
  const pokemon = filterTransactions(ALL, { start: "2026-07-01", end: "2026-08-31", keyword: "ポケカ" });
  assert.equal(pokemon.length, 2); // メモに「ポケカ」を含む 2 件
  const suica = filterTransactions(ALL, { start: "2026-07-01", end: "2026-08-31", institutions: ["Suica"] });
  assert.equal(suica.length, 2);
});

test("金額レンジは絶対値で判定する", () => {
  const big = filterTransactions(ALL, { ...AUGUST, kind: "expense", minAmount: 10000 });
  assert.deepEqual(
    big.map((t) => t.content).sort(),
    ["Amazon.co.jp", "スーパーマルエツ", "家賃"].sort(),
  );
});

test("2 期間の差分を増減の大きい順に返す", () => {
  const cur = summarize(filterTransactions(ALL, { ...AUGUST, kind: "expense" }), "category");
  const prev = summarize(
    filterTransactions(ALL, { start: "2026-07-01", end: "2026-07-31", kind: "expense" }),
    "category",
  );
  const diffs = comparePeriods(cur, prev, "expense");
  const hobby = diffs.find((d) => d.key === "趣味・娯楽");
  assert.equal(hobby.current, 13200 + 6600);
  assert.equal(hobby.previous, 4980);
  assert.equal(hobby.diff, 14820);
  // 8 月にしか無い費目は前期 0 → 比率は null（"新規" 表示）
  assert.equal(diffs.find((d) => d.key === "日用品").ratio, null);
  // 並び順は増減の絶対値降順
  const abs = diffs.map((d) => Math.abs(d.diff));
  assert.deepEqual(abs, [...abs].sort((a, b) => b - a));
});

test("費目・金融機関の一覧を作る", () => {
  const inv = inventory(filterTransactions(ALL, { start: "2026-07-01", end: "2026-08-31", kind: "expense" }));
  assert.equal(inv.categories[0].name, "住宅");
  assert.ok(inv.institutions.some((i) => i.name === "三井住友カード"));
});
