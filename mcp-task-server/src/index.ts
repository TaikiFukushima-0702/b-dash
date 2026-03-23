import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTaskCreate } from "./tools/task-create.js";
import { registerTaskList } from "./tools/task-list.js";
import { registerTaskUpdate } from "./tools/task-update.js";
import { registerTaskDelete } from "./tools/task-delete.js";
import { registerTaskSummary } from "./tools/task-summary.js";
import { registerTaskAddUrl } from "./tools/task-add-url.js";
import { registerTaskRemoveUrl } from "./tools/task-remove-url.js";
import { isNotionConfigured, initNotionDatabase } from "./notion.js";

const server = new McpServer({
  name: "task-manager",
  version: "1.0.0",
});

// Initialize Notion database if configured
if (isNotionConfigured()) {
  try {
    await initNotionDatabase();
    console.error("[task-manager] Notion backend initialized");
  } catch (e) {
    console.error(
      `[task-manager] Failed to initialize Notion: ${e instanceof Error ? e.message : String(e)}. Falling back to local file.`,
    );
  }
}

registerTaskCreate(server);
registerTaskList(server);
registerTaskUpdate(server);
registerTaskDelete(server);
registerTaskSummary(server);
registerTaskAddUrl(server);
registerTaskRemoveUrl(server);

const transport = new StdioServerTransport();
await server.connect(transport);
