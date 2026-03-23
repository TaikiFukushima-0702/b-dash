import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Task } from "../types.js";
import { loadTasks, saveTasks, saveNewTask } from "../store.js";

export function registerTaskCreate(server: McpServer): void {
  server.tool(
    "task_create",
    "Create a new task",
    {
      title: z.string().describe("Task title"),
      description: z.string().default("").describe("Task description"),
      status: z
        .enum(["todo", "in_progress", "done"])
        .default("todo")
        .describe("Task status"),
      priority: z
        .enum(["high", "medium", "low"])
        .default("medium")
        .describe("Task priority"),
      dueDate: z
        .string()
        .nullable()
        .default(null)
        .describe("Due date in YYYY-MM-DD format"),
      tags: z.array(z.string()).default([]).describe("List of tags"),
      urls: z
        .array(z.string())
        .default([])
        .describe("Related URLs (e.g. GitHub issues, PRs, docs)"),
    },
    async (params) => {
      try {
        const tasks = await loadTasks();
        const now = new Date().toISOString();
        const task: Task = {
          id: randomUUID(),
          title: params.title,
          description: params.description,
          status: params.status,
          priority: params.priority,
          dueDate: params.dueDate,
          tags: params.tags,
          urls: params.urls,
          createdAt: now,
          updatedAt: now,
        };
        tasks.push(task);
        await saveTasks(tasks);
        await saveNewTask(task);
        return {
          content: [
            { type: "text", text: JSON.stringify(task, null, 2) },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to create task: ${e instanceof Error ? e.message : String(e)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
