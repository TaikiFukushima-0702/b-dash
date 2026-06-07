import { Card } from "./ui";
import CharacterArt from "./CharacterArt";
import XpBar from "./XpBar";
import { levelProgress } from "@/lib/xp";
import { levelsToNextStage, stageDef } from "@/lib/character";
import type { CharacterState } from "@/lib/types";

export default function CharacterCard({ character }: { character: CharacterState }) {
  const progress = levelProgress(character.totalXp);
  const def = stageDef(character.stage);
  const next = levelsToNextStage(progress.level);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="shrink-0 animate-float">
          <CharacterArt stage={character.stage} size={120} uid="card" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-[var(--primary)] px-2 py-0.5 text-xs font-bold text-[var(--primary-fg)]">
              Lv.{progress.level}
            </span>
            <span className="truncate text-base font-bold">{def.name}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{def.blurb}</p>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span>🔥 {character.streak}日連続</span>
            <span>合計 {character.totalXp.toLocaleString()} XP</span>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <XpBar ratio={progress.ratio} current={progress.xpIntoLevel} next={progress.xpForNext} />
      </div>
      {next ? (
        <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
          Lv.{next.nextLevel} で「{stageDef(next.nextStage).name}」に進化！
        </p>
      ) : (
        <p className="mt-2 text-center text-[11px] text-[var(--accent)]">最終進化に到達！合格まで突っ走ろう🔥</p>
      )}
    </Card>
  );
}
