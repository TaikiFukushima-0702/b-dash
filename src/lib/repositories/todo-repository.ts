import type { Database } from "sql.js";
import { persist } from "@/lib/db";
import type { Todo, TodoStatus, TodoPriority } from "@/types";

function rowToTodo(row: Record<string, unknown>): Todo {
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    title: row.title as string,
    description: row.description as string,
    status: row.status as TodoStatus,
    priority: row.priority as TodoPriority,
    due_date: (row.due_date as string) || null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function queryAll(db: Database, sql: string, params?: unknown[]): Record<string, unknown>[] {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function getTodosByProjectId(db: Database, projectId: string): Todo[] {
  return queryAll(
    db,
    "SELECT * FROM todos WHERE project_id = ? ORDER BY CASE status WHEN 'in_progress' THEN 0 WHEN 'pending' THEN 1 WHEN 'done' THEN 2 END, CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END, created_at DESC",
    [projectId]
  ).map(rowToTodo);
}

export async function createTodo(
  db: Database,
  data: { project_id: string; title: string; description?: string; priority?: TodoPriority; due_date?: string | null }
): Promise<Todo> {
  db.run(
    "INSERT INTO todos (project_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)",
    [data.project_id, data.title, data.description ?? "", data.priority ?? "medium", data.due_date ?? null]
  );
  await persist(db);
  const rows = queryAll(db, "SELECT * FROM todos ORDER BY rowid DESC LIMIT 1");
  return rowToTodo(rows[0]);
}

export async function updateTodo(
  db: Database,
  id: string,
  data: Partial<Omit<Todo, "id" | "project_id" | "created_at" | "updated_at">>
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.run(`UPDATE todos SET ${fields.join(", ")} WHERE id = ?`, values);
  await persist(db);
}

export async function deleteTodo(db: Database, id: string): Promise<void> {
  db.run("DELETE FROM todos WHERE id = ?", [id]);
  await persist(db);
}

export function getTodoCountsByProject(db: Database, projectId: string): Record<TodoStatus, number> {
  const rows = queryAll(db, "SELECT status, COUNT(*) as count FROM todos WHERE project_id = ? GROUP BY status", [projectId]);
  const counts: Record<TodoStatus, number> = { pending: 0, in_progress: 0, done: 0 };
  for (const row of rows) {
    counts[row.status as TodoStatus] = row.count as number;
  }
  return counts;
}

export function getRecentTodos(db: Database, limit: number = 10): (Todo & { project_name: string })[] {
  const rows = queryAll(
    db,
    "SELECT t.*, p.name as project_name FROM todos t JOIN projects p ON t.project_id = p.id ORDER BY t.updated_at DESC LIMIT ?",
    [limit]
  );
  return rows.map((row) => ({
    ...rowToTodo(row),
    project_name: row.project_name as string,
  }));
}
