import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadTasks } from "../store.js";

export function registerTaskSummary(server: McpServer): void {
  server.tool("task_summary", "Show summary and stats of all tasks", {}, async () => {
    try {
      const tasks = await loadTasks();

      if (tasks.length === 0) {
        return {
          content: [{ type: "text", text: "No tasks yet." }],
        };
      }

      const today = new Date().toISOString().slice(0, 10);

      const byStatus = { todo: 0, in_progress: 0, done: 0 };
      const byPriority = { high: 0, medium: 0, low: 0 };
      const overdue: string[] = [];
      const upcoming: string[] = [];
      const tagCounts = new Map<string, number>();

      for (const task of tasks) {
        byStatus[task.status]++;
        byPriority[task.priority]++;

        if (task.dueDate && task.status !== "done") {
          if (task.dueDate < today) {
            overdue.push(`  - ${task.title} (due: ${task.dueDate})`);
          } else {
            const dueDate = new Date(task.dueDate);
            const todayDate = new Date(today);
            const diffDays =
              (dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays <= 7) {
              upcoming.push(`  - ${task.title} (due: ${task.dueDate})`);
            }
          }
        }

        for (const tag of task.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        }
      }

      const lines: string[] = [
        `== Task Summary ==`,
        `Total: ${tasks.length}`,
        ``,
        `Status:`,
        `  TODO:        ${byStatus.todo}`,
        `  In Progress: ${byStatus.in_progress}`,
        `  Done:        ${byStatus.done}`,
        ``,
        `Priority:`,
        `  High:   ${byPriority.high}`,
        `  Medium: ${byPriority.medium}`,
        `  Low:    ${byPriority.low}`,
      ];

      if (overdue.length > 0) {
        lines.push(``, `Overdue (${overdue.length}):`, ...overdue);
      }

      if (upcoming.length > 0) {
        lines.push(``, `Due within 7 days (${upcoming.length}):`, ...upcoming);
      }

      if (tagCounts.size > 0) {
        lines.push(``, `Tags:`);
        for (const [tag, count] of [...tagCounts.entries()].sort()) {
          lines.push(`  ${tag}: ${count}`);
        }
      }

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to generate summary: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }
  });
}
