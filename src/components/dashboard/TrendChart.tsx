"use client";

import { BattleRecord } from "@/lib/types";
import { calcPlayerTrends } from "@/lib/aggregator";
import { Card } from "@/components/ui/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TrendChartProps {
  records: BattleRecord[];
}

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

export function TrendChart({ records }: TrendChartProps) {
  const trends = calcPlayerTrends(records);

  const allDates = [...new Set(trends.flatMap((t) => t.points.map((p) => p.date)))].sort();

  const chartData = allDates.map((date) => {
    const point: Record<string, string | number> = { date };
    for (const trend of trends) {
      const p = trend.points.find((pt) => pt.date === date);
      if (p) {
        point[trend.player] = p.winRate;
      }
    }
    return point;
  });

  return (
    <Card title="勝率推移">
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value}%`, undefined]}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              labelFormatter={(label: any) => `日付: ${label}`}
            />
            <Legend />
            {trends.map((trend, i) => (
              <Line
                key={trend.player}
                type="monotone"
                dataKey={trend.player}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
