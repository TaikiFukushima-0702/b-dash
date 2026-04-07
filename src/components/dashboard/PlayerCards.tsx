"use client";

import { BattleRecord } from "@/lib/types";
import { calcPlayerStats } from "@/lib/aggregator";
import { Card } from "@/components/ui/Card";
import { StatBadge } from "@/components/ui/StatBadge";

interface PlayerCardsProps {
  records: BattleRecord[];
}

export function PlayerCards({ records }: PlayerCardsProps) {
  const playerStats = calcPlayerStats(records);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {playerStats.map((player) => (
        <Card key={player.name}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold text-gray-900">{player.name}</h4>
            <StatBadge winRate={player.winRate} size="lg" />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <span>{player.total}戦</span>
            <span className="text-green-600 font-medium">{player.wins}勝</span>
            <span className="text-red-600 font-medium">{player.losses}敗</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                player.winRate >= 60
                  ? "bg-green-500"
                  : player.winRate >= 40
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${player.winRate}%` }}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
