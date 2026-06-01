import CharacterArt from "./CharacterArt";
import { Card } from "./ui";
import { STAGES } from "@/lib/character";

export default function EvolutionGallery({ currentStage }: { currentStage: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {STAGES.map((s) => {
        const unlocked = currentStage >= s.stage;
        const isCurrent = currentStage === s.stage;
        return (
          <Card
            key={s.stage}
            className={`flex flex-col items-center text-center ${isCurrent ? "ring-2 ring-[var(--primary)]" : ""}`}
          >
            <div className={unlocked ? "" : "opacity-30 grayscale"}>
              <CharacterArt stage={s.stage} size={110} />
            </div>
            <p className="mt-1 text-sm font-bold">{unlocked ? s.name : "？？？"}</p>
            <p className="text-[11px] text-[var(--muted)]">Lv.{s.minLevel} で進化</p>
            {isCurrent && <span className="mt-1 text-[11px] font-semibold text-[var(--primary)]">いまここ</span>}
          </Card>
        );
      })}
    </div>
  );
}
