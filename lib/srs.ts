// 間隔反復（復習）の SM-2-lite 実装。純関数。
import { addDays, todayJst } from "./date";

export type Grade = "Again" | "Hard" | "Good" | "Easy";

export const GRADES: Grade[] = ["Again", "Hard", "Good", "Easy"];

const QUALITY: Record<Grade, number> = {
  Again: 2,
  Hard: 3,
  Good: 4,
  Easy: 5,
};

export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;
/** この間隔（日）を超えたら習得済みとみなす。 */
export const MASTERED_INTERVAL = 60;

export interface SrsState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface SrsResult extends SrsState {
  dueDate: string; // "YYYY-MM-DD"
  mastered: boolean;
}

/**
 * 採点結果から次の SRS 状態を計算する。
 * SM-2 を簡略化し、4段階の採点に対応。
 */
export function applyGrade(prev: SrsState, grade: Grade, today = todayJst()): SrsResult {
  const q = QUALITY[grade];
  let { easeFactor, intervalDays, repetitions } = prev;

  if (grade === "Again") {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);

    // EaseFactor 更新（SM-2 の式）。
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < MIN_EASE) easeFactor = MIN_EASE;
  }

  // Hard はやや短めに。
  if (grade === "Hard" && intervalDays > 1) {
    intervalDays = Math.max(1, Math.round(intervalDays * 0.7));
  }

  easeFactor = Math.round(easeFactor * 1000) / 1000;
  const dueDate = addDays(today, intervalDays);
  const mastered = intervalDays > MASTERED_INTERVAL;

  return { easeFactor, intervalDays, repetitions, dueDate, mastered };
}

export function newItemState(): SrsState {
  return { easeFactor: DEFAULT_EASE, intervalDays: 0, repetitions: 0 };
}
