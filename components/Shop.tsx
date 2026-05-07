"use client";

import { ITEMS } from "@/lib/gameData";
import { useGameStore } from "@/lib/store";
import { useToast } from "./Toast";

export default function Shop() {
  const gold = useGameStore((s) => s.character.gold);
  const buyItem = useGameStore((s) => s.buyItem);
  const { push } = useToast();

  const groups: { type: string; label: string; emoji: string }[] = [
    { type: "consumable", label: "つかうアイテム", emoji: "🧪" },
    { type: "accessory", label: "そうび", emoji: "🎀" },
    { type: "decoration", label: "おかざり", emoji: "🌸" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border-4 border-frame-dark bg-pop-yellow px-4 py-2 shadow-pop">
        <div className="flex items-center gap-2 font-bold text-frame-dark">
          <span className="text-2xl">🏪</span>
          <span>どうぐ屋</span>
        </div>
        <div className="flex items-center gap-1 font-bold text-frame-dark">
          🪙 {gold} G
        </div>
      </div>

      {groups.map((g) => {
        const items = ITEMS.filter((it) => it.type === g.type);
        if (items.length === 0) return null;
        return (
          <section key={g.type}>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-frame-dark">
              <span>{g.emoji}</span>
              {g.label}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((it) => {
                const cantAfford = gold < it.price;
                return (
                  <div
                    key={it.id}
                    className="flex flex-col rounded-2xl border-4 border-frame-dark bg-white p-3 shadow-pop"
                  >
                    <div className="mb-1 text-4xl">{it.icon}</div>
                    <div className="text-sm font-bold text-frame-dark">{it.name}</div>
                    <div className="mb-2 flex-1 text-[11px] text-frame-mid">{it.description}</div>
                    <button
                      type="button"
                      disabled={cantAfford}
                      onClick={() => {
                        const r = buyItem(it.id);
                        if (!r.ok) {
                          push({ title: r.reason ?? "買えなかったよ", tone: "warning", emoji: "⚠️" });
                        } else {
                          push({
                            title: `『${it.name}』を購入！`,
                            body: `-${it.price} G`,
                            emoji: "🛍️",
                            tone: "success",
                          });
                        }
                      }}
                      className={`mt-auto rounded-xl border-2 border-frame-dark px-3 py-1.5 text-xs font-bold shadow-pop transition active:translate-y-0.5 ${
                        cantAfford ? "bg-frame-light text-frame-mid" : "bg-pop-pink text-frame-dark"
                      }`}
                    >
                      🪙 {it.price} G
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
