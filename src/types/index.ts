export type ProjectStatus = "active" | "pending" | "completed" | "on_hold";
export type TodoStatus = "pending" | "in_progress" | "done";
export type TodoPriority = "low" | "medium" | "high";

export interface Project {
  id: string;
  name: string;
  customer_name: string;
  status: ProjectStatus;
  assignee: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}
