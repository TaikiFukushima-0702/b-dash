import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Task, TaskStore } from "./types.js";

export function getTaskFilePath(): string {
  return join(process.cwd(), ".tasks.json");
}

export async function loadTasks(filePath?: string): Promise<Task[]> {
  const fp = filePath ?? getTaskFilePath();
  try {
    const data = await readFile(fp, "utf-8");
    const store: TaskStore = JSON.parse(data);
    return store.tasks;
  } catch {
    return [];
  }
}

export async function saveTasks(
  tasks: Task[],
  filePath?: string,
): Promise<void> {
  const fp = filePath ?? getTaskFilePath();
  const store: TaskStore = { tasks };
  await writeFile(fp, JSON.stringify(store, null, 2), "utf-8");
}
