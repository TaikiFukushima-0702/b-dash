import type { ActivityType, EvolutionStage, Item } from "./types";

// XP required to advance from level L to L+1: base * L^1.4
export function xpToNextLevel(level: number): number {
  return Math.floor(40 * Math.pow(level, 1.35));
}

export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; emoji: string; xpPerMin: number; goldPerMin: number; color: string }
> = {
  study: { label: "勉強", emoji: "📚", xpPerMin: 2.0, goldPerMin: 1.0, color: "bg-pop-yellow" },
  reading: { label: "読書", emoji: "📖", xpPerMin: 1.8, goldPerMin: 0.9, color: "bg-pop-orange" },
  exercise: { label: "運動", emoji: "🏃", xpPerMin: 1.5, goldPerMin: 1.0, color: "bg-pop-green" },
  language: { label: "語学", emoji: "🗣️", xpPerMin: 2.2, goldPerMin: 1.1, color: "bg-pop-pink" },
  coding: { label: "コーディング", emoji: "💻", xpPerMin: 2.4, goldPerMin: 1.2, color: "bg-pop-purple" },
  writing: { label: "執筆", emoji: "✍️", xpPerMin: 2.0, goldPerMin: 1.0, color: "bg-sky-soft" },
  other: { label: "その他", emoji: "✨", xpPerMin: 1.2, goldPerMin: 0.7, color: "bg-frame-light" },
};

// たまごっち的進化ステージ
export const EVOLUTION_STAGES: EvolutionStage[] = [
  {
    level: 1,
    name: "たまご",
    emoji: "🥚",
    description: "知識のたまご。これから何になるかな？",
    bgGradient: "from-yellow-100 via-pink-100 to-sky-100",
  },
  {
    level: 3,
    name: "ひよこ",
    emoji: "🐣",
    description: "殻をやぶってあらわれた！好奇心いっぱい。",
    bgGradient: "from-yellow-200 via-orange-100 to-pink-100",
  },
  {
    level: 7,
    name: "ぴよ太",
    emoji: "🐤",
    description: "毎日コツコツ学習中。よちよち歩き。",
    bgGradient: "from-yellow-200 via-pop-yellow/40 to-pop-orange/30",
  },
  {
    level: 12,
    name: "かしこギツネ",
    emoji: "🦊",
    description: "知恵がついてきた！ピカピカ。",
    bgGradient: "from-pop-orange/40 via-pop-pink/30 to-pop-yellow/40",
  },
  {
    level: 18,
    name: "フクロウ博士",
    emoji: "🦉",
    description: "深い知識をたくわえた賢者。",
    bgGradient: "from-pop-purple/40 via-sky-soft to-pop-pink/30",
  },
  {
    level: 25,
    name: "学びのドラゴン",
    emoji: "🐲",
    description: "全てを学びつくす伝説の存在。",
    bgGradient: "from-pop-purple/50 via-sky-mid/40 to-pop-green/40",
  },
];

export function getEvolutionStage(level: number): { stage: EvolutionStage; index: number } {
  let index = 0;
  for (let i = 0; i < EVOLUTION_STAGES.length; i++) {
    if (level >= EVOLUTION_STAGES[i].level) index = i;
  }
  return { stage: EVOLUTION_STAGES[index], index };
}

export const ITEMS: Item[] = [
  {
    id: "potion-small",
    name: "やる気ドリンク",
    description: "次の3回の活動でXPが+25%。",
    icon: "🧃",
    price: 80,
    type: "consumable",
    effect: { xpBoostPercent: 25, boostUses: 3 },
  },
  {
    id: "potion-large",
    name: "集中エナジー",
    description: "次の5回の活動でXPが+50%。",
    icon: "⚡",
    price: 220,
    type: "consumable",
    effect: { xpBoostPercent: 50, boostUses: 5 },
  },
  {
    id: "snack",
    name: "おやつタイム",
    description: "ハッピネスが+20。",
    icon: "🍪",
    price: 40,
    type: "consumable",
    effect: { happiness: 20 },
  },
  {
    id: "hat-graduation",
    name: "学士帽",
    description: "頭脳明晰になった気分！",
    icon: "🎓",
    price: 300,
    type: "accessory",
  },
  {
    id: "ribbon",
    name: "おしゃれリボン",
    description: "かわいさが3割増し。",
    icon: "🎀",
    price: 180,
    type: "accessory",
  },
  {
    id: "crown",
    name: "勉強王の冠",
    description: "勝ち取った王者の証。",
    icon: "👑",
    price: 600,
    type: "accessory",
  },
  {
    id: "plant",
    name: "観葉植物",
    description: "お部屋に緑を。",
    icon: "🪴",
    price: 120,
    type: "decoration",
  },
  {
    id: "trophy",
    name: "金のトロフィー",
    description: "コレクション用。",
    icon: "🏆",
    price: 500,
    type: "decoration",
  },
];

export const ITEM_BY_ID: Record<string, Item> = Object.fromEntries(
  ITEMS.map((it) => [it.id, it]),
);
