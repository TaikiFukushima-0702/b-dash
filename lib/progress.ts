import "server-only";
import { getCharacterStateFresh, writeCharacterState } from "./data";
import { computeXp } from "./xp";
import { stageForLevel } from "./character";
import { diffDays } from "./date";

export interface ProgressInput {
  today: string; // YYYY-MM-DD (JST)
  minutes: number;
  problemsAttempted: number;
  problemsCorrect: number;
  hasReflection: boolean;
}

export interface ProgressResult {
  xp: number;
  totalXp: number;
  level: number;
  stage: number;
  stageName: string;
  streak: number;
  evolved: boolean;
  leveledUp: boolean;
  prevLevel: number;
  prevStage: number;
}

/**
 * 学習セッションを反映する共通処理。
 * ストリークを更新 → XP を算出 → キャラ状態を書き込み、結果を返す。
 * （StudyLog 自体の作成は呼び出し側が返り値の xp を使って行う）
 */
export async function recordProgress(input: ProgressInput): Promise<ProgressResult> {
  const char = await getCharacterStateFresh();

  // ストリーク更新。
  let streak: number;
  if (char.lastStudyDate === input.today) {
    streak = Math.max(1, char.streak); // 本日は既に学習済み → 維持
  } else if (char.lastStudyDate && diffDays(input.today, char.lastStudyDate) === 1) {
    streak = char.streak + 1; // 連続
  } else {
    streak = 1; // 途切れ or 初回
  }

  const xp = computeXp({
    minutes: input.minutes,
    problemsAttempted: input.problemsAttempted,
    problemsCorrect: input.problemsCorrect,
    hasReflection: input.hasReflection,
    streakDays: streak,
  });

  const totalXp = char.totalXp + xp;
  const prevLevel = char.level;
  const prevStage = char.stage || stageForLevel(prevLevel);

  const { level, stage, stageName } = await writeCharacterState({
    totalXp,
    streak,
    lastStudyDate: input.today,
  });

  return {
    xp,
    totalXp,
    level,
    stage,
    stageName,
    streak,
    evolved: stage > prevStage,
    leveledUp: level > prevLevel,
    prevLevel,
    prevStage,
  };
}
