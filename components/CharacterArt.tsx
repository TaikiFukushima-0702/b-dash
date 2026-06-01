// キャラのプレースホルダーアート（インライン SVG・4段階）。
// 本番アートが用意できたら public/characters/stage-N.png を next/image で差し替える。
// （lib/character.ts の imageForStage がそのパスを返す）

const PALETTES: Record<number, { body: string; accent: string; belly: string }> = {
  1: { body: "#9be7c4", accent: "#34d399", belly: "#e9fff5" },
  2: { body: "#8bd0ff", accent: "#3b82f6", belly: "#eaf5ff" },
  3: { body: "#b3a4ff", accent: "#6d5efc", belly: "#f0edff" },
  4: { body: "#ffcf6b", accent: "#ff9d2e", belly: "#fff4dd" },
};

export default function CharacterArt({
  stage,
  size = 160,
  className = "",
}: {
  stage: number;
  size?: number;
  className?: string;
}) {
  const s = Math.min(Math.max(1, stage), 4);
  const c = PALETTES[s];
  // ステージが上がるほど大きく・装飾が増える。
  const ears = s >= 2;
  const crown = s >= 4;
  const wings = s >= 3;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`キャラクター 進化段階 ${s}`}
    >
      {wings && (
        <g fill={c.accent} opacity={0.85}>
          <path d="M45 110 Q10 90 20 130 Q35 135 55 125 Z" />
          <path d="M155 110 Q190 90 180 130 Q165 135 145 125 Z" />
        </g>
      )}
      {/* 体 */}
      <ellipse cx="100" cy="120" rx={50 + s * 4} ry={48 + s * 3} fill={c.body} />
      <ellipse cx="100" cy="132" rx={30 + s * 2} ry={28 + s * 2} fill={c.belly} />
      {/* 頭 */}
      <circle cx="100" cy="78" r={36 + s * 2} fill={c.body} />
      {ears && (
        <g fill={c.body}>
          <path d="M74 52 L64 22 L92 46 Z" />
          <path d="M126 52 L136 22 L108 46 Z" />
        </g>
      )}
      {crown && (
        <path d="M76 40 L88 22 L100 38 L112 22 L124 40 Z" fill="#ffd54a" stroke="#e0a800" strokeWidth="2" />
      )}
      {/* 目 */}
      <circle cx="86" cy="76" r="6" fill="#22252e" />
      <circle cx="114" cy="76" r="6" fill="#22252e" />
      <circle cx="88" cy="74" r="2" fill="#fff" />
      <circle cx="116" cy="74" r="2" fill="#fff" />
      {/* ほっぺ */}
      <circle cx="74" cy="90" r="5" fill={c.accent} opacity={0.5} />
      <circle cx="126" cy="90" r="5" fill={c.accent} opacity={0.5} />
      {/* 口 */}
      <path d="M92 92 Q100 100 108 92" stroke="#22252e" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* 足 */}
      <ellipse cx="82" cy="170" rx="14" ry="9" fill={c.accent} />
      <ellipse cx="118" cy="170" rx="14" ry="9" fill={c.accent} />
    </svg>
  );
}
