import type { Database } from "sql.js";
import { persist } from "@/lib/db";
import type { Project, ProjectStatus } from "@/types";

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    customer_name: row.customer_name as string,
    status: row.status as ProjectStatus,
    assignee: row.assignee as string,
    description: row.description as string,
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

export function getAllProjects(db: Database): Project[] {
  return queryAll(db, "SELECT * FROM projects ORDER BY updated_at DESC").map(rowToProject);
}

export function getProjectById(db: Database, id: string): Project | null {
  const rows = queryAll(db, "SELECT * FROM projects WHERE id = ?", [id]);
  return rows.length > 0 ? rowToProject(rows[0]) : null;
}

export async function createProject(
  db: Database,
  data: { name: string; customer_name: string; status?: ProjectStatus; assignee?: string; description?: string }
): Promise<Project> {
  db.run(
    "INSERT INTO projects (name, customer_name, status, assignee, description) VALUES (?, ?, ?, ?, ?)",
    [data.name, data.customer_name, data.status ?? "active", data.assignee ?? "", data.description ?? ""]
  );
  await persist(db);
  const rows = queryAll(db, "SELECT * FROM projects ORDER BY rowid DESC LIMIT 1");
  return rowToProject(rows[0]);
}

export async function updateProject(
  db: Database,
  id: string,
  data: Partial<Omit<Project, "id" | "created_at" | "updated_at">>
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.run(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`, values);
  await persist(db);
}

export async function deleteProject(db: Database, id: string): Promise<void> {
  db.run("DELETE FROM todos WHERE project_id = ?", [id]);
  db.run("DELETE FROM notes WHERE project_id = ?", [id]);
  db.run("DELETE FROM projects WHERE id = ?", [id]);
  await persist(db);
}

export function getProjectCounts(db: Database): Record<ProjectStatus, number> {
  const rows = queryAll(db, "SELECT status, COUNT(*) as count FROM projects GROUP BY status");
  const counts: Record<ProjectStatus, number> = { active: 0, pending: 0, completed: 0, on_hold: 0 };
  for (const row of rows) {
    counts[row.status as ProjectStatus] = row.count as number;
  }
  return counts;
}
