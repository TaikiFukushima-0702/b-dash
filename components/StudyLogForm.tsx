"use client";

import { useActionState } from "react";
import { logStudy, type ActionResult } from "@/app/actions/study";
import { STUDY_SOURCES } from "@/lib/fe-categories";
import CategoryPicker from "./CategoryPicker";
import SubmitButton, { fieldClass, labelClass } from "./SubmitButton";
import ResultBanner from "./ResultBanner";
import CelebrationOverlay from "./CelebrationOverlay";
import { Card } from "./ui";

export default function StudyLogForm({ today }: { today: string }) {
  const [state, formAction] = useActionState<ActionResult | undefined, FormData>(logStudy, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <CelebrationOverlay result={state} />
      <ResultBanner result={state} />
      <Card className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>日付</label>
            <input type="date" name="date" defaultValue={today} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>学習時間（分）</label>
            <input type="number" name="minutes" min={0} inputMode="numeric" placeholder="30" className={fieldClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>教材</label>
          <select name="source" defaultValue="キタミ式" className={fieldClass}>
            {STUDY_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>章・範囲（任意）</label>
          <input name="chapter" placeholder="例: 第3章 2進数の計算" className={fieldClass} />
        </div>

        <div>
          <label className={labelClass}>気分（任意）</label>
          <div className="flex gap-2">
            {["😀", "😐", "😫"].map((m, i) => (
              <label key={m} className="flex-1">
                <input type="radio" name="mood" value={m} className="peer sr-only" defaultChecked={i === 0} />
                <span className="block cursor-pointer rounded-xl border border-[var(--border)] py-2 text-center text-xl peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary)]/10">
                  {m}
                </span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <label className={labelClass}>学習したカテゴリ</label>
        <CategoryPicker />
      </Card>

      <Card>
        <label className={labelClass}>振り返り（+10 XP ボーナス）</label>
        <textarea
          name="reflection"
          rows={3}
          placeholder="今日わかったこと・つまずいたこと"
          className={fieldClass}
        />
      </Card>

      <SubmitButton>記録してXPを獲得</SubmitButton>
    </form>
  );
}
