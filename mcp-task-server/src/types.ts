export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  urls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskStore {
  tasks: Task[];
}
