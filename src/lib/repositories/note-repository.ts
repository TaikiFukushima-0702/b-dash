import type { Database } from "sql.js";
import { persist } from "@/lib/db";
import type { Note } from "@/types";

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    content: row.content as string,
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

export function getNotesByProjectId(db: Database, projectId: string): Note[] {
  return queryAll(db, "SELECT * FROM notes WHERE project_id = ? ORDER BY updated_at DESC", [projectId]).map(rowToNote);
}

export async function createNote(
  db: Database,
  data: { project_id: string; content: string }
): Promise<Note> {
  db.run("INSERT INTO notes (project_id, content) VALUES (?, ?)", [data.project_id, data.content]);
  await persist(db);
  const rows = queryAll(db, "SELECT * FROM notes ORDER BY rowid DESC LIMIT 1");
  return rowToNote(rows[0]);
}

export async function updateNote(db: Database, id: string, content: string): Promise<void> {
  db.run("UPDATE notes SET content = ?, updated_at = datetime('now') WHERE id = ?", [content, id]);
  await persist(db);
}

export async function deleteNote(db: Database, id: string): Promise<void> {
  db.run("DELETE FROM notes WHERE id = ?", [id]);
  await persist(db);
}

export function getRecentNotes(db: Database, limit: number = 10): (Note & { project_name: string })[] {
  const rows = queryAll(
    db,
    "SELECT n.*, p.name as project_name FROM notes n JOIN projects p ON n.project_id = p.id ORDER BY n.updated_at DESC LIMIT ?",
    [limit]
  );
  return rows.map((row) => ({
    ...rowToNote(row),
    project_name: row.project_name as string,
  }));
}
