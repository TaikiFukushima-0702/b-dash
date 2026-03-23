import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Task, TaskStore } from "./types.js";
import {
  isNotionConfigured,
  loadTasksFromNotion,
  createTaskInNotion,
  updateTaskInNotion,
  deleteTaskInNotion,
} from "./notion.js";

export function getTaskFilePath(): string {
  return join(process.cwd(), ".tasks.json");
}

async function loadTasksFromFile(filePath?: string): Promise<Task[]> {
  const fp = filePath ?? getTaskFilePath();
  try {
    const data = await readFile(fp, "utf-8");
    const store: TaskStore = JSON.parse(data);
    return store.tasks;
  } catch {
    return [];
  }
}

async function saveTasksToFile(
  tasks: Task[],
  filePath?: string,
): Promise<void> {
  const fp = filePath ?? getTaskFilePath();
  const store: TaskStore = { tasks };
  await writeFile(fp, JSON.stringify(store, null, 2), "utf-8");
}

export async function loadTasks(filePath?: string): Promise<Task[]> {
  if (isNotionConfigured()) {
    return loadTasksFromNotion();
  }
  return loadTasksFromFile(filePath);
}

export async function saveTasks(
  tasks: Task[],
  filePath?: string,
): Promise<void> {
  // Always save to local file as backup
  await saveTasksToFile(tasks, filePath);
}

export async function saveNewTask(task: Task): Promise<void> {
  if (isNotionConfigured()) {
    await createTaskInNotion(task);
  }
}

export async function saveUpdatedTask(task: Task): Promise<void> {
  if (isNotionConfigured()) {
    await updateTaskInNotion(task);
  }
}

export async function removeTask(taskId: string): Promise<void> {
  if (isNotionConfigured()) {
    await deleteTaskInNotion(taskId);
  }
}
