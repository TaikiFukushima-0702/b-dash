import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadTasks, saveTasks } from "../store.js";

export function registerTaskAddUrl(server: McpServer): void {
  server.tool(
    "task_add_url",
    "Add one or more URLs to an existing task (preserves existing URLs)",
    {
      id: z.string().describe("Task ID"),
      urls: z
        .array(z.string())
        .describe("URLs to add (e.g. GitHub issues, PRs, docs)"),
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

        const newUrls = params.urls.filter((u) => !task.urls.includes(u));
        if (newUrls.length === 0) {
          return {
            content: [
              { type: "text", text: "All URLs already exist on this task." },
            ],
          };
        }

        task.urls.push(...newUrls);
        task.updatedAt = new Date().toISOString();

        await saveTasks(tasks);
        return {
          content: [
            {
              type: "text",
              text: `Added ${newUrls.length} URL(s) to "${task.title}":\n${newUrls.map((u) => `  - ${u}`).join("\n")}\n\nAll URLs:\n${task.urls.map((u) => `  - ${u}`).join("\n")}`,
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to add URL: ${e instanceof Error ? e.message : String(e)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
