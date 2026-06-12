"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryStat } from "@/lib/types";

export default function CategoryAccuracyChart({ stats }: { stats: CategoryStat[] }) {
  const data = stats
    .filter((s) => s.totalAttempted > 0)
    .map((s) => ({
      name: s.name,
      正答率: Math.round(s.accuracy * 100),
      weak: s.weak,
    }))
    .sort((a, b) => a.正答率 - b.正答率);

  if (data.length === 0) {
    return <p className="text-sm text-[var(--muted)]">過去問を記録すると、分野別の正答率がここに表示されます。</p>;
  }

  return (
    <div style={{ width: "100%", height: Math.max(220, data.length * 30) }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="正答率" radius={[0, 6, 6, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.weak ? "var(--danger)" : "var(--primary)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
