"use client";

import { useEffect, useState } from "react";
import CharacterArt from "./CharacterArt";
import type { ActionResult } from "@/app/actions/study";

const CONFETTI = ["#6d5efc", "#ffb020", "#34d399", "#f87171", "#60a5fa", "#fbbf24"];

/** レベルアップ／進化の結果を受けて全画面のお祝い演出を出す。タップで閉じる。 */
export default function CelebrationOverlay({ result }: { result?: ActionResult }) {
  // 表示済み(閉じた)結果を覚えておき、表示有無は派生値として計算する。
  const [dismissed, setDismissed] = useState<ActionResult | undefined>(undefined);
  const qualifies = !!(result?.ok && (result.evolved || result.leveledUp));
  const visible = qualifies && dismissed !== result;

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setDismissed(result), 4500);
    return () => clearTimeout(t);
  }, [visible, result]);

  if (!visible || !result) return null;

  return (
    <div
      onClick={() => setDismissed(result)}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/55 px-6 backdrop-blur-sm"
    >
      {/* 紙吹雪 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute top-[-10%] block h-2.5 w-2.5 rounded-[2px] animate-confetti"
            style={{
              left: `${(i * 4.3) % 100}%`,
              background: CONFETTI[i % CONFETTI.length],
              animationDelay: `${(i % 6) * 0.15}s`,
              animationDuration: `${2.2 + (i % 5) * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="animate-pop text-center">
        {result.evolved && (
          <div className="mb-3">
            <CharacterArt stage={result.stage ?? 1} size={180} uid="celebrate" className="mx-auto animate-float" />
          </div>
        )}
        <p className="text-3xl font-extrabold text-white drop-shadow">
          {result.evolved ? "✨ 進化した！" : "🎉 レベルアップ！"}
        </p>
        {result.evolved ? (
          <p className="mt-1 text-lg font-bold text-[var(--accent)]">「{result.stageName}」になった！</p>
        ) : (
          <p className="mt-1 text-lg font-bold text-white">Lv.{result.level} に到達！</p>
        )}
        <p className="mt-4 text-xs text-white/70">タップして閉じる</p>
      </div>
    </div>
  );
}
