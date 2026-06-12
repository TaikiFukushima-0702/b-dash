// FE（基本情報技術者試験）シラバスの統制語彙。
// ここが「正本」。Notion の select / multi_select 選択肢はこの一覧をミラーする。
// アプリ・統計・Claude 分析の全てがこの語彙を共有することで分析の信頼性を担保する。

export type Syllabus = "テクノロジ系" | "マネジメント系" | "ストラテジ系";

export interface FeCategory {
  /** カテゴリ名（Notion の select 値と一致させる）。 */
  name: string;
  /** 大分類。 */
  syllabus: Syllabus;
}

export const FE_CATEGORIES: FeCategory[] = [
  // --- テクノロジ系 ---
  { name: "基礎理論", syllabus: "テクノロジ系" },
  { name: "アルゴリズムとプログラミング", syllabus: "テクノロジ系" },
  { name: "コンピュータ構成要素", syllabus: "テクノロジ系" },
  { name: "システム構成要素", syllabus: "テクノロジ系" },
  { name: "ソフトウェア", syllabus: "テクノロジ系" },
  { name: "ハードウェア", syllabus: "テクノロジ系" },
  { name: "ヒューマンインタフェース", syllabus: "テクノロジ系" },
  { name: "マルチメディア", syllabus: "テクノロジ系" },
  { name: "データベース", syllabus: "テクノロジ系" },
  { name: "ネットワーク", syllabus: "テクノロジ系" },
  { name: "セキュリティ", syllabus: "テクノロジ系" },
  { name: "システム開発技術", syllabus: "テクノロジ系" },
  { name: "ソフトウェア開発管理技術", syllabus: "テクノロジ系" },
  // --- マネジメント系 ---
  { name: "プロジェクトマネジメント", syllabus: "マネジメント系" },
  { name: "サービスマネジメント", syllabus: "マネジメント系" },
  { name: "システム監査", syllabus: "マネジメント系" },
  // --- ストラテジ系 ---
  { name: "システム戦略", syllabus: "ストラテジ系" },
  { name: "システム企画", syllabus: "ストラテジ系" },
  { name: "経営戦略マネジメント", syllabus: "ストラテジ系" },
  { name: "技術戦略マネジメント", syllabus: "ストラテジ系" },
  { name: "ビジネスインダストリ", syllabus: "ストラテジ系" },
  { name: "企業活動", syllabus: "ストラテジ系" },
  { name: "法務", syllabus: "ストラテジ系" },
];

export const CATEGORY_NAMES: string[] = FE_CATEGORIES.map((c) => c.name);

export const SYLLABUS_ORDER: Syllabus[] = ["テクノロジ系", "マネジメント系", "ストラテジ系"];

export function syllabusOf(categoryName: string): Syllabus | undefined {
  return FE_CATEGORIES.find((c) => c.name === categoryName)?.syllabus;
}

export function isValidCategory(name: string): boolean {
  return CATEGORY_NAMES.includes(name);
}

/** 学習ソースの統制語彙。 */
export const STUDY_SOURCES = ["キタミ式", "過去問道場", "その他"] as const;
export type StudySource = (typeof STUDY_SOURCES)[number];

/** スケジュール種別。 */
export const SCHEDULE_TYPES = ["学習計画", "模試", "試験本番", "復習"] as const;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];
