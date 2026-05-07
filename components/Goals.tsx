"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/store";
import { useToast } from "./Toast";
import type { Goal } from "@/lib/types";

function defaultDeadline(daysAhead = 30) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Goals() {
  const goals = useGameStore((s) => s.goals);
  const totalXp = useGameStore((s) => s.character.totalXp);
  const addGoal = useGameStore((s) => s.addGoal);
  const removeGoal = useGameStore((s) => s.removeGoal);
  const { push } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetXp, setTargetXp] = useState(500);
  const [bonusXp, setBonusXp] = useState(150);
  const [bonusGold, setBonusGold] = useState(200);
  const [deadline, setDeadline] = useState(defaultDeadline(30));

  const submit = () => {
    if (!title.trim()) {
      push({ title: "タイトルを入れてね", tone: "warning", emoji: "📌" });
      return;
    }
    if (targetXp <= 0) {
      push({ title: "目標XPは1以上にしてね", tone: "warning", emoji: "🎯" });
      return;
    }
    addGoal({
      title,
      description: description || undefined,
      targetXp,
      bonusXp,
      bonusGold,
      deadline,
    });
    push({ title: "目標を追加！", emoji: "🎯", tone: "success" });
    setTitle("");
    setDescription("");
  };

  const active = goals.filter((g) => g.status === "active");
  const archived = goals.filter((g) => g.status !== "active");

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border-4 border-frame-dark bg-white p-4 shadow-pop">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <h2 className="text-lg font-bold text-frame-dark">中・長期目標をつくる</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold text-frame-mid">タイトル</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: TOEIC 800点をめざす"
              className="mt-1 w-full rounded-xl border-2 border-frame-dark bg-frame-light px-3 py-2 text-sm font-bold text-frame-dark"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold text-frame-mid">説明 (任意)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border-2 border-frame-dark bg-frame-light px-3 py-2 text-sm text-frame-dark"
            />
          </label>
          <NumField label="目標XP" value={targetXp} onChange={setTargetXp} step={50} />
          <NumField label="しめきり" value={deadline} onChange={setDeadline} type="date" />
          <NumField label="ボーナスXP" value={bonusXp} onChange={setBonusXp} step={10} />
          <NumField label="ボーナスG" value={bonusGold} onChange={setBonusGold} step={20} />
        </div>
        <button
          type="button"
          onClick={submit}
          className="mt-4 w-full rounded-2xl border-4 border-frame-dark bg-pop-purple px-4 py-3 font-bold text-frame-dark shadow-pop transition active:translate-y-0.5"
        >
          目標を追加 ✨
        </button>
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-frame-dark">
          <span>📌</span>
          いまの目標 ({active.length})
        </h3>
        {active.length === 0 ? (
          <div className="rounded-2xl border-4 border-dashed border-frame-mid bg-white/70 p-5 text-center text-sm font-bold text-frame-mid">
            目標を立てて、達成すればボーナスがもらえるよ🏅
          </div>
        ) : (
          <ul className="space-y-3">
            {active.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                totalXp={totalXp}
                onRemove={() => {
                  removeGoal(g.id);
                  push({ title: "目標をけしたよ", emoji: "🗑️" });
                }}
              />
            ))}
          </ul>
        )}
      </section>

      {archived.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-frame-dark">
            <span>🏆</span>
            きろく ({archived.length})
          </h3>
          <ul className="space-y-2">
            {archived.map((g) => (
              <li
                key={g.id}
                className={`flex items-center justify-between rounded-2xl border-4 border-frame-dark px-3 py-2 shadow-pop ${
                  g.status === "completed" ? "bg-pop-green" : "bg-frame-light"
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-frame-dark">
                    {g.status === "completed" ? "🏅" : "💤"} {g.title}
                  </div>
                  <div className="text-[11px] text-frame-mid">
                    {g.status === "completed"
                      ? `達成: ${formatDate(g.completedAt ?? "")}`
                      : `期限: ${formatDate(g.deadline)} (未達成)`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeGoal(g.id)}
                  className="rounded-xl border-2 border-frame-dark bg-white px-2 py-1 text-[11px] font-bold text-frame-dark"
                >
                  けす
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  totalXp,
  onRemove,
}: {
  goal: Goal;
  totalXp: number;
  onRemove: () => void;
}) {
  const earned = Math.max(0, totalXp - goal.startingTotalXp);
  const pct = Math.min(100, (earned / goal.targetXp) * 100);
  const days = daysBetween(new Date(), new Date(goal.deadline));
  return (
    <li className="rounded-2xl border-4 border-frame-dark bg-white p-3 shadow-pop">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="text-base font-bold text-frame-dark">{goal.title}</div>
          {goal.description && (
            <div className="text-xs text-frame-mid">{goal.description}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-xl border-2 border-frame-dark bg-frame-light px-2 py-1 text-[10px] font-bold text-frame-dark"
        >
          けす
        </button>
      </div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-frame-mid">
        <span>進捗 {Math.floor(earned)} / {goal.targetXp} XP</span>
        <span>のこり {days >= 0 ? `${days}日` : "期限切れ"}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full border-2 border-frame-dark bg-frame-light">
        <div
          className="h-full bg-pop-purple transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 text-[11px] font-bold text-frame-mid">
        達成すると 🪙 +{goal.bonusGold} / ⭐ +{goal.bonusXp}
      </div>
    </li>
  );
}

function NumField({
  label,
  value,
  onChange,
  type = "number",
  step = 1,
}: {
  label: string;
  value: number | string;
  onChange: (v: any) => void;
  type?: string;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-frame-mid">{label}</span>
      <input
        type={type}
        step={step}
        value={value as any}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        className="mt-1 w-full rounded-xl border-2 border-frame-dark bg-frame-light px-3 py-2 text-sm font-bold text-frame-dark"
      />
    </label>
  );
}
