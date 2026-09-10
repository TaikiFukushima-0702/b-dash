/** マネーフォワード ME の「収入・支出詳細」CSV 1 行分。金額の符号は MF のまま（支出 = 負, 収入 = 正）。 */
export type Transaction = {
  /** MF の ID 列。無い場合は内容から生成した合成キー。 */
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** 内容（店舗名など） */
  content: string;
  /** 円。支出は負、収入は正。 */
  amount: number;
  /** 保有金融機関 */
  institution: string;
  /** 大項目 */
  category: string;
  /** 中項目 */
  subcategory: string;
  memo: string;
  /** 振替（口座間移動）フラグ */
  isTransfer: boolean;
  /** 「計算対象」列。0 の行は家計簿の集計対象外。 */
  included: boolean;
  /** 由来 CSV のファイル名 */
  sourceFile: string;
};

/** 資産 CSV の 1 点（日付 × 資産項目 → 残高）。 */
export type AssetPoint = {
  /** YYYY-MM-DD */
  date: string;
  /** 資産項目名（金融機関名・資産クラス名など、CSV の列名 or 行の名称列） */
  name: string;
  /** 円 */
  amount: number;
  sourceFile: string;
};

/** 読み込んだ CSV 1 ファイルの素性。 */
export type SourceFileInfo = {
  file: string;
  kind: "transactions" | "assets" | "unknown";
  rows: number;
  /** 取り込まれた件数（重複除外後） */
  accepted: number;
  from?: string;
  to?: string;
  note?: string;
};

export type Dataset = {
  transactions: Transaction[];
  assets: AssetPoint[];
  files: SourceFileInfo[];
  dataDir: string;
  loadedAt: string;
};
