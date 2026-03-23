import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadTasks, saveTasks, saveUpdatedTask } from "../store.js";

export function registerTaskRemoveUrl(server: McpServer): void {
  server.tool(
    "task_remove_url",
    "Remove one or more URLs from an existing task",
    {
      id: z.string().describe("Task ID"),
      urls: z
        .array(z.string())
        .describe("URLs to remove"),
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

        const before = task.urls.length;
        task.urls = task.urls.filter((u) => !params.urls.includes(u));
        const removed = before - task.urls.length;

        if (removed === 0) {
          return {
            content: [
              { type: "text", text: "No matching URLs found to remove." },
            ],
          };
        }

        task.updatedAt = new Date().toISOString();
        await saveTasks(tasks);
        await saveUpdatedTask(task);

        const remaining =
          task.urls.length > 0
            ? `\nRemaining URLs:\n${task.urls.map((u) => `  - ${u}`).join("\n")}`
            : "\nNo URLs remaining.";

        return {
          content: [
            {
              type: "text",
              text: `Removed ${removed} URL(s) from "${task.title}".${remaining}`,
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to remove URL: ${e instanceof Error ? e.message : String(e)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
