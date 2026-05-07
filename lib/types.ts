export type ActivityType =
  | "study"
  | "reading"
  | "exercise"
  | "language"
  | "coding"
  | "writing"
  | "other";

export interface ActivityLog {
  id: string;
  type: ActivityType;
  title: string;
  minutes: number;
  xp: number;
  gold: number;
  createdAt: string; // ISO
}

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  price: number;
  type: "consumable" | "accessory" | "decoration";
  effect?: {
    xpBoostPercent?: number; // for next N activities
    boostUses?: number;
    happiness?: number;
  };
}

export interface OwnedItem {
  itemId: string;
  count: number;
}

export type GoalStatus = "active" | "completed" | "failed";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetXp: number; // total XP earned during the goal period
  bonusXp: number;
  bonusGold: number;
  startedAt: string; // ISO
  deadline: string; // ISO date
  startingTotalXp: number; // store totalXp when goal began
  status: GoalStatus;
  completedAt?: string;
}

export interface EvolutionStage {
  level: number;
  name: string;
  emoji: string;
  description: string;
  bgGradient: string; // tailwind classes
}

export interface CharacterState {
  name: string;
  level: number;
  xp: number; // toward next level
  totalXp: number; // lifetime
  gold: number;
  happiness: number; // 0-100
  evolutionIndex: number;
  activeBoost?: {
    xpBoostPercent: number;
    usesLeft: number;
  };
}

export interface GameState {
  character: CharacterState;
  inventory: OwnedItem[];
  activities: ActivityLog[];
  goals: Goal[];
  createdAt: string;
}
