import type { ActionResult } from "@/app/actions/study";

export default function ResultBanner({ result }: { result?: ActionResult }) {
  if (!result || !result.message) return null;
  const tone = result.ok ? "bg-[var(--success)]/15 text-[var(--success)]" : "bg-[var(--danger)]/15 text-[var(--danger)]";
  return (
    <div className={`rounded-xl px-3 py-2 text-sm font-medium ${tone}`}>
      <p>{result.message}</p>
      {result.ok && result.leveledUp && (
        <p className="mt-1 font-bold">🎉 レベルアップ！ Lv.{result.level}</p>
      )}
      {result.ok && result.evolved && (
        <p className="mt-1 font-bold">✨ 進化した！「{result.stageName}」になった！</p>
      )}
    </div>
  );
}
