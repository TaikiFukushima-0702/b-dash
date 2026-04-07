"use client";

import { BattleRecord } from "@/lib/types";
import { calcPlayerStats } from "@/lib/aggregator";
import { Card } from "@/components/ui/Card";

interface OverviewProps {
  records: BattleRecord[];
}

export function Overview({ records }: OverviewProps) {
  const playerStats = calcPlayerStats(records);
  const totalGames = records.length;
  const totalWins = records.filter((r) => r.result === "win").length;
  const teamWinRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 1000) / 10 : 0;

  const deckCounts = new Map<string, number>();
  for (const r of records) {
    deckCounts.set(r.deck, (deckCounts.get(r.deck) ?? 0) + 1);
  }
  const mostUsedDeck = deckCounts.size > 0
    ? Array.from(deckCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
    : "-";

  const bestPlayer = playerStats.length > 0 ? playerStats[0] : null;

  const stats = [
    { label: "総試合数", value: totalGames.toString(), sub: `${totalWins}勝 ${totalGames - totalWins}敗` },
    { label: "チーム勝率", value: `${teamWinRate}%`, sub: teamWinRate >= 50 ? "Good" : "要改善" },
    { label: "最多使用デッキ", value: mostUsedDeck, sub: `${deckCounts.get(mostUsedDeck) ?? 0}回使用` },
    { label: "最高勝率プレイヤー", value: bestPlayer?.name ?? "-", sub: bestPlayer ? `${bestPlayer.winRate}% (${bestPlayer.total}戦)` : "" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <p className="text-sm text-gray-500">{stat.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          <p className="text-sm text-gray-400 mt-1">{stat.sub}</p>
        </Card>
      ))}
    </div>
  );
}
