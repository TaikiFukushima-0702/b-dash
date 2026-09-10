import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { assetTrend, latestSnapshot, snapshotAt } from "../dist/assets.js";
import { loadDataset } from "../dist/load.js";

const SAMPLE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "sample-data");
const ASSETS = loadDataset(SAMPLE).assets;

test("最新スナップショットは「合計」列をそのまま総資産にする", () => {
  const snap = latestSnapshot(ASSETS);
  assert.equal(snap.date, "2026-08-31");
  assert.equal(snap.total, 5_042_000);
  assert.equal(snap.totalSource, "csv");
  // 合計列は内訳から除く
  assert.ok(!snap.items.some((i) => i.name === "合計"));
  assert.equal(snap.items.reduce((s, i) => s + i.amount, 0), 5_042_000);
});

test("as_of を指定するとその日以前で最新の時点を返す", () => {
  assert.equal(latestSnapshot(ASSETS, "2026-07-31").date, "2026-07-31");
  assert.equal(latestSnapshot(ASSETS, "2026-08-15").date, "2026-07-31");
  assert.equal(latestSnapshot(ASSETS, "2026-01-01"), null);
});

test("合計列が無ければ内訳から算出する", () => {
  const rows = [
    { date: "2026-08-31", name: "みずほ銀行", amount: 1_000_000, sourceFile: "x.csv" },
    { date: "2026-08-31", name: "住宅ローン", amount: 20_000_000, sourceFile: "x.csv" },
  ];
  const snap = snapshotAt(rows, "2026-08-31");
  assert.equal(snap.totalSource, "computed");
  // 名前が負債系の項目は負債として 0 以下で報告する
  assert.equal(snap.liabilities, -20_000_000);
});

test("月次の資産推移は各月の最終記録日を採用する", () => {
  const points = assetTrend(ASSETS, { start: "2026-01-01", end: "2026-12-31" });
  assert.deepEqual(
    points.map((p) => [p.period, p.date, p.total]),
    [
      ["2026-06", "2026-06-30", 4_820_000],
      ["2026-07", "2026-07-31", 4_915_000],
      ["2026-08", "2026-08-31", 5_042_000],
    ],
  );
  assert.equal(points[0].diff, null);
  assert.equal(points[2].diff, 5_042_000 - 4_915_000);
});
