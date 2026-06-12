"use client";

import { useActionState } from "react";
import { createScheduleItem } from "@/app/actions/schedule";
import { SCHEDULE_TYPES } from "@/lib/fe-categories";
import SubmitButton, { fieldClass, labelClass } from "./SubmitButton";
import { Card } from "./ui";

export default function ScheduleForm({ today }: { today: string }) {
  const [state, formAction] = useActionState(createScheduleItem, undefined);

  return (
    <form action={formAction} className="space-y-3">
      {state?.message && (
        <p className={`text-sm ${state.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
          {state.message}
        </p>
      )}
      <Card className="space-y-3">
        <div>
          <label className={labelClass}>予定名</label>
          <input name="name" placeholder="例: 第5章を読む / 模試を受ける" className={fieldClass} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>日付</label>
            <input type="date" name="date" defaultValue={today} className={fieldClass} required />
          </div>
          <div>
            <label className={labelClass}>種別</label>
            <select name="type" defaultValue="学習計画" className={fieldClass}>
              {SCHEDULE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <SubmitButton>予定を追加</SubmitButton>
      </Card>
    </form>
  );
}
