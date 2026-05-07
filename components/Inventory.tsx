"use client";

import { ITEM_BY_ID } from "@/lib/gameData";
import { useGameStore } from "@/lib/store";
import { useToast } from "./Toast";

export default function Inventory() {
  const inventory = useGameStore((s) => s.inventory);
  const useItem = useGameStore((s) => s.useItem);
  const { push } = useToast();

  if (inventory.length === 0) {
    return (
      <div className="rounded-[24px] border-4 border-dashed border-frame-mid bg-white/70 p-6 text-center text-sm font-bold text-frame-mid">
        まだアイテムを持っていないよ！どうぐ屋で買おう🛒
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {inventory.map((row) => {
        const item = ITEM_BY_ID[row.itemId];
        if (!item) return null;
        return (
          <div
            key={row.itemId}
            className="flex flex-col rounded-2xl border-4 border-frame-dark bg-white p-3 shadow-pop"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-4xl">{item.icon}</span>
              <span className="rounded-full border-2 border-frame-dark bg-pop-yellow px-2 text-xs font-bold text-frame-dark">
                ×{row.count}
              </span>
            </div>
            <div className="mt-1 text-sm font-bold text-frame-dark">{item.name}</div>
            <div className="mb-2 flex-1 text-[11px] text-frame-mid">{item.description}</div>
            {item.type === "consumable" ? (
              <button
                type="button"
                onClick={() => {
                  const r = useItem(row.itemId);
                  if (!r.ok) {
                    push({ title: r.reason ?? "つかえなかった", tone: "warning", emoji: "⚠️" });
                  } else {
                    push({ title: `『${item.name}』をつかった！`, emoji: item.icon, tone: "success" });
                  }
                }}
                className="mt-auto rounded-xl border-2 border-frame-dark bg-pop-green px-3 py-1.5 text-xs font-bold shadow-pop transition active:translate-y-0.5"
              >
                つかう
              </button>
            ) : (
              <div className="mt-auto rounded-xl border-2 border-dashed border-frame-mid px-3 py-1 text-center text-[11px] font-bold text-frame-mid">
                {item.type === "accessory" ? "そうび中" : "かざってある"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
