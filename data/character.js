// 論理脳トレーナーのキャラクター(レベルに応じて進化)
// レベル1からスタートし、XP100ごとにレベルアップする(app.js のlevelFromXpと一致)

window.CHARACTER_STAGES = [
  {
    minLevel: 1,
    maxLevel: 2,
    emoji: "🥚",
    name: "ロジたまご",
    title: "論理の卵",
    bio: "まだ眠っている。中で何かが動き出している予感…",
    color: "#fde68a",
  },
  {
    minLevel: 3,
    maxLevel: 4,
    emoji: "🐣",
    name: "ロジヒナ",
    title: "孵化したて",
    bio: "殻を破って世界を覗き見た。「なぜ?」と聞き始めた。",
    color: "#fcd34d",
  },
  {
    minLevel: 5,
    maxLevel: 7,
    emoji: "🐤",
    name: "ロジピヨ",
    title: "考える雛鳥",
    bio: "チチチと小さく考えている。前提と結論の違いがわかってきた。",
    color: "#fbbf24",
  },
  {
    minLevel: 8,
    maxLevel: 11,
    emoji: "🦆",
    name: "ロジカモ",
    title: "論理の水鳥",
    bio: "矛盾の海をすいすい泳ぐ。MECEの羽を広げ始めた。",
    color: "#60a5fa",
  },
  {
    minLevel: 12,
    maxLevel: 15,
    emoji: "🦉",
    name: "ロジフクロウ",
    title: "夜目の賢者見習い",
    bio: "暗闇でも本質を見抜く。誤謬の罠を遠くから見つけられる。",
    color: "#a78bfa",
  },
  {
    minLevel: 16,
    maxLevel: 20,
    emoji: "🦅",
    name: "ロジイーグル",
    title: "鋭眼の論理家",
    bio: "高所から全体構造を捉える。仮説思考が翼に宿った。",
    color: "#f472b6",
  },
  {
    minLevel: 21,
    maxLevel: 29,
    emoji: "🐉",
    name: "ロジドラゴン",
    title: "覚醒した思考竜",
    bio: "クリティカルシンキングの炎で偽の前提を焼き払う。",
    color: "#fb7185",
  },
  {
    minLevel: 30,
    maxLevel: Infinity,
    emoji: "👑",
    name: "ロジ賢者",
    title: "論理を超越せし者",
    bio: "もはや問題はあなたを止められない。教える側に回ろう。",
    color: "#fde047",
  },
];

window.getCharacterForLevel = function (level) {
  const stages = window.CHARACTER_STAGES;
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    if (level >= s.minLevel && level <= s.maxLevel) {
      const next = stages[i + 1];
      return { ...s, index: i, total: stages.length, next };
    }
  }
  return { ...stages[0], index: 0, total: stages.length, next: stages[1] };
};
