import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadTasks } from "../store.js";
import type { Task } from "../types.js";

function formatTask(task: Task): string {
  const lines: string[] = [];
  const statusIcon =
    task.status === "done" ? "[x]" : task.status === "in_progress" ? "[~]" : "[ ]";
  const priorityLabel =
    task.priority === "high" ? "!!!" : task.priority === "medium" ? "!!" : "!";

  lines.push(`${statusIcon} ${priorityLabel} ${task.title} (${task.id.slice(0, 8)})`);

  if (task.description) {
    lines.push(`    ${task.description}`);
  }
  if (task.dueDate) {
    lines.push(`    Due: ${task.dueDate}`);
  }
  if (task.tags.length > 0) {
    lines.push(`    Tags: ${task.tags.join(", ")}`);
  }
  if (task.urls.length > 0) {
    lines.push(`    URLs:`);
    for (const url of task.urls) {
      lines.push(`      - ${url}`);
    }
  }
  return lines.join("\n");
}

export function registerTaskList(server: McpServer): void {
  server.tool(
    "task_list",
    "List tasks with optional filters",
    {
      status: z
        .enum(["todo", "in_progress", "done"])
        .optional()
        .describe("Filter by status"),
      priority: z
        .enum(["high", "medium", "low"])
        .optional()
        .describe("Filter by priority"),
      tag: z.string().optional().describe("Filter by tag"),
      dueBefore: z
        .string()
        .optional()
        .describe("Show tasks due before this date (YYYY-MM-DD)"),
      dueAfter: z
        .string()
        .optional()
        .describe("Show tasks due after this date (YYYY-MM-DD)"),
    },
    async (params) => {
      try {
        let tasks = await loadTasks();

        if (params.status) {
          tasks = tasks.filter((t) => t.status === params.status);
        }
        if (params.priority) {
          tasks = tasks.filter((t) => t.priority === params.priority);
        }
        if (params.tag) {
          tasks = tasks.filter((t) => t.tags.includes(params.tag!));
        }
        if (params.dueBefore) {
          tasks = tasks.filter(
            (t) => t.dueDate !== null && t.dueDate <= params.dueBefore!,
          );
        }
        if (params.dueAfter) {
          tasks = tasks.filter(
            (t) => t.dueDate !== null && t.dueDate >= params.dueAfter!,
          );
        }

        if (tasks.length === 0) {
          return {
            content: [{ type: "text", text: "No tasks found matching the filters." }],
          };
        }

        const output = tasks.map(formatTask).join("\n\n");
        return {
          content: [
            {
              type: "text",
              text: `Found ${tasks.length} task(s):\n\n${output}`,
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to list tasks: ${e instanceof Error ? e.message : String(e)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
