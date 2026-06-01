import { Card, PageHeader, Section } from "@/components/ui";
import CharacterCard from "@/components/CharacterCard";
import EvolutionGallery from "@/components/EvolutionGallery";
import { logout } from "@/app/actions/auth";
import { isAuthDisabled } from "@/lib/auth";
import { getCharacterState } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CharacterPage() {
  const character = await getCharacterState();

  return (
    <main className="flex-1">
      <PageHeader title="キャラクター" subtitle="勉強するほど進化する相棒" />
      <Section className="space-y-4">
        <CharacterCard character={character} />

        <div>
          <h2 className="mb-2 text-sm font-semibold">進化の図鑑</h2>
          <EvolutionGallery currentStage={character.stage} />
        </div>

        <Card>
          <p className="text-sm font-semibold">XPの稼ぎ方</p>
          <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
            <li>・学習1分 = 1 XP</li>
            <li>・過去問の正答1問 = 5 XP（挑戦でも +1 XP）</li>
            <li>・振り返りを書くと +10 XP</li>
            <li>・連続学習でボーナス倍率アップ（最大 ×1.5）</li>
          </ul>
        </Card>

        {!isAuthDisabled() && (
          <form action={logout}>
            <button type="submit" className="w-full rounded-xl border border-[var(--border)] py-2.5 text-sm text-[var(--muted)]">
              ログアウト
            </button>
          </form>
        )}
      </Section>
    </main>
  );
}
