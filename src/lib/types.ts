export type Result = "win" | "loss";

export interface BattleRecord {
  date: string;
  player: string;
  deck: string;
  opponentDeck: string;
  result: Result;
  event?: string;
  notes?: string;
}

export interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export interface DeckStats {
  player: string;
  deck: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export interface MatchupStats {
  deck: string;
  opponentDeck: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export interface TrendPoint {
  date: string;
  winRate: number;
  cumWins: number;
  cumTotal: number;
}

export interface PlayerTrend {
  player: string;
  points: TrendPoint[];
}
