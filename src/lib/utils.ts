import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d?: string | Date | null) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDuration(min?: number | null) {
  if (!min) return "0分";
  if (min < 60) return `${min}分`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

export const STATUS_LABEL: Record<string, string> = {
  to_read: "積読",
  reading: "読書中",
  finished: "読了",
  dnf: "中断",
};
