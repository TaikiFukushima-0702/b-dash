"use server";

import { revalidatePath } from "next/cache";
import { createScheduleEvent, setScheduleDone } from "@/lib/data";
import { isNotionConfigured } from "@/lib/notion";
import { isValidCategory, SCHEDULE_TYPES } from "@/lib/fe-categories";

export async function createScheduleItem(
  _prev: { ok: boolean; message: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  if (!isNotionConfigured()) return { ok: false, message: "Notion 未設定です。" };

  const name = String(formData.get("name") || "").trim();
  const date = String(formData.get("date") || "");
  const endDate = String(formData.get("endDate") || "") || null;
  const type = String(formData.get("type") || "学習計画");
  const categories = formData.getAll("categories").map(String).filter(isValidCategory);

  if (!name || !date) return { ok: false, message: "予定名と日付を入力してください。" };

  try {
    await createScheduleEvent({
      name,
      date,
      endDate,
      type: (SCHEDULE_TYPES as readonly string[]).includes(type) ? type : "学習計画",
      categories,
    });
    return { ok: true, message: "予定を追加しました。" };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "追加に失敗しました。" };
  }
}

export async function toggleScheduleDone(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const done = String(formData.get("done") || "") === "true";
  if (!id) return;
  try {
    await setScheduleDone(id, !done);
    revalidatePath("/schedule");
  } catch (e) {
    console.error(e);
  }
}
