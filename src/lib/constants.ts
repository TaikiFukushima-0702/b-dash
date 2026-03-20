import type { ProjectStatus, TodoStatus, TodoPriority } from "@/types";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "進行中",
  pending: "未着手",
  completed: "完了",
  on_hold: "保留",
};

export const TODO_STATUS_LABELS: Record<TodoStatus, string> = {
  pending: "未着手",
  in_progress: "対応中",
  done: "完了",
};

export const TODO_PRIORITY_LABELS: Record<TodoPriority, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  active: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  on_hold: "bg-gray-100 text-gray-800",
};

export const TODO_PRIORITY_COLORS: Record<TodoPriority, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};
