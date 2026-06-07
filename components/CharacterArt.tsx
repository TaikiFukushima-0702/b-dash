// キャラのプレースホルダーアート（インライン SVG・4段階）。
// 段階が上がるほど「大きく・装飾が増え・色が深まる」よう描き分け、進化を感じさせる。
// 本番のラスターアートが用意できたら public/characters/stage-N.png を next/image で差し替える。
// （lib/character.ts の imageForStage がそのパスを返す）
//
// 同一ページに複数描画してもグラデーション id が衝突しないよう uid を受け取る。

interface Palette {
  bg1: string;
  bg2: string;
  body1: string;
  body2: string;
  accent: string;
  belly: string;
}

const PALETTES: Record<number, Palette> = {
  1: { bg1: "#eafff5", bg2: "#c9f7e3", body1: "#a7ecc8", body2: "#5fd3a0", accent: "#2bb784", belly: "#f3fffb" },
  2: { bg1: "#eaf5ff", bg2: "#cfe6ff", body1: "#9fd2ff", body2: "#5aa6f5", accent: "#2f7fe0", belly: "#f2f9ff" },
  3: { bg1: "#f1edff", bg2: "#ded4ff", body1: "#bda9ff", body2: "#7d63f0", accent: "#5a3fd6", belly: "#f6f3ff" },
  4: { bg1: "#fff6e0", bg2: "#ffe6ad", body1: "#ffd474", body2: "#ff9d2e", accent: "#e0760a", belly: "#fff8e9" },
};

export default function CharacterArt({
  stage,
  size = 160,
  uid,
  className = "",
}: {
  stage: number;
  size?: number;
  uid?: string;
  className?: string;
}) {
  const s = Math.min(Math.max(1, stage), 4);
  const c = PALETTES[s];
  const id = `ca-${uid ?? s}`;
  const grow = (s - 1) * 4; // 段階ごとに少しずつ大きく

  const ears = s >= 2;
  const wings = s >= 3;
  const crown = s >= 4;
  const aura = s >= 4;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`キャラクター 進化段階 ${s}`}
    >
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor={c.bg1} />
          <stop offset="100%" stopColor={c.bg2} />
        </radialGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.body1} />
          <stop offset="100%" stopColor={c.body2} />
        </linearGradient>
      </defs>

      {/* 背景の丸 */}
      <circle cx="100" cy="100" r="96" fill={`url(#${id}-bg)`} />

      {aura && (
        <g>
          {[20, 70, 120, 170, 150, 40].map((x, i) => (
            <circle key={i} cx={x} cy={30 + (i % 3) * 60} r={i % 2 ? 3 : 2} fill="#ffe9a8" />
          ))}
        </g>
      )}

      {wings && (
        <g fill={c.accent} opacity={0.9}>
          <path d="M52 112 Q14 86 18 130 Q34 138 60 126 Z" />
          <path d="M148 112 Q186 86 182 130 Q166 138 140 126 Z" />
        </g>
      )}

      {/* しっぽ（段階3以上） */}
      {s >= 3 && (
        <path
          d="M150 140 Q178 150 176 116 Q170 132 150 128 Z"
          fill={`url(#${id}-body)`}
        />
      )}

      {/* 体 */}
      <ellipse cx="100" cy="126" rx={46 + grow} ry={44 + grow * 0.8} fill={`url(#${id}-body)`} />
      <ellipse cx="100" cy="136" rx={26 + grow * 0.5} ry={24 + grow * 0.5} fill={c.belly} />

      {/* 頭 */}
      <circle cx="100" cy="80" r={34 + grow * 0.7} fill={`url(#${id}-body)`} />

      {ears &&
        (s >= 3 ? (
          // とがった耳
          <g fill={`url(#${id}-body)`}>
            <path d="M72 54 L60 18 L92 46 Z" />
            <path d="M128 54 L140 18 L108 46 Z" />
            <path d="M76 50 L70 30 L88 46 Z" fill={c.accent} opacity={0.5} />
            <path d="M124 50 L130 30 L112 46 Z" fill={c.accent} opacity={0.5} />
          </g>
        ) : (
          // 丸い耳
          <g fill={`url(#${id}-body)`}>
            <circle cx="74" cy="52" r="12" />
            <circle cx="126" cy="52" r="12" />
          </g>
        ))}

      {crown && (
        <path
          d="M74 40 L86 20 L100 36 L114 20 L126 40 Z"
          fill="#ffd54a"
          stroke="#e0a800"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}

      {/* 顔 */}
      <circle cx="86" cy="78" r={s >= 3 ? 6 : 5.5} fill="#22252e" />
      <circle cx="114" cy="78" r={s >= 3 ? 6 : 5.5} fill="#22252e" />
      <circle cx="88" cy="75.5" r="2" fill="#fff" />
      <circle cx="116" cy="75.5" r="2" fill="#fff" />
      <circle cx="73" cy="90" r="5" fill={c.accent} opacity={0.45} />
      <circle cx="127" cy="90" r="5" fill={c.accent} opacity={0.45} />
      {s >= 3 ? (
        <path d="M90 92 Q100 102 110 92" stroke="#22252e" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M94 92 Q100 98 106 92" stroke="#22252e" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}

      {/* 足 */}
      <ellipse cx="84" cy={172} rx="13" ry="8" fill={c.accent} />
      <ellipse cx="116" cy={172} rx="13" ry="8" fill={c.accent} />

      {/* 段階1の小さな芽 */}
      {s === 1 && (
        <g>
          <path d="M100 50 Q96 36 104 32 Q104 44 100 50 Z" fill={c.accent} />
          <path d="M100 50 Q104 38 96 34 Q96 46 100 50 Z" fill="#7fe0b3" />
        </g>
      )}
    </svg>
  );
}
