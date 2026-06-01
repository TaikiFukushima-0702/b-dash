"use server";

import { revalidatePath } from "next/cache";
import {
  createReviewItem,
  listAllReviews,
  updateReviewItem,
} from "@/lib/data";
import { applyGrade, DEFAULT_EASE, GRADES, type Grade } from "@/lib/srs";
import { isNotionConfigured } from "@/lib/notion";
import { isValidCategory } from "@/lib/fe-categories";
import { addDays, todayJst } from "@/lib/date";

/** 復習カードの採点（フォームの action として使うため void を返す）。 */
export async function gradeReview(formData: FormData): Promise<void> {
  if (!isNotionConfigured()) return;

  const id = String(formData.get("id") || "");
  const grade = String(formData.get("grade") || "") as Grade;
  if (!id || !GRADES.includes(grade)) return;

  try {
    const all = await listAllReviews();
    const item = all.find((r) => r.id === id);
    if (!item) return;

    const result = applyGrade(
      { easeFactor: item.easeFactor, intervalDays: item.intervalDays, repetitions: item.repetitions },
      grade,
    );

    await updateReviewItem(id, {
      easeFactor: result.easeFactor,
      intervalDays: result.intervalDays,
      repetitions: result.repetitions,
      dueDate: result.dueDate,
      lastResult: grade,
      lastReviewed: todayJst(),
      status: result.mastered ? "Mastered" : "Active",
    });
    revalidatePath("/review");
  } catch (e) {
    console.error(e);
  }
}

export async function addReviewItem(
  _prev: { ok: boolean; message: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  if (!isNotionConfigured()) return { ok: false, message: "Notion 未設定です。" };

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "");
  const sourceRef = String(formData.get("sourceRef") || "");
  if (!name) return { ok: false, message: "復習したいトピックを入力してください。" };

  try {
    await createReviewItem({
      name,
      category: isValidCategory(category) ? category : "",
      sourceRef,
      // 今日から復習対象にする。
      dueDate: addDays(todayJst(), 0),
      easeFactor: DEFAULT_EASE,
    });
    return { ok: true, message: "復習キューに追加しました。" };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "追加に失敗しました。" };
  }
}
