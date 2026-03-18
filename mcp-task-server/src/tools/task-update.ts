import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadTasks, saveTasks } from "../store.js";

export function registerTaskUpdate(server: McpServer): void {
  server.tool(
    "task_update",
    "Update one or more fields of an existing task",
    {
      id: z.string().describe("Task ID to update"),
      title: z.string().optional().describe("New title"),
      description: z.string().optional().describe("New description"),
      status: z
        .enum(["todo", "in_progress", "done"])
        .optional()
        .describe("New status"),
      priority: z
        .enum(["high", "medium", "low"])
        .optional()
        .describe("New priority"),
      dueDate: z
        .string()
        .nullable()
        .optional()
        .describe("New due date (YYYY-MM-DD) or null to clear"),
      tags: z.array(z.string()).optional().describe("New tags"),
      urls: z
        .array(z.string())
        .optional()
        .describe("New URLs"),
    },
    async (params) => {
      try {
        const tasks = await loadTasks();
        const task = tasks.find((t) => t.id === params.id);

        if (!task) {
          return {
            content: [
              { type: "text", text: `Task not found: ${params.id}` },
            ],
            isError: true,
          };
        }

        if (params.title !== undefined) task.title = params.title;
        if (params.description !== undefined) task.description = params.description;
        if (params.status !== undefined) task.status = params.status;
        if (params.priority !== undefined) task.priority = params.priority;
        if (params.dueDate !== undefined) task.dueDate = params.dueDate;
        if (params.tags !== undefined) task.tags = params.tags;
        if (params.urls !== undefined) task.urls = params.urls;
        task.updatedAt = new Date().toISOString();

        await saveTasks(tasks);
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
              text: `Failed to update task: ${e instanceof Error ? e.message : String(e)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
