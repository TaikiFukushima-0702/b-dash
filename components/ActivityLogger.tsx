"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/store";
import { ACTIVITY_META } from "@/lib/gameData";
import type { ActivityType } from "@/lib/types";
import { useToast } from "./Toast";

const PRESETS = [10, 20, 30, 45, 60, 90];

export default function ActivityLogger() {
  const recordActivity = useGameStore((s) => s.recordActivity);
  const { push } = useToast();

  const [type, setType] = useState<ActivityType>("study");
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(30);

  const submit = () => {
    if (minutes <= 0) {
      push({ title: "時間を入力してね", tone: "warning", emoji: "⏰" });
      return;
    }
    const result = recordActivity({ type, title, minutes });
    push({
      title: `+${result.log.xp} XP / +${result.log.gold} G`,
      body: `${ACTIVITY_META[type].label}を${minutes}分がんばった！`,
      emoji: ACTIVITY_META[type].emoji,
      tone: "success",
    });
    if (result.leveledUp) {
      push({
        title: `Lv.${result.newLevel} に上がった！`,
        emoji: "🎉",
        tone: "success",
      });
    }
    if (result.evolved) {
      push({
        title: "進化した！",
        body: "新しいすがたを見にいこう",
        emoji: "✨",
        tone: "success",
      });
    }
    for (const goal of result.goalsCompleted) {
      push({
        title: `目標達成！『${goal.title}』`,
        body: `+${goal.bonusXp} XP / +${goal.bonusGold} G ボーナス`,
        emoji: "🏅",
        tone: "success",
      });
    }
    setTitle("");
  };

  return (
    <div className="rounded-[24px] border-4 border-frame-dark bg-white p-4 shadow-pop">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xl">📝</span>
        <h2 className="text-lg font-bold text-frame-dark">きょうの活動を記録</h2>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {(Object.keys(ACTIVITY_META) as ActivityType[]).map((k) => {
          const m = ACTIVITY_META[k];
          const active = type === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setType(k)}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-frame-dark px-2 py-2 text-xs font-bold shadow-pop transition active:translate-y-0.5 ${
                active ? `${m.color} ring-2 ring-frame-dark` : "bg-frame-light"
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="text-frame-dark">{m.label}</span>
            </button>
          );
        })}
      </div>

      <label className="mb-2 block">
        <span className="text-xs font-bold text-frame-mid">なにをした？(任意)</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: TOEIC単語50個"
          className="mt-1 w-full rounded-xl border-2 border-frame-dark bg-frame-light px-3 py-2 text-sm font-bold text-frame-dark outline-none focus:bg-white"
        />
      </label>

      <div className="mb-3">
        <span className="text-xs font-bold text-frame-mid">なんぷんやった？</span>
        <div className="mt-1 flex flex-wrap gap-2">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMinutes(n)}
              className={`rounded-full border-2 border-frame-dark px-3 py-1 text-xs font-bold shadow-pop transition active:translate-y-0.5 ${
                minutes === n ? "bg-pop-yellow" : "bg-white"
              }`}
            >
              {n}分
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={600}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-20 rounded-full border-2 border-frame-dark bg-white px-3 py-1 text-center text-xs font-bold"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        className="w-full rounded-2xl border-4 border-frame-dark bg-pop-pink px-4 py-3 text-base font-bold text-frame-dark shadow-pop transition active:translate-y-0.5"
      >
        記録してXPをもらう ✨
      </button>
    </div>
  );
}
