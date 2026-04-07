"use client";

import { BattleRecord } from "@/lib/types";
import { calcMatchupStats } from "@/lib/aggregator";
import { Card } from "@/components/ui/Card";

interface MatchupTableProps {
  records: BattleRecord[];
}

function getCellColor(winRate: number): string {
  if (winRate >= 70) return "bg-green-200 text-green-900";
  if (winRate >= 55) return "bg-green-100 text-green-800";
  if (winRate >= 45) return "bg-yellow-100 text-yellow-800";
  if (winRate >= 30) return "bg-red-100 text-red-800";
  return "bg-red-200 text-red-900";
}

export function MatchupTable({ records }: MatchupTableProps) {
  const matchups = calcMatchupStats(records);

  const ourDecks = [...new Set(matchups.map((m) => m.deck))].sort();
  const oppDecks = [...new Set(matchups.map((m) => m.opponentDeck))].sort();

  const matchupMap = new Map<string, { wins: number; losses: number; winRate: number }>();
  for (const m of matchups) {
    matchupMap.set(`${m.deck}|||${m.opponentDeck}`, {
      wins: m.wins,
      losses: m.losses,
      winRate: m.winRate,
    });
  }

  return (
    <Card title="相手デッキ別勝率">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-3 px-2 font-medium text-gray-600 min-w-[120px]">
                自分 ＼ 相手
              </th>
              {oppDecks.map((deck) => (
                <th key={deck} className="text-center py-3 px-2 font-medium text-gray-600 min-w-[100px]">
                  {deck}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ourDecks.map((ourDeck) => (
              <tr key={ourDeck} className="border-t border-gray-100">
                <td className="py-3 px-2 font-medium text-gray-900">{ourDeck}</td>
                {oppDecks.map((oppDeck) => {
                  const data = matchupMap.get(`${ourDeck}|||${oppDeck}`);
                  if (!data) {
                    return (
                      <td key={oppDeck} className="py-3 px-2 text-center text-gray-300">
                        -
                      </td>
                    );
                  }
                  return (
                    <td key={oppDeck} className={`py-3 px-2 text-center rounded ${getCellColor(data.winRate)}`}>
                      <div className="font-semibold">{data.winRate}%</div>
                      <div className="text-xs opacity-75">
                        {data.wins}-{data.losses}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
