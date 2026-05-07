"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ActivityLog,
  ActivityType,
  GameState,
  Goal,
} from "./types";
import {
  ACTIVITY_META,
  ITEM_BY_ID,
  getEvolutionStage,
  xpToNextLevel,
} from "./gameData";

const initialState: GameState = {
  character: {
    name: "まなぶ",
    level: 1,
    xp: 0,
    totalXp: 0,
    gold: 50,
    happiness: 80,
    evolutionIndex: 0,
  },
  inventory: [],
  activities: [],
  goals: [],
  createdAt: new Date().toISOString(),
};

interface RecordActivityInput {
  type: ActivityType;
  title: string;
  minutes: number;
}

interface RecordActivityResult {
  log: ActivityLog;
  leveledUp: boolean;
  evolved: boolean;
  goalsCompleted: Goal[];
  newLevel: number;
}

interface GameActions {
  setName: (name: string) => void;
  recordActivity: (input: RecordActivityInput) => RecordActivityResult;
  buyItem: (itemId: string) => { ok: boolean; reason?: string };
  useItem: (itemId: string) => { ok: boolean; reason?: string };
  addGoal: (input: {
    title: string;
    description?: string;
    targetXp: number;
    bonusXp: number;
    bonusGold: number;
    deadline: string;
  }) => Goal;
  removeGoal: (id: string) => void;
  reset: () => void;
}

type Store = GameState & GameActions;

function applyXpAndLevel(
  state: GameState,
  rawXp: number,
): { state: GameState; leveledUp: boolean; evolved: boolean; newLevel: number } {
  let leveledUp = false;
  const prevEvoIndex = state.character.evolutionIndex;

  let xp = state.character.xp + rawXp;
  let level = state.character.level;
  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    leveledUp = true;
  }

  const totalXp = state.character.totalXp + rawXp;
  const { index: nextEvoIndex } = getEvolutionStage(level);
  const evolved = nextEvoIndex > prevEvoIndex;

  return {
    state: {
      ...state,
      character: {
        ...state.character,
        level,
        xp,
        totalXp,
        evolutionIndex: nextEvoIndex,
      },
    },
    leveledUp,
    evolved,
    newLevel: level,
  };
}

function checkGoalsCompletion(state: GameState): { state: GameState; completed: Goal[] } {
  const now = new Date();
  const completed: Goal[] = [];
  let character = { ...state.character };
  const goals = state.goals.map((g) => {
    if (g.status !== "active") return g;
    const earned = state.character.totalXp - g.startingTotalXp;
    if (earned >= g.targetXp) {
      const done: Goal = { ...g, status: "completed", completedAt: now.toISOString() };
      character = {
        ...character,
        gold: character.gold + g.bonusGold,
      };
      // ボーナスXPを反映
      const after = applyXpAndLevel({ ...state, character }, g.bonusXp);
      character = after.state.character;
      completed.push(done);
      return done;
    }
    if (new Date(g.deadline).getTime() < now.getTime()) {
      return { ...g, status: "failed" as const };
    }
    return g;
  });
  return {
    state: { ...state, character, goals },
    completed,
  };
}

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      setName: (name) =>
        set((s) => ({ character: { ...s.character, name: name.slice(0, 12) || s.character.name } })),

      recordActivity: ({ type, title, minutes }) => {
        const meta = ACTIVITY_META[type];
        const baseXp = Math.max(1, Math.round(meta.xpPerMin * minutes));
        const baseGold = Math.max(1, Math.round(meta.goldPerMin * minutes));

        let xpMultiplier = 1;
        const now = new Date();
        const state = get();
        let nextBoost = state.character.activeBoost;
        if (nextBoost && nextBoost.usesLeft > 0) {
          xpMultiplier = 1 + nextBoost.xpBoostPercent / 100;
          nextBoost = { ...nextBoost, usesLeft: nextBoost.usesLeft - 1 };
          if (nextBoost.usesLeft <= 0) nextBoost = undefined;
        }

        const earnedXp = Math.round(baseXp * xpMultiplier);
        const log: ActivityLog = {
          id: `act_${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
          type,
          title: title.trim() || meta.label,
          minutes,
          xp: earnedXp,
          gold: baseGold,
          createdAt: now.toISOString(),
        };

        const happiness = Math.min(100, state.character.happiness + 2);
        const stateWithLog: GameState = {
          ...state,
          character: {
            ...state.character,
            gold: state.character.gold + baseGold,
            happiness,
            activeBoost: nextBoost,
          },
          activities: [log, ...state.activities].slice(0, 200),
        };

        const xpResult = applyXpAndLevel(stateWithLog, earnedXp);
        const goalCheck = checkGoalsCompletion(xpResult.state);

        set(goalCheck.state);

        return {
          log,
          leveledUp: xpResult.leveledUp,
          evolved: xpResult.evolved,
          goalsCompleted: goalCheck.completed,
          newLevel: xpResult.newLevel,
        };
      },

      buyItem: (itemId) => {
        const item = ITEM_BY_ID[itemId];
        if (!item) return { ok: false, reason: "アイテムが見つかりません" };
        const state = get();
        if (state.character.gold < item.price) {
          return { ok: false, reason: "ゴールドが足りません" };
        }
        const existing = state.inventory.find((i) => i.itemId === itemId);
        const inventory = existing
          ? state.inventory.map((i) =>
              i.itemId === itemId ? { ...i, count: i.count + 1 } : i,
            )
          : [...state.inventory, { itemId, count: 1 }];
        set({
          character: { ...state.character, gold: state.character.gold - item.price },
          inventory,
        });
        return { ok: true };
      },

      useItem: (itemId) => {
        const item = ITEM_BY_ID[itemId];
        if (!item) return { ok: false, reason: "アイテムが見つかりません" };
        const state = get();
        const owned = state.inventory.find((i) => i.itemId === itemId);
        if (!owned || owned.count <= 0) {
          return { ok: false, reason: "持っていません" };
        }
        if (item.type !== "consumable") {
          return { ok: false, reason: "このアイテムは装飾用です" };
        }

        const character = { ...state.character };
        if (item.effect?.xpBoostPercent && item.effect.boostUses) {
          character.activeBoost = {
            xpBoostPercent: item.effect.xpBoostPercent,
            usesLeft: item.effect.boostUses,
          };
        }
        if (item.effect?.happiness) {
          character.happiness = Math.min(100, character.happiness + item.effect.happiness);
        }

        const inventory = state.inventory
          .map((i) => (i.itemId === itemId ? { ...i, count: i.count - 1 } : i))
          .filter((i) => i.count > 0);

        set({ character, inventory });
        return { ok: true };
      },

      addGoal: ({ title, description, targetXp, bonusXp, bonusGold, deadline }) => {
        const state = get();
        const goal: Goal = {
          id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: title.trim(),
          description,
          targetXp,
          bonusXp,
          bonusGold,
          deadline,
          startedAt: new Date().toISOString(),
          startingTotalXp: state.character.totalXp,
          status: "active",
        };
        set({ goals: [goal, ...state.goals] });
        return goal;
      },

      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      reset: () => set({ ...initialState, createdAt: new Date().toISOString() }),
    }),
    {
      name: "study-quest-state",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

export function selectXpToNext(state: Store): number {
  return xpToNextLevel(state.character.level);
}
