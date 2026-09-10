import assert from "node:assert/strict";
import { test } from "node:test";

import { parseBoundary, previousPeriod, resolvePeriod } from "../dist/period.js";

const NOW = new Date(2026, 8, 10); // 2026-09-10（ローカルタイム）

test("プリセットから期間を決める", () => {
  assert.deepEqual(resolvePeriod({ preset: "this_month" }, NOW), {
    start: "2026-09-01",
    end: "2026-09-30",
    label: "2026年9月",
  });
  assert.deepEqual(resolvePeriod({ preset: "last_month" }, NOW), {
    start: "2026-08-01",
    end: "2026-08-31",
    label: "2026年8月",
  });
  assert.equal(resolvePeriod({ preset: "last_3_months" }, NOW).start, "2026-07-01");
  assert.equal(resolvePeriod({ preset: "last_3_months" }, NOW).end, "2026-09-10");
  assert.equal(resolvePeriod({ preset: "last_year" }, NOW).start, "2025-01-01");
  assert.equal(resolvePeriod({ preset: "last_year" }, NOW).end, "2025-12-31");
});

test("指定が無ければ今月", () => {
  assert.equal(resolvePeriod({}, NOW).start, "2026-09-01");
});

test("from/to はプリセットより優先され、月・年の指定も展開される", () => {
  assert.deepEqual(resolvePeriod({ preset: "this_month", from: "2026-07", to: "2026-08" }, NOW), {
    start: "2026-07-01",
    end: "2026-08-31",
    label: "2026-07-01 〜 2026-08-31",
  });
  assert.equal(resolvePeriod({ from: "2025" }, NOW).start, "2025-01-01");
  assert.equal(parseBoundary("2026-02", "end"), "2026-02-28");
  assert.equal(parseBoundary("2024-02", "end"), "2024-02-29"); // うるう年
  assert.equal(parseBoundary("だめな値", "start"), null);
});

test("壊れた期間指定はエラーにする", () => {
  assert.throws(() => resolvePeriod({ from: "きのう" }, NOW), /from の日付を解釈できません/);
  assert.throws(() => resolvePeriod({ from: "2026-08-01", to: "2026-07-01" }, NOW), /開始 .* より後/);
});

test("月ぴったりの期間は前月に、それ以外は同じ日数だけ前にずらす", () => {
  assert.deepEqual(previousPeriod({ start: "2026-09-01", end: "2026-09-30", label: "" }), {
    start: "2026-08-01",
    end: "2026-08-31",
    label: "2026年8月",
  });
  const twoMonths = previousPeriod({ start: "2026-07-01", end: "2026-08-31", label: "" });
  assert.equal(twoMonths.start, "2026-05-01");
  assert.equal(twoMonths.end, "2026-06-30");

  const week = previousPeriod({ start: "2026-09-08", end: "2026-09-14", label: "" });
  assert.equal(week.start, "2026-09-01");
  assert.equal(week.end, "2026-09-07");
});
