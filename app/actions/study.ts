"use server";

import { createStudyLog } from "@/lib/data";
import { recordProgress } from "@/lib/progress";
import { isNotionConfigured } from "@/lib/notion";
import { isValidCategory } from "@/lib/fe-categories";
import { todayJst } from "@/lib/date";

export interface ActionResult {
  ok: boolean;
  message: string;
  xp?: number;
  level?: number;
  evolved?: boolean;
  leveledUp?: boolean;
  stageName?: string;
}

function num(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** キタミ式など一般の学習を記録する。 */
export async function logStudy(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  if (!isNotionConfigured()) {
    return { ok: false, message: "Notion が未設定です。環境変数を設定してください。" };
  }

  const date = String(formData.get("date") || todayJst());
  const minutes = num(formData.get("minutes"));
  const source = String(formData.get("source") || "キタミ式");
  const chapter = String(formData.get("chapter") || "");
  const reflection = String(formData.get("reflection") || "");
  const mood = String(formData.get("mood") || "");
  const categories = formData
    .getAll("categories")
    .map(String)
    .filter(isValidCategory);

  if (minutes <= 0 && categories.length === 0 && !reflection) {
    return { ok: false, message: "学習時間か内容を入力してください。" };
  }

  try {
    const progress = await recordProgress({
      today: date,
      minutes,
      problemsAttempted: 0,
      problemsCorrect: 0,
      hasReflection: reflection.trim().length > 0,
    });

    await createStudyLog({
      date,
      minutes,
      source,
      categories,
      chapter,
      problemsAttempted: 0,
      problemsCorrect: 0,
      xp: progress.xp,
      reflection,
      mood,
    });

    return {
      ok: true,
      message: `${progress.xp} XP を獲得！`,
      xp: progress.xp,
      level: progress.level,
      evolved: progress.evolved,
      leveledUp: progress.leveledUp,
      stageName: progress.stageName,
    };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "記録に失敗しました。Notion の共有設定を確認してください。" };
  }
}
