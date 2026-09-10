import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { budgetReport, elapsedRatio, loadBudget, saveBudget } from "../dist/budget.js";
import { loadDataset } from "../dist/load.js";

const SAMPLE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "sample-data");
const TXNS = loadDataset(SAMPLE).transactions;

test("月の経過率は当月なら日割り、過去月は 1、未来月は 0", () => {
  assert.equal(elapsedRatio("2026-09", new Date(2026, 8, 10)), 10 / 30);
  assert.equal(elapsedRatio("2026-08", new Date(2026, 8, 10)), 1);
  assert.equal(elapsedRatio("2026-10", new Date(2026, 8, 10)), 0);
  assert.equal(elapsedRatio("2026-09", new Date(2026, 8, 30)), 1);
});

test("予算と実績を突き合わせ、状態を判定する", () => {
  const budget = {
    version: 1,
    monthly: { 食費: 25000, 住宅: 98000, "趣味・娯楽": 30000, 交通費: 5000 },
  };
  // 8 月は終わっている月なので経過率 1（= 見込みは実績どおり）
  const report = budgetReport(TXNS, budget, "2026-08", new Date(2026, 8, 10));
  const byCategory = Object.fromEntries(report.rows.map((r) => [r.category, r]));

  assert.equal(byCategory["食費"].spent, 980 + 11200 + 9800 + 7650); // 29,630
  assert.equal(byCategory["食費"].status, "超過");
  assert.equal(byCategory["食費"].remaining, 25000 - 29630);

  assert.equal(byCategory["住宅"].spent, 98000);
  assert.equal(byCategory["住宅"].status, "超過"); // 予算ぴったりは超過扱い

  assert.equal(byCategory["趣味・娯楽"].spent, 19800);
  assert.equal(byCategory["趣味・娯楽"].status, "順調"); // 19,800 / 30,000 = 66% で 80% 未満
  assert.equal(byCategory["交通費"].status, "順調");
});

test("月の途中ならペース超過を検知する", () => {
  const budget = { version: 1, monthly: { 食費: 40000 } };
  // 8 月 10 日時点（経過率 10/31）で 8 月分の支出はすべて計上されている前提のダミー計算
  const report = budgetReport(TXNS, budget, "2026-08", new Date(2026, 7, 10));
  const food = report.rows.find((r) => r.category === "食費");
  assert.ok(food.projected > food.spent);
  assert.equal(food.status, "ペース超過");
  assert.ok(report.daysLeft > 0);
});

test("予算未設定で支出のある費目を拾う", () => {
  const report = budgetReport(TXNS, { version: 1, monthly: { 食費: 40000 } }, "2026-08", new Date(2026, 8, 10));
  const names = report.unbudgeted.map((u) => u.category);
  assert.ok(names.includes("住宅"));
  assert.ok(names.includes("水道・光熱費"));
  assert.ok(!names.includes("食費"));
  // 振替（その他 / 61,000 円）は集計に入れない
  assert.ok(!names.includes("その他"));
});

test("全体予算が未指定なら費目の合計を使う", () => {
  const report = budgetReport(TXNS, { version: 1, monthly: { 食費: 30000, 住宅: 100000 } }, "2026-08", new Date(2026, 8, 10));
  assert.equal(report.totalRow.limit, 130000);
  const withTotal = budgetReport(
    TXNS,
    { version: 1, monthly: { 食費: 30000 }, total: 200000 },
    "2026-08",
    new Date(2026, 8, 10),
  );
  assert.equal(withTotal.totalRow.limit, 200000);
});

test("budget.json を保存して読み戻せる／壊れた値は捨てる", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mf-budget-"));
  try {
    assert.deepEqual(loadBudget(dir), { version: 1, monthly: {} });
    saveBudget(dir, { version: 1, monthly: { 食費: 50000, ダメな値: Number.NaN }, total: 250000 });
    const loaded = loadBudget(dir);
    assert.equal(loaded.monthly["食費"], 50000);
    assert.equal(loaded.monthly["ダメな値"], undefined);
    assert.equal(loaded.total, 250000);
    assert.ok(loaded.updatedAt);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
