// キャラクターの進化段階ロジック。レベル → 進化ステージ → 画像パスの解決。

import { levelForXp } from "./xp";

export interface StageDef {
  stage: number; // 1..4
  name: string; // ステージ名
  minLevel: number; // このステージになる最小レベル
  blurb: string; // 説明文
}

// 4段階の進化（しきい値は調整可能）。
// レベル曲線 (xpForLevel=100*L^1.5) と FE の現実的な総学習量（合計 3〜4万XP ≒ Lv14前後）に
// 合わせて設定。Lv5≈基礎固め / Lv9≈直前期 / Lv13≈合格圏 のイメージ。
export const STAGES: StageDef[] = [
  { stage: 1, name: "ビットの芽", minLevel: 1, blurb: "生まれたての学びの種。まずは毎日コツコツ。" },
  { stage: 2, name: "ロジカルフォックス", minLevel: 5, blurb: "基礎が身につき、論理が芽生えてきた。" },
  { stage: 3, name: "アルゴウルフ", minLevel: 9, blurb: "アルゴリズムを操る成熟した姿。" },
  { stage: 4, name: "マスターサーバル", minLevel: 13, blurb: "合格圏の風格。完全体。" },
];

export const MAX_STAGE = STAGES.length;

/** レベルから進化ステージ番号を返す。 */
export function stageForLevel(level: number): number {
  let s = 1;
  for (const def of STAGES) {
    if (level >= def.minLevel) s = def.stage;
  }
  return s;
}

export function stageDef(stage: number): StageDef {
  return STAGES.find((s) => s.stage === stage) ?? STAGES[0];
}

/** 累積 XP から現在ステージ。 */
export function stageForXp(totalXp: number): number {
  return stageForLevel(levelForXp(totalXp));
}

/** ステージ画像のパス（/public/characters/stage-N.png）。 */
export function imageForStage(stage: number): string {
  const s = Math.min(Math.max(1, stage), MAX_STAGE);
  return `/characters/stage-${s}.png`;
}

/** 次の進化までに必要なレベル。最終ステージなら null。 */
export function levelsToNextStage(level: number): { nextStage: number; nextLevel: number } | null {
  const current = stageForLevel(level);
  const next = STAGES.find((s) => s.stage === current + 1);
  if (!next) return null;
  return { nextStage: next.stage, nextLevel: next.minLevel };
}
