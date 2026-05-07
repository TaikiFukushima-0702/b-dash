"use client";

import { useGameStore } from "@/lib/store";
import { EVOLUTION_STAGES, ITEM_BY_ID } from "@/lib/gameData";
import { useMemo } from "react";

export default function Character() {
  const character = useGameStore((s) => s.character);
  const inventory = useGameStore((s) => s.inventory);

  const stage = EVOLUTION_STAGES[character.evolutionIndex];

  const accessory = useMemo(() => {
    const accessories = inventory
      .map((i) => ITEM_BY_ID[i.itemId])
      .filter((it) => it && it.type === "accessory");
    return accessories[0];
  }, [inventory]);

  return (
    <div
      className={`relative flex h-72 w-full items-center justify-center overflow-hidden rounded-[28px] border-4 border-frame-dark bg-gradient-to-br ${stage.bgGradient} shadow-pop`}
    >
      <div className="absolute inset-x-0 top-3 flex justify-center">
        <span className="rounded-full border-2 border-frame-dark bg-frame-light px-3 py-1 text-xs font-bold text-frame-dark shadow-pop">
          Lv.{character.level} ・ {stage.name}
        </span>
      </div>

      {/* clouds */}
      <div className="absolute left-6 top-12 text-3xl opacity-70">☁️</div>
      <div className="absolute right-8 top-16 text-2xl opacity-70">☁️</div>
      <div className="absolute bottom-4 left-10 text-xl opacity-80">🌱</div>
      <div className="absolute bottom-4 right-8 text-xl opacity-80">🌷</div>

      <div className="relative flex flex-col items-center">
        {accessory && (
          <span className="-mb-3 text-3xl drop-shadow-md" aria-hidden>
            {accessory.icon}
          </span>
        )}
        <span
          className="text-[110px] leading-none drop-shadow-lg animate-bob"
          aria-label={stage.name}
        >
          {stage.emoji}
        </span>
        <p className="mt-2 max-w-[80%] rounded-2xl border-2 border-frame-dark bg-white/85 px-3 py-1.5 text-center text-xs font-bold text-frame-dark shadow-pop">
          {stage.description}
        </p>
      </div>

      {character.activeBoost && (
        <div className="absolute right-3 top-3 rotate-3 rounded-xl border-2 border-frame-dark bg-pop-yellow px-2 py-1 text-[10px] font-bold text-frame-dark shadow-pop">
          XP +{character.activeBoost.xpBoostPercent}% × {character.activeBoost.usesLeft}
        </div>
      )}
    </div>
  );
}
