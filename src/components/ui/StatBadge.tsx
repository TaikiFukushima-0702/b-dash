interface StatBadgeProps {
  winRate: number;
  size?: "sm" | "md" | "lg";
}

export function StatBadge({ winRate, size = "md" }: StatBadgeProps) {
  const color =
    winRate >= 60
      ? "bg-green-100 text-green-800"
      : winRate >= 40
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";

  const sizeClass = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  }[size];

  return (
    <span className={`inline-block rounded-full font-semibold ${color} ${sizeClass}`}>
      {winRate}%
    </span>
  );
}
