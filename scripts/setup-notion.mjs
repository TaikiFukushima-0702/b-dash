// Notion の 6 つのデータベースを正しいスキーマで一括作成するセットアップスクリプト。
//
// 使い方:
//   1) Notion で Integration を作成しトークンを取得（NOTION_TOKEN）
//   2) DB を置きたい「親ページ」を 1 つ作り、そのページを Integration に共有（接続）
//   3) 親ページの ID（URL 末尾の 32 桁。ハイフンあり/なしどちらでも可）を用意
//   4) 実行:
//        NOTION_TOKEN=secret_xxx node scripts/setup-notion.mjs <親ページID>
//      または npm run setup:notion -- <親ページID>
//
// 実行後、貼り付け用の NOTION_DB_* 環境変数が出力されます。
//
// ※ 分野(Category/Syllabus)の語彙は lib/fe-categories.ts のミラーです。変更時は両方を更新してください。

import { Client } from "@notionhq/client";

const FE_CATEGORIES = [
  ["基礎理論", "テクノロジ系"],
  ["アルゴリズムとプログラミング", "テクノロジ系"],
  ["コンピュータ構成要素", "テクノロジ系"],
  ["システム構成要素", "テクノロジ系"],
  ["ソフトウェア", "テクノロジ系"],
  ["ハードウェア", "テクノロジ系"],
  ["ヒューマンインタフェース", "テクノロジ系"],
  ["マルチメディア", "テクノロジ系"],
  ["データベース", "テクノロジ系"],
  ["ネットワーク", "テクノロジ系"],
  ["セキュリティ", "テクノロジ系"],
  ["システム開発技術", "テクノロジ系"],
  ["ソフトウェア開発管理技術", "テクノロジ系"],
  ["プロジェクトマネジメント", "マネジメント系"],
  ["サービスマネジメント", "マネジメント系"],
  ["システム監査", "マネジメント系"],
  ["システム戦略", "ストラテジ系"],
  ["システム企画", "ストラテジ系"],
  ["経営戦略マネジメント", "ストラテジ系"],
  ["技術戦略マネジメント", "ストラテジ系"],
  ["ビジネスインダストリ", "ストラテジ系"],
  ["企業活動", "ストラテジ系"],
  ["法務", "ストラテジ系"],
];

const categoryOptions = FE_CATEGORIES.map(([name]) => ({ name }));
const syllabusOptions = ["テクノロジ系", "マネジメント系", "ストラテジ系"].map((name) => ({ name }));

function opts(names) {
  return names.map((name) => ({ name }));
}

const token = process.env.NOTION_TOKEN;
const parentPageId = (process.argv[2] || process.env.NOTION_PARENT_PAGE_ID || "").trim();

if (!token) {
  console.error("✖ NOTION_TOKEN が未設定です。例: NOTION_TOKEN=secret_xxx node scripts/setup-notion.mjs <親ページID>");
  process.exit(1);
}
if (!parentPageId) {
  console.error("✖ 親ページ ID を指定してください。例: node scripts/setup-notion.mjs 1234abcd...（Integration に共有済みのページ）");
  process.exit(1);
}

const notion = new Client({ auth: token });

const databases = {
  NOTION_DB_STUDY_LOG: {
    title: "Study Log",
    properties: {
      Name: { title: {} },
      Date: { date: {} },
      Minutes: { number: {} },
      Source: { select: { options: opts(["キタミ式", "過去問道場", "その他"]) } },
      Category: { multi_select: { options: categoryOptions } },
      Chapter: { rich_text: {} },
      ProblemsAttempted: { number: {} },
      ProblemsCorrect: { number: {} },
      XP: { number: {} },
      Reflection: { rich_text: {} },
      Mood: { select: { options: opts(["😀", "😐", "😫"]) } },
      CreatedBy: { select: { options: opts(["app", "claude"]) } },
    },
  },
  NOTION_DB_REVIEW: {
    title: "Review Queue",
    properties: {
      Name: { title: {} },
      Category: { select: { options: categoryOptions } },
      SourceRef: { url: {} },
      EaseFactor: { number: {} },
      IntervalDays: { number: {} },
      Repetitions: { number: {} },
      DueDate: { date: {} },
      LastResult: { select: { options: opts(["Again", "Hard", "Good", "Easy"]) } },
      LastReviewed: { date: {} },
      Status: { select: { options: opts(["Active", "Suspended", "Mastered"]) } },
    },
  },
  NOTION_DB_SCHEDULE: {
    title: "Schedule",
    properties: {
      Name: { title: {} },
      Date: { date: {} },
      Type: { select: { options: opts(["学習計画", "模試", "試験本番", "復習"]) } },
      Category: { multi_select: { options: categoryOptions } },
      Done: { checkbox: {} },
      CalendarEventId: { rich_text: {} },
    },
  },
  NOTION_DB_CHARACTER: {
    title: "Character State",
    properties: {
      Name: { title: {} },
      TotalXP: { number: {} },
      Level: { number: {} },
      Stage: { number: {} },
      StageName: { rich_text: {} },
      Streak: { number: {} },
      LastStudyDate: { date: {} },
    },
  },
  NOTION_DB_CATEGORY_STATS: {
    title: "Category Stats",
    properties: {
      Name: { title: {} },
      TotalAttempted: { number: {} },
      TotalCorrect: { number: {} },
      Accuracy: {
        formula: {
          expression: 'if(prop("TotalAttempted") > 0, prop("TotalCorrect") / prop("TotalAttempted"), 0)',
        },
      },
      WeakFlag: {
        formula: {
          expression:
            'prop("TotalAttempted") >= 5 and (prop("TotalCorrect") / prop("TotalAttempted")) < 0.6',
        },
      },
      Syllabus: { select: { options: syllabusOptions } },
    },
  },
};

async function main() {
  console.log(`▶ 親ページ ${parentPageId} の下に 6 つの DB を作成します…\n`);
  const results = {};
  for (const [envName, def] of Object.entries(databases)) {
    try {
      const db = await notion.databases.create({
        parent: { type: "page_id", page_id: parentPageId },
        title: [{ type: "text", text: { content: def.title } }],
        properties: def.properties,
      });
      results[envName] = db.id;
      console.log(`  ✓ ${def.title.padEnd(16)} -> ${db.id}`);
    } catch (e) {
      console.error(`  ✖ ${def.title} の作成に失敗:`, e?.body || e?.message || e);
      console.error("    ヒント: 親ページが Integration に共有(接続)されているか確認してください。");
      process.exit(1);
    }
  }

  console.log("\n────────────────────────────────────────");
  console.log("✅ 完了！以下を .env.local / Vercel の環境変数に貼り付けてください:\n");
  console.log(`NOTION_TOKEN=${token}`);
  for (const [envName, id] of Object.entries(results)) {
    console.log(`${envName}=${id.replace(/-/g, "")}`);
  }
  console.log("\n（APP_PASSPHRASE と AUTH_SECRET も忘れずに設定してください）");
}

main();
