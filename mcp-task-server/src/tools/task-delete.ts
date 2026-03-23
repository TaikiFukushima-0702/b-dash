import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadTasks, saveTasks, removeTask } from "../store.js";

export function registerTaskDelete(server: McpServer): void {
  server.tool(
    "task_delete",
    "Delete a task by ID",
    {
      id: z.string().describe("Task ID to delete"),
    },
    async (params) => {
      try {
        const tasks = await loadTasks();
        const index = tasks.findIndex((t) => t.id === params.id);

        if (index === -1) {
          return {
            content: [
              { type: "text", text: `Task not found: ${params.id}` },
            ],
            isError: true,
          };
        }

        const [deleted] = tasks.splice(index, 1);
        await saveTasks(tasks);
        await removeTask(deleted.id);
        return {
          content: [
            {
              type: "text",
              text: `Deleted task: "${deleted.title}" (${deleted.id})`,
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to delete task: ${e instanceof Error ? e.message : String(e)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
