"use client";

import { useGameStore } from "@/lib/store";
import { xpToNextLevel } from "@/lib/gameData";
import StatusBar from "./StatusBar";

export default function Stats() {
  const character = useGameStore((s) => s.character);
  const xpNeeded = xpToNextLevel(character.level);

  return (
    <div className="rounded-[24px] border-4 border-frame-dark bg-frame-light p-4 shadow-pop">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-xs font-bold text-frame-mid">なまえ</div>
          <div className="text-lg font-bold text-frame-dark">
            {character.name}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border-2 border-frame-dark bg-pop-yellow px-3 py-1 shadow-pop">
          <span>🪙</span>
          <span className="font-bold text-frame-dark">{character.gold}</span>
        </div>
      </div>
      <div className="space-y-2.5">
        <StatusBar
          label="EXP"
          emoji="⭐"
          value={character.xp}
          max={xpNeeded}
          color="bg-pop-pink"
        />
        <StatusBar
          label="HAPPY"
          emoji="💖"
          value={character.happiness}
          max={100}
          color="bg-pop-green"
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Mini label="Lv" value={character.level} />
        <Mini label="累計XP" value={character.totalXp} />
        <Mini label="ゴールド" value={character.gold} />
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border-2 border-frame-dark bg-white px-2 py-1 shadow-pop">
      <div className="text-[10px] font-bold text-frame-mid">{label}</div>
      <div className="text-base font-bold text-frame-dark">{value}</div>
    </div>
  );
}
