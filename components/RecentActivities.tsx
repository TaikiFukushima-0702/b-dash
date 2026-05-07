"use client";

import { useGameStore } from "@/lib/store";
import { ACTIVITY_META } from "@/lib/gameData";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecentActivities({ limit = 8 }: { limit?: number }) {
  const activities = useGameStore((s) => s.activities);
  const recent = activities.slice(0, limit);

  if (recent.length === 0) {
    return (
      <div className="rounded-[24px] border-4 border-dashed border-frame-mid bg-white/70 p-6 text-center text-sm font-bold text-frame-mid">
        まだ記録がないよ！1件目を入力してみよう 🌱
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border-4 border-frame-dark bg-white p-4 shadow-pop">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">🗒️</span>
        <h2 className="text-base font-bold text-frame-dark">さいきんの記録</h2>
      </div>
      <ul className="divide-y-2 divide-dashed divide-frame-mid/40">
        {recent.map((a) => {
          const meta = ACTIVITY_META[a.type];
          return (
            <li key={a.id} className="flex items-center gap-3 py-2">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 border-frame-dark ${meta.color}`}>
                <span className="text-lg">{meta.emoji}</span>
              </span>
              <div className="flex-1">
                <div className="text-sm font-bold text-frame-dark">{a.title}</div>
                <div className="text-[11px] text-frame-mid">
                  {meta.label}・{a.minutes}分・{formatDate(a.createdAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-pop-pink">+{a.xp} XP</div>
                <div className="text-[11px] font-bold text-frame-mid">+{a.gold} G</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
