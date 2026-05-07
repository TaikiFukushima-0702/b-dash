"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import HydrationGate from "@/components/HydrationGate";

function SettingsInner() {
  const character = useGameStore((s) => s.character);
  const setName = useGameStore((s) => s.setName);
  const reset = useGameStore((s) => s.reset);
  const { push } = useToast();
  const [name, setLocalName] = useState(character.name);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border-4 border-frame-dark bg-pop-purple px-4 py-2 shadow-pop">
        <span className="text-2xl">⚙️</span>
        <span className="font-bold text-frame-dark">せってい</span>
      </div>

      <section className="rounded-[24px] border-4 border-frame-dark bg-white p-4 shadow-pop">
        <h2 className="mb-2 text-base font-bold text-frame-dark">なまえをかえる</h2>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setLocalName(e.target.value)}
            maxLength={12}
            className="flex-1 rounded-xl border-2 border-frame-dark bg-frame-light px-3 py-2 text-sm font-bold text-frame-dark"
          />
          <button
            type="button"
            onClick={() => {
              setName(name);
              push({ title: "なまえを変えたよ", emoji: "🪪", tone: "success" });
            }}
            className="rounded-xl border-2 border-frame-dark bg-pop-yellow px-3 py-2 text-sm font-bold shadow-pop"
          >
            ほぞん
          </button>
        </div>
      </section>

      <section className="rounded-[24px] border-4 border-frame-dark bg-white p-4 shadow-pop">
        <h2 className="mb-2 text-base font-bold text-frame-dark">データについて</h2>
        <p className="mb-3 text-xs text-frame-mid">
          ブラウザの localStorage にきろくしているよ。ブラウザのデータを消すと
          リセットされるよ。
        </p>
        <p className="mb-3 text-xs text-frame-mid">
          🔒 いつかログイン機能を追加して、ともだちと比較できるようにする予定！
        </p>
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-xl border-2 border-frame-dark bg-frame-light px-3 py-2 text-sm font-bold text-frame-dark"
          >
            データをリセット
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                reset();
                setConfirming(false);
                push({ title: "リセットしたよ", emoji: "♻️" });
              }}
              className="flex-1 rounded-xl border-2 border-frame-dark bg-pop-orange px-3 py-2 text-sm font-bold shadow-pop"
            >
              ほんとうにリセット
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-xl border-2 border-frame-dark bg-white px-3 py-2 text-sm font-bold"
            >
              キャンセル
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <HydrationGate>
      <SettingsInner />
    </HydrationGate>
  );
}
