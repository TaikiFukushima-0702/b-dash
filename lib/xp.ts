// XP・レベル計算（純関数・テスト容易）。ゲーミフィケーションの核。
// しきい値・係数はここに集約し、UI を触らず調整可能にする。

// ---- 調整可能な定数 ----
export const XP_PER_MINUTE = 1; // 学習1分あたりのXP
export const XP_PER_CORRECT = 5; // 過去問の正答1問あたり
export const XP_PER_ATTEMPT = 1; // 過去問の挑戦1問あたり（努力点）
export const XP_REFLECTION_BONUS = 10; // 振り返りを書いたときのボーナス
export const STREAK_BONUS_PER_DAY = 0.02; // 連続日数あたりの倍率増
export const STREAK_BONUS_CAP = 1.5; // 倍率の上限

export interface XpInput {
  minutes: number;
  problemsAttempted: number;
  problemsCorrect: number;
  hasReflection: boolean;
  /** ボーナス計算に使う連続学習日数（このセッション時点）。 */
  streakDays: number;
}

/** ストリーク倍率（1.0〜STREAK_BONUS_CAP）。 */
export function streakMultiplier(streakDays: number): number {
  return Math.min(1 + Math.max(0, streakDays) * STREAK_BONUS_PER_DAY, STREAK_BONUS_CAP);
}

/** 1回の学習記録で得られる XP。 */
export function computeXp(input: XpInput): number {
  const base =
    Math.max(0, input.minutes) * XP_PER_MINUTE +
    Math.max(0, input.problemsCorrect) * XP_PER_CORRECT +
    Math.max(0, input.problemsAttempted) * XP_PER_ATTEMPT +
    (input.hasReflection ? XP_REFLECTION_BONUS : 0);
  return Math.round(base * streakMultiplier(input.streakDays));
}

// ---- レベル曲線 ----
// xpForLevel(L): レベル L から L+1 に上がるために必要な XP。
export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

/** レベル L に到達するまでに必要な累積 XP（L=1 なら 0）。 */
export function totalXpToReach(level: number): number {
  let sum = 0;
  for (let l = 1; l < level; l++) sum += xpForLevel(l);
  return sum;
}

/** 累積 XP から現在レベルを求める。 */
export function levelForXp(totalXp: number): number {
  let level = 1;
  while (totalXp >= totalXpToReach(level + 1)) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  /** 現レベル内での獲得 XP。 */
  xpIntoLevel: number;
  /** 次レベルまでに必要な XP。 */
  xpForNext: number;
  /** 0〜1 の進捗率。 */
  ratio: number;
}

/** 現在レベルと次レベルまでの進捗を返す。 */
export function levelProgress(totalXp: number): LevelProgress {
  const level = levelForXp(totalXp);
  const floor = totalXpToReach(level);
  const xpForNext = xpForLevel(level);
  const xpIntoLevel = totalXp - floor;
  return {
    level,
    xpIntoLevel,
    xpForNext,
    ratio: xpForNext > 0 ? Math.min(1, xpIntoLevel / xpForNext) : 0,
  };
}
