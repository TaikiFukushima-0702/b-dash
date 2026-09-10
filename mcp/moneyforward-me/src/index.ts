#!/usr/bin/env node
/**
 * マネーフォワード ME MCP サーバー
 *
 * マネーフォワード ME には個人向けの公開 API が無いため、
 * 「家計簿からエクスポートした CSV をローカルフォルダに置く」方式でデータを渡す。
 * サーバーはそのフォルダを読み取るだけで、MF にログインもアクセスもしない。
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  comparePeriods,
  filterTransactions,
  inventory,
  summarize,
  totals,
  type GroupKey,
  type TxnFilter,
} from "./analyze.js";
import { assetTrend, latestSnapshot } from "./assets.js";
import { budgetReport, loadBudget, saveBudget, type Budget } from "./budget.js";
import { bar, mdTable, pct, signedYen, yen } from "./format.js";
import { getDataset, resolveDataDir } from "./load.js";
import {
  PERIOD_PRESETS,
  PeriodError,
  monthOf,
  previousPeriod,
  resolvePeriod,
  type Period,
  type PeriodPreset,
} from "./period.js";
import type { Dataset, Transaction } from "./types.js";

const server = new McpServer(
  { name: "moneyforward-me", version: "0.1.0" },
  {
    instructions: [
      "マネーフォワード ME からエクスポートした家計簿 CSV を読み、支出の集計・明細検索・資産の把握・予算チェックを行うサーバーです。",
      "金額は円。支出は正の値で報告します（CSV 上はマイナス）。",
      "既定では「振替」と「計算対象 = 0」の行を集計から除外します。",
      "まず list_datasets でどの期間のデータが揃っているか確認してから集計すると、期間の取り違えを防げます。",
    ].join("\n"),
  },
);

const textResult = (body: string) => ({ content: [{ type: "text" as const, text: body }] });
const errorResult = (body: string) => ({ content: [{ type: "text" as const, text: body }], isError: true });

const SETUP_HINT = [
  "取引データが 1 件も読み込めませんでした。",
  "",
  "1. マネーフォワード ME の Web 版 → 「家計簿」→「入出金」→ 画面右上の「ダウンロード」から、",
  "   月ごとの CSV（収入・支出詳細_YYYY-MM-DD_YYYY-MM-DD.csv）を保存します。",
  `2. 保存した CSV を \`${resolveDataDir()}\` に置きます（サブフォルダに入れても構いません）。`,
  "3. 置き場所を変えたい場合は環境変数 MF_DATA_DIR にフォルダのパスを設定してください。",
  "",
  "資産推移の CSV を同じフォルダに置くと、資産・残高のツールも使えるようになります。",
].join("\n");

/** データセットを読み、取引が空なら案内を投げる。 */
function requireTransactions(): Dataset {
  const ds = getDataset();
  if (ds.transactions.length === 0) throw new PeriodError(SETUP_HINT);
  return ds;
}

const periodShape = {
  period: z
    .enum(PERIOD_PRESETS)
    .optional()
    .describe("期間のプリセット。from/to を指定した場合はそちらが優先。既定は this_month。"),
  from: z.string().optional().describe("開始日。YYYY-MM-DD / YYYY-MM / YYYY のいずれか（両端含む）。"),
  to: z.string().optional().describe("終了日。YYYY-MM-DD / YYYY-MM / YYYY のいずれか（両端含む）。"),
};

const filterShape = {
  categories: z.array(z.string()).optional().describe("大項目（例: 食費, 交通費）。部分一致。"),
  subcategories: z.array(z.string()).optional().describe("中項目（例: 食料品）。部分一致。"),
  institutions: z.array(z.string()).optional().describe("保有金融機関名。部分一致。"),
  keyword: z.string().optional().describe("内容・メモ・費目・金融機関を横断する部分一致キーワード。"),
  min_amount: z.number().nonnegative().optional().describe("金額の絶対値の下限（円）。"),
  max_amount: z.number().nonnegative().optional().describe("金額の絶対値の上限（円）。"),
  include_transfers: z.boolean().default(false).describe("振替（口座間移動）を含めるか。"),
  include_excluded: z.boolean().default(false).describe("「計算対象 = 0」の行を含めるか。"),
};

/** ツール引数の period/from/to を Period に解決する。fallback は period 未指定時のプリセット。 */
function periodFrom(
  args: { period?: PeriodPreset; from?: string; to?: string },
  fallback?: PeriodPreset,
): Period {
  const preset = args.period ?? fallback;
  return resolvePeriod({
    ...(preset ? { preset } : {}),
    ...(args.from ? { from: args.from } : {}),
    ...(args.to ? { to: args.to } : {}),
  });
}

type FilterArgs = {
  categories?: string[];
  subcategories?: string[];
  institutions?: string[];
  keyword?: string;
  min_amount?: number;
  max_amount?: number;
  include_transfers: boolean;
  include_excluded: boolean;
};

function toFilter(period: Period, args: FilterArgs, kind: TxnFilter["kind"]): TxnFilter {
  return {
    start: period.start,
    end: period.end,
    kind,
    ...(args.categories ? { categories: args.categories } : {}),
    ...(args.subcategories ? { subcategories: args.subcategories } : {}),
    ...(args.institutions ? { institutions: args.institutions } : {}),
    ...(args.keyword ? { keyword: args.keyword } : {}),
    ...(args.min_amount !== undefined ? { minAmount: args.min_amount } : {}),
    ...(args.max_amount !== undefined ? { maxAmount: args.max_amount } : {}),
    includeTransfers: args.include_transfers,
    includeExcluded: args.include_excluded,
  };
}

/** すべてのツールを同じ形でエラー処理する。 */
async function guard(fn: () => string | Promise<string>) {
  try {
    return textResult(await fn());
  } catch (err) {
    return errorResult(err instanceof Error ? err.message : String(err));
  }
}

// ---------------------------------------------------------------------------
// データの状態
// ---------------------------------------------------------------------------

server.registerTool(
  "list_datasets",
  {
    title: "読み込み状況を確認",
    description:
      "データフォルダにあるマネーフォワード ME の CSV を一覧し、種類・件数・カバーしている期間を表示する。集計の前にデータの抜けを確認するために使う。",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () =>
    guard(() => {
      const ds = getDataset();
      const lines: string[] = [`**データフォルダ**: \`${ds.dataDir}\``, ""];
      if (ds.files.length === 0) {
        lines.push(SETUP_HINT);
        return lines.join("\n");
      }
      lines.push(
        mdTable(
          ["ファイル", "種類", "行数", "取り込み", "期間", "備考"],
          ds.files.map((f) => [
            f.file,
            f.kind === "transactions" ? "取引" : f.kind === "assets" ? "資産" : "不明",
            f.rows,
            f.accepted,
            f.from && f.to ? `${f.from} 〜 ${f.to}` : "—",
            f.note ?? "",
          ]),
        ),
        "",
      );
      const t = ds.transactions;
      if (t.length > 0) {
        const months = [...new Set(t.map((x) => monthOf(x.date)))].sort();
        lines.push(
          `**取引**: ${t.length.toLocaleString("ja-JP")} 件（重複除外後） / ${t[0]!.date} 〜 ${t[t.length - 1]!.date}`,
        );
        // 月の抜けを検出する（期間の端から端まで連続しているか）
        const missing: string[] = [];
        const first = months[0]!;
        const last = months[months.length - 1]!;
        for (let y = Number(first.slice(0, 4)); y <= Number(last.slice(0, 4)); y++) {
          for (let m = 1; m <= 12; m++) {
            const key = `${y}-${String(m).padStart(2, "0")}`;
            if (key < first || key > last) continue;
            if (!months.includes(key)) missing.push(key);
          }
        }
        if (missing.length > 0) lines.push(`⚠️ データが無い月: ${missing.join(", ")}`);
      } else {
        lines.push("**取引**: 0 件");
      }
      if (ds.assets.length > 0) {
        const snap = latestSnapshot(ds.assets);
        lines.push(
          `**資産**: ${ds.assets.length.toLocaleString("ja-JP")} 点${snap ? ` / 最新 ${snap.date}（${yen(snap.total)}）` : ""}`,
        );
      } else {
        lines.push("**資産**: CSV 未配置");
      }
      const budget = loadBudget(ds.dataDir);
      const budgetCount = Object.keys(budget.monthly).length;
      lines.push(`**予算**: ${budgetCount > 0 ? `${budgetCount} 費目を設定済み` : "未設定（set_budget で設定できます）"}`);
      return lines.join("\n");
    }),
);

server.registerTool(
  "list_categories",
  {
    title: "費目・金融機関の一覧",
    description:
      "データに実際に登場する大項目・中項目・保有金融機関を、支出額の大きい順に一覧する。集計や検索で指定する名前を確認するために使う。",
    inputSchema: { ...periodShape },
    annotations: { readOnlyHint: true },
  },
  async (args) =>
    guard(() => {
      const ds = requireTransactions();
      const period = periodFrom(args, "all");
      const txns = filterTransactions(ds.transactions, { start: period.start, end: period.end });
      const inv = inventory(txns);
      const fmt = (rows: { name: string; count: number; expense: number }[]) =>
        mdTable(["名前", "件数", "支出合計"], rows.slice(0, 40).map((r) => [r.name, r.count, yen(r.expense)]));
      return [
        `期間: ${period.label}（${txns.length.toLocaleString("ja-JP")} 件）`,
        "",
        "### 大項目",
        fmt(inv.categories),
        "",
        "### 中項目",
        fmt(inv.subcategories),
        "",
        "### 保有金融機関",
        fmt(inv.institutions),
      ].join("\n");
    }),
);

// ---------------------------------------------------------------------------
// 明細検索
// ---------------------------------------------------------------------------

server.registerTool(
  "search_transactions",
  {
    title: "取引明細を検索",
    description:
      "期間・費目・金融機関・キーワード・金額レンジで取引明細を絞り込む。「Amazon の支出を全部出して」「1 万円以上の支出は？」のような質問に使う。",
    inputSchema: {
      ...periodShape,
      ...filterShape,
      kind: z.enum(["expense", "income", "all"]).default("expense").describe("支出だけ / 収入だけ / 両方。"),
      sort: z.enum(["date_desc", "date_asc", "amount_desc"]).default("date_desc"),
      limit: z.number().int().min(1).max(500).default(50).describe("表示する最大件数。合計は絞り込み全体で計算する。"),
    },
    annotations: { readOnlyHint: true },
  },
  async (args) =>
    guard(() => {
      const ds = requireTransactions();
      const period = periodFrom(args);
      const hits = filterTransactions(ds.transactions, toFilter(period, args, args.kind));
      const sorted = [...hits].sort((a, b) => {
        if (args.sort === "amount_desc") return Math.abs(b.amount) - Math.abs(a.amount);
        return args.sort === "date_asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      });
      const sum = totals(hits);
      const shown = sorted.slice(0, args.limit);
      const lines = [
        `期間: ${period.label} / 該当 ${hits.length.toLocaleString("ja-JP")} 件`,
        `支出合計 ${yen(sum.expense)} ・ 収入合計 ${yen(sum.income)} ・ 収支 ${signedYen(sum.net)}`,
        "",
        mdTable(
          ["日付", "内容", "金額", "大項目", "中項目", "金融機関"],
          shown.map((t: Transaction) => [
            t.date,
            t.content,
            yen(t.amount),
            t.category,
            t.subcategory || "—",
            t.institution || "—",
          ]),
        ),
      ];
      if (hits.length > shown.length) lines.push("", `…他 ${(hits.length - shown.length).toLocaleString("ja-JP")} 件（limit で増やせます）`);
      return lines.join("\n");
    }),
);

// ---------------------------------------------------------------------------
// 集計・分析
// ---------------------------------------------------------------------------

server.registerTool(
  "summarize_spending",
  {
    title: "支出を集計",
    description:
      "指定期間の支出（または収入）を、大項目・中項目・金融機関・月・内容のいずれかで集計する。前期間との比較も出せる。「今月の食費は？」「何にいくら使った？」に使う。",
    inputSchema: {
      ...periodShape,
      ...filterShape,
      group_by: z
        .enum(["category", "subcategory", "institution", "month", "day", "content"])
        .default("category")
        .describe("集計の切り口。"),
      kind: z.enum(["expense", "income", "all"]).default("expense"),
      top: z.number().int().min(1).max(100).default(20).describe("上位いくつまで表示するか。"),
      compare_with_previous: z.boolean().default(false).describe("同じ長さの直前の期間と比較する。"),
    },
    annotations: { readOnlyHint: true },
  },
  async (args) =>
    guard(() => {
      const ds = requireTransactions();
      const period = periodFrom(args);
      const txns = filterTransactions(ds.transactions, toFilter(period, args, args.kind));
      const rows = summarize(txns, args.group_by as GroupKey);
      const sum = totals(txns);
      const metric: "expense" | "income" = args.kind === "income" ? "income" : "expense";
      const grandTotal = metric === "income" ? sum.income : sum.expense;

      const lines = [
        `### ${period.label} の${metric === "income" ? "収入" : "支出"}集計（${args.group_by}）`,
        "",
        `合計 **${yen(grandTotal)}** / ${txns.length.toLocaleString("ja-JP")} 件`,
        "",
      ];

      if (args.compare_with_previous) {
        const prev = previousPeriod(period);
        const prevTxns = filterTransactions(ds.transactions, toFilter(prev, args, args.kind));
        const prevRows = summarize(prevTxns, args.group_by as GroupKey);
        const prevTotal = metric === "income" ? totals(prevTxns).income : totals(prevTxns).expense;
        const diffs = comparePeriods(rows, prevRows, metric);
        const byKey = new Map(diffs.map((d) => [d.key, d]));
        lines.push(
          `比較対象: ${prev.label}（合計 ${yen(prevTotal)} / ${signedYen(grandTotal - prevTotal)}）`,
          "",
          mdTable(
            ["区分", "今期", "前期", "増減", "構成比"],
            rows.slice(0, args.top).map((r) => {
              const d = byKey.get(r.key);
              const value = metric === "income" ? r.income : r.expense;
              return [
                r.key,
                yen(value),
                yen(d?.previous ?? 0),
                signedYen(d?.diff ?? value),
                grandTotal > 0 ? pct(value / grandTotal, 1) : "—",
              ];
            }),
          ),
        );
      } else {
        lines.push(
          mdTable(
            ["区分", "金額", "件数", "構成比"],
            rows.slice(0, args.top).map((r) => {
              const value = metric === "income" ? r.income : r.expense;
              return [r.key, yen(value), r.count, grandTotal > 0 ? pct(value / grandTotal, 1) : "—"];
            }),
          ),
        );
      }
      if (rows.length > args.top) lines.push("", `…他 ${rows.length - args.top} 区分`);
      return lines.join("\n");
    }),
);

server.registerTool(
  "monthly_trend",
  {
    title: "月次の推移",
    description:
      "月ごとの支出・収入・収支の推移を表示する。特定の費目に絞ることもできる。「食費はここ半年で増えている？」に使う。",
    inputSchema: {
      ...periodShape,
      ...filterShape,
    },
    annotations: { readOnlyHint: true },
  },
  async (args) =>
    guard(() => {
      const ds = requireTransactions();
      const period = periodFrom(args, "last_12_months");
      const txns = filterTransactions(ds.transactions, toFilter(period, args, "all"));
      const rows = summarize(txns, "month");
      if (rows.length === 0) return `${period.label} に該当する取引がありませんでした。`;
      const avgExpense = rows.reduce((s, r) => s + r.expense, 0) / rows.length;
      const avgIncome = rows.reduce((s, r) => s + r.income, 0) / rows.length;
      return [
        `### 月次推移（${period.label}）`,
        args.categories?.length ? `対象費目: ${args.categories.join(", ")}` : "",
        "",
        mdTable(
          ["月", "支出", "収入", "収支", "件数", "前月比"],
          rows.map((r, i) => {
            const prev = i > 0 ? rows[i - 1]! : null;
            return [
              r.key,
              yen(r.expense),
              yen(r.income),
              signedYen(r.net),
              r.count,
              prev ? signedYen(r.expense - prev.expense) : "—",
            ];
          }),
        ),
        "",
        `月平均: 支出 ${yen(avgExpense)} / 収入 ${yen(avgIncome)} / 収支 ${signedYen(avgIncome - avgExpense)}`,
      ]
        .filter(Boolean)
        .join("\n");
    }),
);

server.registerTool(
  "compare_periods",
  {
    title: "2 期間を比較",
    description:
      "2 つの期間の支出を突き合わせ、増減の大きい費目から並べる。比較対象を省略すると同じ長さの直前の期間を使う。「先月より増えた費目は？」に使う。",
    inputSchema: {
      ...periodShape,
      ...filterShape,
      baseline_from: z.string().optional().describe("比較対象期間の開始。省略時は同じ長さの直前の期間。"),
      baseline_to: z.string().optional().describe("比較対象期間の終了。"),
      group_by: z.enum(["category", "subcategory", "institution", "content"]).default("category"),
      metric: z.enum(["expense", "income", "net"]).default("expense"),
      top: z.number().int().min(1).max(100).default(15),
    },
    annotations: { readOnlyHint: true },
  },
  async (args) =>
    guard(() => {
      const ds = requireTransactions();
      const current = periodFrom(args);
      const baseline =
        args.baseline_from || args.baseline_to
          ? resolvePeriod({
              ...(args.baseline_from ? { from: args.baseline_from } : {}),
              ...(args.baseline_to ? { to: args.baseline_to } : {}),
            })
          : previousPeriod(current);

      const kind = args.metric === "income" ? "income" : args.metric === "expense" ? "expense" : "all";
      const curTxns = filterTransactions(ds.transactions, toFilter(current, args, kind));
      const baseTxns = filterTransactions(ds.transactions, toFilter(baseline, args, kind));
      const diffs = comparePeriods(
        summarize(curTxns, args.group_by as GroupKey),
        summarize(baseTxns, args.group_by as GroupKey),
        args.metric,
      );
      const curTotal = totals(curTxns);
      const baseTotal = totals(baseTxns);
      const pickTotal = (t: typeof curTotal) =>
        args.metric === "income" ? t.income : args.metric === "expense" ? t.expense : t.net;

      return [
        `### 期間比較（${args.metric}）`,
        "",
        `- 今期: ${current.label} → ${yen(pickTotal(curTotal))}`,
        `- 前期: ${baseline.label} → ${yen(pickTotal(baseTotal))}`,
        `- 差分: **${signedYen(pickTotal(curTotal) - pickTotal(baseTotal))}**`,
        "",
        mdTable(
          ["区分", "今期", "前期", "増減", "増減率"],
          diffs
            .slice(0, args.top)
            .map((d) => [d.key, yen(d.current), yen(d.previous), signedYen(d.diff), d.ratio === null ? "新規" : pct(d.ratio - 1, 1)]),
        ),
      ].join("\n");
    }),
);

// ---------------------------------------------------------------------------
// 資産
// ---------------------------------------------------------------------------

server.registerTool(
  "get_assets",
  {
    title: "資産・残高を確認",
    description:
      "資産 CSV から、最新（または指定日以前で最も新しい）時点の残高内訳と総資産を表示する。「今の総資産は？」「どの口座にいくらある？」に使う。",
    inputSchema: {
      as_of: z.string().optional().describe("この日付以前で最新のスナップショットを見る（YYYY-MM-DD）。"),
    },
    annotations: { readOnlyHint: true },
  },
  async (args) =>
    guard(() => {
      const ds = getDataset();
      if (ds.assets.length === 0) {
        return [
          "資産データが読み込めませんでした。",
          "",
          `マネーフォワード ME の「資産」画面からダウンロードした資産推移 CSV を \`${ds.dataDir}\` に置いてください。`,
          "1 列目が日付、以降の列が資産項目（または「日付・名称・金額」の 3 列）であれば読み込めます。",
        ].join("\n");
      }
      const snap = latestSnapshot(ds.assets, args.as_of);
      if (!snap) return `${args.as_of} 以前の資産データがありません。`;
      const positives = snap.items.filter((i) => i.amount >= 0).reduce((s, i) => s + i.amount, 0);
      return [
        `### 資産スナップショット（${snap.date} 時点）`,
        "",
        `**総資産: ${yen(snap.total)}**${snap.totalSource === "computed" ? "（明細の合計から算出）" : ""}`,
        snap.liabilities < 0 ? `負債: ${yen(snap.liabilities)} / 資産のみ: ${yen(positives)}` : "",
        "",
        mdTable(
          ["項目", "残高", "構成比"],
          snap.items.map((i) => [i.name, yen(i.amount), positives > 0 && i.amount > 0 ? pct(i.amount / positives, 1) : "—"]),
        ),
      ]
        .filter(Boolean)
        .join("\n");
    }),
);

server.registerTool(
  "asset_trend",
  {
    title: "資産の推移",
    description: "資産 CSV から総資産の推移（既定は月次）を表示する。増減の要因を見るときに使う。",
    inputSchema: {
      ...periodShape,
      granularity: z.enum(["month", "day"]).default("month"),
    },
    annotations: { readOnlyHint: true },
  },
  async (args) =>
    guard(() => {
      const ds = getDataset();
      if (ds.assets.length === 0) return "資産データが読み込めていません。get_assets の案内を参照してください。";
      const period = periodFrom(args, "last_12_months");
      const points = assetTrend(ds.assets, {
        start: period.start,
        end: period.end,
        granularity: args.granularity,
      });
      if (points.length === 0) return `${period.label} に資産データがありません。`;
      const first = points[0]!;
      const last = points[points.length - 1]!;
      return [
        `### 資産推移（${period.label} / ${args.granularity === "month" ? "月次" : "日次"}）`,
        "",
        mdTable(
          ["時点", "基準日", "総資産", "前期比"],
          points.map((p) => [p.period, p.date, yen(p.total), p.diff === null ? "—" : signedYen(p.diff)]),
        ),
        "",
        `期間全体の増減: **${signedYen(last.total - first.total)}**（${first.date} → ${last.date}）`,
      ].join("\n");
    }),
);

// ---------------------------------------------------------------------------
// 予算
// ---------------------------------------------------------------------------

server.registerTool(
  "set_budget",
  {
    title: "予算を設定",
    description:
      "大項目ごとの月額予算を設定する（データフォルダの budget.json に保存）。既定は既存設定へのマージ。get_budget_status と組み合わせて使う。",
    inputSchema: {
      budgets: z
        .array(
          z.object({
            category: z.string().describe("大項目名。list_categories の名前と一致させること。"),
            monthly_amount: z.number().nonnegative().describe("月額予算（円）。"),
          }),
        )
        .default([]),
      total_monthly: z.number().nonnegative().optional().describe("全体の月額予算（円）。省略時は費目の合計。"),
      remove: z.array(z.string()).default([]).describe("予算設定から外す大項目名。"),
      mode: z.enum(["merge", "replace"]).default("merge").describe("既存設定にマージするか、丸ごと置き換えるか。"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
  async (args) =>
    guard(() => {
      const dataDir = resolveDataDir();
      const existing = loadBudget(dataDir);
      const monthly: Record<string, number> = args.mode === "replace" ? {} : { ...existing.monthly };
      for (const b of args.budgets) monthly[b.category] = b.monthly_amount;
      for (const key of args.remove) delete monthly[key];

      const next: Budget = {
        version: 1,
        monthly,
        ...(args.total_monthly !== undefined
          ? { total: args.total_monthly }
          : args.mode === "replace"
            ? {}
            : existing.total !== undefined
              ? { total: existing.total }
              : {}),
      };
      const file = saveBudget(dataDir, next);
      const sum = Object.values(monthly).reduce((s, v) => s + v, 0);
      return [
        `予算を保存しました: \`${file}\``,
        "",
        mdTable(
          ["大項目", "月額予算"],
          Object.entries(monthly)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => [k, yen(v)]),
        ),
        "",
        `費目合計 ${yen(sum)}${next.total !== undefined ? ` / 全体予算 ${yen(next.total)}` : ""}`,
      ].join("\n");
    }),
);

server.registerTool(
  "get_budget_status",
  {
    title: "予算の消化状況",
    description:
      "対象月の支出を予算と突き合わせ、消化率・月末の着地見込み・超過アラートを表示する。「今月の予算は大丈夫？」に使う。",
    inputSchema: {
      month: z.string().optional().describe("対象月（YYYY-MM）。省略時は今月。"),
    },
    annotations: { readOnlyHint: true },
  },
  async (args) =>
    guard(() => {
      const ds = requireTransactions();
      const budget = loadBudget(ds.dataDir);
      if (Object.keys(budget.monthly).length === 0 && budget.total === undefined) {
        return [
          "予算がまだ設定されていません。",
          "",
          "set_budget で大項目ごとの月額予算を登録してください。",
          "例: 食費 60000 円、日用品 10000 円、交際費 20000 円。",
          "直近の実績から決めたい場合は summarize_spending（group_by=category, period=last_3_months）が参考になります。",
        ].join("\n");
      }
      const now = new Date();
      const month = args.month?.trim() || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return `month は YYYY-MM 形式（01〜12 月）で指定してください: "${month}"`;

      const report = budgetReport(ds.transactions, budget, month, now);
      const icon = (s: string) => (s === "超過" ? "🔴" : s === "ペース超過" ? "🟠" : s === "注意" ? "🟡" : s === "順調" ? "🟢" : "⚪️");

      const lines = [
        `### ${month} の予算消化状況`,
        "",
        `月の経過: ${pct(report.elapsed)}（残り ${report.daysLeft} 日）`,
        "",
        mdTable(
          ["", "大項目", "予算", "実績", "消化率", "残り", "月末見込み"],
          [
            ...report.rows.map((r) => [
              `${icon(r.status)} ${bar(r.usage ?? 0)}`,
              r.category,
              r.limit === null ? "—" : yen(r.limit),
              yen(r.spent),
              pct(r.usage),
              r.remaining === null ? "—" : yen(r.remaining),
              yen(r.projected),
            ]),
            [
              `${icon(report.totalRow.status)} ${bar(report.totalRow.usage ?? 0)}`,
              "**合計**",
              report.totalRow.limit === null ? "—" : yen(report.totalRow.limit),
              yen(report.totalRow.spent),
              pct(report.totalRow.usage),
              report.totalRow.remaining === null ? "—" : yen(report.totalRow.remaining),
              yen(report.totalRow.projected),
            ],
          ],
        ),
      ];

      const alerts = report.rows.filter((r) => r.status === "超過" || r.status === "ペース超過");
      if (alerts.length > 0) {
        lines.push(
          "",
          "#### ⚠️ アラート",
          ...alerts.map((r) =>
            r.status === "超過"
              ? `- 🔴 **${r.category}**: 予算 ${yen(r.limit ?? 0)} に対し ${yen(r.spent)}（${yen(Math.abs(r.remaining ?? 0))} 超過）`
              : `- 🟠 **${r.category}**: 現在 ${yen(r.spent)}。このペースだと月末 ${yen(r.projected)} で予算 ${yen(r.limit ?? 0)} を超えます`,
          ),
        );
      } else {
        lines.push("", "予算を超えそうな費目はありません。🟢");
      }

      if (report.unbudgeted.length > 0) {
        lines.push(
          "",
          "#### 予算未設定で支出がある費目",
          ...report.unbudgeted.slice(0, 10).map((u) => `- ${u.category}: ${yen(u.spent)}`),
        );
      }
      return lines.join("\n");
    }),
);

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout は MCP の通信路なので、ログは stderr に出す。
  console.error(`moneyforward-me MCP server started (data dir: ${resolveDataDir()})`);
}

main().catch((err) => {
  console.error("moneyforward-me MCP server failed to start:", err);
  process.exit(1);
});
