import Papa from "papaparse";
import { BattleRecord, Result } from "./types";

interface RawRow {
  date: string;
  player: string;
  deck: string;
  opponent_deck: string;
  result: string;
  event?: string;
  notes?: string;
}

export async function fetchSheetData(url: string): Promise<BattleRecord[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet data: ${res.status}`);
  }
  const csv = await res.text();
  const parsed = Papa.parse<RawRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data
    .filter((row) => row.date && row.player && row.deck && row.result)
    .map((row) => ({
      date: row.date.trim(),
      player: row.player.trim(),
      deck: row.deck.trim(),
      opponentDeck: (row.opponent_deck || "").trim(),
      result: row.result.trim().toLowerCase() as Result,
      event: row.event?.trim() || undefined,
      notes: row.notes?.trim() || undefined,
    }));
}
