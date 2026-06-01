"use client";

import { useActionState } from "react";
import { addReviewItem } from "@/app/actions/review";
import { CATEGORY_NAMES } from "@/lib/fe-categories";
import SubmitButton, { fieldClass, labelClass } from "./SubmitButton";
import { Card } from "./ui";

export default function AddReviewForm({ defaultCategory = "" }: { defaultCategory?: string }) {
  const [state, formAction] = useActionState(addReviewItem, undefined);

  return (
    <form action={formAction} className="space-y-3">
      {state?.message && (
        <p className={`text-sm ${state.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
          {state.message}
        </p>
      )}
      <Card className="space-y-3">
        <div>
          <label className={labelClass}>復習したいトピック（自分の言葉で）</label>
          <input
            name="name"
            placeholder="例: サブネットマスクの計算手順"
            className={fieldClass}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>分野</label>
            <select name="category" defaultValue={defaultCategory} className={fieldClass}>
              <option value="">未選択</option>
              {CATEGORY_NAMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>参考URL（任意）</label>
            <input name="sourceRef" placeholder="https://..." className={fieldClass} />
          </div>
        </div>
        <SubmitButton>復習キューに追加</SubmitButton>
      </Card>
    </form>
  );
}
