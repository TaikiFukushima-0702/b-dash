"use server";

import { createStudyLog, incrementCategoryStat } from "@/lib/data";
import { recordProgress } from "@/lib/progress";
import { isNotionConfigured } from "@/lib/notion";
import { isValidCategory } from "@/lib/fe-categories";
import { todayJst } from "@/lib/date";
import type { ActionResult } from "./study";

function num(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** 過去問道場のセッション結果（自己申告）を記録する。著作権のため問題文は保存しない。 */
export async function recordKakomonSession(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  if (!isNotionConfigured()) {
    return { ok: false, message: "Notion が未設定です。環境変数を設定してください。" };
  }

  const date = String(formData.get("date") || todayJst());
  const minutes = num(formData.get("minutes"));
  const attempted = num(formData.get("attempted"));
  const correct = Math.min(num(formData.get("correct")), attempted);
  const reflection = String(formData.get("reflection") || "");
  const categories = formData.getAll("categories").map(String).filter(isValidCategory);

  if (attempted <= 0) {
    return { ok: false, message: "挑戦した問題数を入力してください。" };
  }

  try {
    const progress = await recordProgress({
      today: date,
      minutes,
      problemsAttempted: attempted,
      problemsCorrect: correct,
      hasReflection: reflection.trim().length > 0,
    });

    await createStudyLog({
      date,
      minutes,
      source: "過去問道場",
      categories,
      chapter: "",
      problemsAttempted: attempted,
      problemsCorrect: correct,
      xp: progress.xp,
      reflection,
      mood: "",
    });

    // カテゴリ別正答率を更新。複数カテゴリ選択時は均等に按分する。
    if (categories.length > 0) {
      const perAttempted = Math.round(attempted / categories.length);
      const perCorrect = Math.round(correct / categories.length);
      for (const c of categories) {
        await incrementCategoryStat(c, perAttempted, perCorrect);
      }
    }

    const acc = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    return {
      ok: true,
      message: `正答率 ${acc}%・${progress.xp} XP を獲得！`,
      xp: progress.xp,
      level: progress.level,
      stage: progress.stage,
      evolved: progress.evolved,
      leveledUp: progress.leveledUp,
      stageName: progress.stageName,
    };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "記録に失敗しました。Notion の共有設定を確認してください。" };
  }
}
