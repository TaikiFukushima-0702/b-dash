"use client";

interface StatusBarProps {
  label: string;
  value: number;
  max: number;
  color: string; // tailwind bg-*
  emoji?: string;
}

export default function StatusBar({ label, value, max, color, emoji }: StatusBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-bold text-frame-dark">
        <span className="flex items-center gap-1">
          {emoji && <span>{emoji}</span>}
          {label}
        </span>
        <span>
          {Math.floor(value)}
          <span className="text-frame-mid"> / {max}</span>
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full border-2 border-frame-dark bg-frame-light">
        <div
          className={`h-full ${color} transition-[width] duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
