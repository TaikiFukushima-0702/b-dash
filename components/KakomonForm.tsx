"use client";

import { useActionState } from "react";
import { recordKakomonSession } from "@/app/actions/kakomon";
import type { ActionResult } from "@/app/actions/study";
import CategoryPicker from "./CategoryPicker";
import SubmitButton, { fieldClass, labelClass } from "./SubmitButton";
import ResultBanner from "./ResultBanner";
import { Card } from "./ui";

const KAKOMON_URL = "https://www.fe-siken.com/fekakomon.php";

export default function KakomonForm({ today }: { today: string }) {
  const [state, formAction] = useActionState<ActionResult | undefined, FormData>(
    recordKakomonSession,
    undefined,
  );

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <p className="text-sm text-[var(--muted)]">
          まず過去問道場で問題を解き、戻って結果を記録しましょう。
          <br />
          <span className="text-[11px]">
            ※問題文は著作物のためアプリには保存しません。解いた数・正答数のみ記録します。
          </span>
        </p>
        <a
          href={KAKOMON_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-center text-sm font-bold text-[#22252e] active:scale-[0.98]"
        >
          🔗 過去問道場を開く
        </a>
      </Card>

      <form action={formAction} className="space-y-4">
        <ResultBanner result={state} />
        <Card className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>日付</label>
              <input type="date" name="date" defaultValue={today} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>挑戦数</label>
              <input type="number" name="attempted" min={0} inputMode="numeric" placeholder="20" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>正答数</label>
              <input type="number" name="correct" min={0} inputMode="numeric" placeholder="14" className={fieldClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>時間（分・任意）</label>
            <input type="number" name="minutes" min={0} inputMode="numeric" placeholder="30" className={fieldClass} />
          </div>
        </Card>

        <Card>
          <label className={labelClass}>解いた分野</label>
          <CategoryPicker />
        </Card>

        <Card>
          <label className={labelClass}>メモ・振り返り（任意, +10 XP）</label>
          <textarea name="reflection" rows={3} placeholder="間違えた論点など" className={fieldClass} />
        </Card>

        <SubmitButton>結果を記録</SubmitButton>
      </form>
    </div>
  );
}
