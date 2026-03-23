import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { syncLocalToNotion } from "../store.js";
import { isNotionConfigured } from "../notion.js";

export function registerTaskSync(server: McpServer): void {
  server.tool(
    "task_sync",
    "Sync all local tasks to Notion. Creates new tasks in Notion that don't exist yet, and updates tasks where the local version is newer.",
    {},
    async () => {
      if (!isNotionConfigured()) {
        return {
          content: [
            {
              type: "text",
              text: "Notion is not configured. Set NOTION_API_KEY and NOTION_PARENT_PAGE_ID environment variables.",
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await syncLocalToNotion();
        const lines = [
          "Sync completed successfully:",
          `  Created: ${result.created}`,
          `  Updated: ${result.updated}`,
          `  Skipped (already up to date): ${result.skipped}`,
        ];
        return {
          content: [{ type: "text", text: lines.join("\n") }],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to sync: ${e instanceof Error ? e.message : String(e)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
