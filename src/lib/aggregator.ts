import {
  BattleRecord,
  PlayerStats,
  DeckStats,
  MatchupStats,
  PlayerTrend,
  TrendPoint,
} from "./types";

export function calcPlayerStats(records: BattleRecord[]): PlayerStats[] {
  const map = new Map<string, { wins: number; losses: number }>();

  for (const r of records) {
    const entry = map.get(r.player) ?? { wins: 0, losses: 0 };
    if (r.result === "win") entry.wins++;
    else entry.losses++;
    map.set(r.player, entry);
  }

  return Array.from(map.entries())
    .map(([name, { wins, losses }]) => ({
      name,
      wins,
      losses,
      total: wins + losses,
      winRate: Math.round((wins / (wins + losses)) * 1000) / 10,
    }))
    .sort((a, b) => b.winRate - a.winRate);
}

export function calcDeckStats(records: BattleRecord[]): DeckStats[] {
  const map = new Map<string, { player: string; deck: string; wins: number; losses: number }>();

  for (const r of records) {
    const key = `${r.player}|||${r.deck}`;
    const entry = map.get(key) ?? { player: r.player, deck: r.deck, wins: 0, losses: 0 };
    if (r.result === "win") entry.wins++;
    else entry.losses++;
    map.set(key, entry);
  }

  return Array.from(map.values())
    .map((e) => ({
      ...e,
      total: e.wins + e.losses,
      winRate: Math.round((e.wins / (e.wins + e.losses)) * 1000) / 10,
    }))
    .sort((a, b) => b.winRate - a.winRate || b.total - a.total);
}

export function calcMatchupStats(records: BattleRecord[]): MatchupStats[] {
  const map = new Map<string, { deck: string; opponentDeck: string; wins: number; losses: number }>();

  for (const r of records) {
    if (!r.opponentDeck) continue;
    const key = `${r.deck}|||${r.opponentDeck}`;
    const entry = map.get(key) ?? { deck: r.deck, opponentDeck: r.opponentDeck, wins: 0, losses: 0 };
    if (r.result === "win") entry.wins++;
    else entry.losses++;
    map.set(key, entry);
  }

  return Array.from(map.values()).map((e) => ({
    ...e,
    total: e.wins + e.losses,
    winRate: Math.round((e.wins / (e.wins + e.losses)) * 1000) / 10,
  }));
}

export function calcPlayerTrends(records: BattleRecord[]): PlayerTrend[] {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const playerMap = new Map<string, BattleRecord[]>();

  for (const r of sorted) {
    const arr = playerMap.get(r.player) ?? [];
    arr.push(r);
    playerMap.set(r.player, arr);
  }

  const trends: PlayerTrend[] = [];

  for (const [player, recs] of playerMap.entries()) {
    let cumWins = 0;
    let cumTotal = 0;
    const pointsMap = new Map<string, TrendPoint>();

    for (const r of recs) {
      cumTotal++;
      if (r.result === "win") cumWins++;
      pointsMap.set(r.date, {
        date: r.date,
        winRate: Math.round((cumWins / cumTotal) * 1000) / 10,
        cumWins,
        cumTotal,
      });
    }

    trends.push({ player, points: Array.from(pointsMap.values()) });
  }

  return trends;
}
