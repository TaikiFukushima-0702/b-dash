"use client";

import { BattleRecord } from "@/lib/types";
import { calcDeckStats } from "@/lib/aggregator";
import { Card } from "@/components/ui/Card";
import { StatBadge } from "@/components/ui/StatBadge";

interface DeckAnalysisProps {
  records: BattleRecord[];
}

export function DeckAnalysis({ records }: DeckAnalysisProps) {
  const deckStats = calcDeckStats(records);

  return (
    <Card title="デッキ別成績">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-600">プレイヤー</th>
              <th className="text-left py-3 px-2 font-medium text-gray-600">デッキ</th>
              <th className="text-center py-3 px-2 font-medium text-gray-600">試合数</th>
              <th className="text-center py-3 px-2 font-medium text-gray-600">勝ち</th>
              <th className="text-center py-3 px-2 font-medium text-gray-600">負け</th>
              <th className="text-center py-3 px-2 font-medium text-gray-600">勝率</th>
            </tr>
          </thead>
          <tbody>
            {deckStats.map((d) => (
              <tr key={`${d.player}-${d.deck}`} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium text-gray-900">{d.player}</td>
                <td className="py-3 px-2 text-gray-700">{d.deck}</td>
                <td className="py-3 px-2 text-center text-gray-600">{d.total}</td>
                <td className="py-3 px-2 text-center text-green-600">{d.wins}</td>
                <td className="py-3 px-2 text-center text-red-600">{d.losses}</td>
                <td className="py-3 px-2 text-center">
                  <StatBadge winRate={d.winRate} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
