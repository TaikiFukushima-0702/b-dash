// 学習ログの集計（純関数）。ダッシュボード表示と週次レビューの土台。
import type { StudyLog } from "./types";
import { diffDays } from "./date";

export interface WeeklySummary {
  minutes: number;
  xp: number;
  problemsAttempted: number;
  problemsCorrect: number;
  studiedDays: number; // 直近7日で学習した日数
  accuracy: number | null; // 過去問の正答率（挑戦0ならnull）
}

/** today を含む直近 days 日分のログを集計する。 */
export function summarize(logs: StudyLog[], today: string, days = 7): WeeklySummary {
  const inRange = logs.filter((l) => {
    if (!l.date) return false;
    const d = diffDays(today, l.date);
    return d >= 0 && d < days;
  });

  const minutes = inRange.reduce((s, l) => s + l.minutes, 0);
  const xp = inRange.reduce((s, l) => s + l.xp, 0);
  const problemsAttempted = inRange.reduce((s, l) => s + l.problemsAttempted, 0);
  const problemsCorrect = inRange.reduce((s, l) => s + l.problemsCorrect, 0);
  const studiedDays = new Set(inRange.map((l) => l.date)).size;

  return {
    minutes,
    xp,
    problemsAttempted,
    problemsCorrect,
    studiedDays,
    accuracy: problemsAttempted > 0 ? problemsCorrect / problemsAttempted : null,
  };
}
