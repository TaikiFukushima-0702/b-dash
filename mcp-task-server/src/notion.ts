import { Client } from "@notionhq/client";
import type { Task, TaskStatus, TaskPriority } from "./types.js";

let notion: Client | null = null;
let databaseId: string | null = null;

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;

export function isNotionConfigured(): boolean {
  return Boolean(NOTION_API_KEY && NOTION_PARENT_PAGE_ID);
}

function getNotion(): Client {
  if (!notion) {
    if (!NOTION_API_KEY) {
      throw new Error("NOTION_API_KEY is not set");
    }
    notion = new Client({ auth: NOTION_API_KEY });
  }
  return notion;
}

export async function initNotionDatabase(): Promise<string> {
  if (databaseId) return databaseId;

  const client = getNotion();

  // Search for existing database under the parent page
  const children = await client.blocks.children.list({
    block_id: NOTION_PARENT_PAGE_ID!,
    page_size: 100,
  });

  for (const block of children.results) {
    if ("type" in block && block.type === "child_database") {
      databaseId = block.id;
      return databaseId;
    }
  }

  // Create a new database
  const db = await client.databases.create({
    parent: { type: "page_id", page_id: NOTION_PARENT_PAGE_ID! },
    title: [{ type: "text", text: { content: "Tasks" } }],
    properties: {
      Title: { title: {} },
      Description: { rich_text: {} },
      Status: {
        select: {
          options: [
            { name: "todo", color: "gray" },
            { name: "in_progress", color: "yellow" },
            { name: "done", color: "green" },
          ],
        },
      },
      Priority: {
        select: {
          options: [
            { name: "high", color: "red" },
            { name: "medium", color: "orange" },
            { name: "low", color: "blue" },
          ],
        },
      },
      DueDate: { date: {} },
      Tags: { multi_select: { options: [] } },
      URLs: { rich_text: {} },
      TaskID: { rich_text: {} },
    },
  });

  databaseId = db.id;
  return databaseId;
}

function extractPlainText(
  richText: Array<{ plain_text: string }>,
): string {
  return richText.map((rt) => rt.plain_text).join("");
}

export function notionPageToTask(page: Record<string, any>): Task {
  const props = page.properties;

  const titleRt = props.Title?.title ?? [];
  const descRt = props.Description?.rich_text ?? [];
  const statusSel = props.Status?.select;
  const prioritySel = props.Priority?.select;
  const dueDateProp = props.DueDate?.date;
  const tagsMsel = props.Tags?.multi_select ?? [];
  const urlsRt = props.URLs?.rich_text ?? [];
  const taskIdRt = props.TaskID?.rich_text ?? [];

  const urlsStr = extractPlainText(urlsRt);
  const urls = urlsStr ? urlsStr.split("\n").filter(Boolean) : [];

  return {
    id: extractPlainText(taskIdRt) || page.id,
    title: extractPlainText(titleRt),
    description: extractPlainText(descRt),
    status: (statusSel?.name as TaskStatus) ?? "todo",
    priority: (prioritySel?.name as TaskPriority) ?? "medium",
    dueDate: dueDateProp?.start ?? null,
    tags: tagsMsel.map((t: { name: string }) => t.name),
    urls,
    createdAt: page.created_time,
    updatedAt: page.last_edited_time,
  };
}

export function taskToNotionProperties(task: Task): Record<string, any> {
  const props: Record<string, any> = {
    Title: { title: [{ text: { content: task.title } }] },
    Description: { rich_text: [{ text: { content: task.description } }] },
    Status: { select: { name: task.status } },
    Priority: { select: { name: task.priority } },
    Tags: { multi_select: task.tags.map((t) => ({ name: t })) },
    URLs: {
      rich_text: [{ text: { content: task.urls.join("\n") } }],
    },
    TaskID: { rich_text: [{ text: { content: task.id } }] },
  };

  if (task.dueDate) {
    props.DueDate = { date: { start: task.dueDate } };
  } else {
    props.DueDate = { date: null };
  }

  return props;
}

export async function loadTasksFromNotion(): Promise<Task[]> {
  const client = getNotion();
  const dbId = await initNotionDatabase();

  const pages: any[] = [];
  let cursor: string | undefined;

  do {
    const response = await client.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...response.results);
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages.map(notionPageToTask);
}

async function findNotionPageByTaskId(
  taskId: string,
): Promise<string | null> {
  const client = getNotion();
  const dbId = await initNotionDatabase();

  const response = await client.databases.query({
    database_id: dbId,
    filter: {
      property: "TaskID",
      rich_text: { equals: taskId },
    },
    page_size: 1,
  });

  if (response.results.length > 0) {
    return response.results[0].id;
  }
  return null;
}

export async function createTaskInNotion(task: Task): Promise<void> {
  const client = getNotion();
  const dbId = await initNotionDatabase();

  await client.pages.create({
    parent: { database_id: dbId },
    properties: taskToNotionProperties(task),
  });
}

export async function updateTaskInNotion(task: Task): Promise<void> {
  const client = getNotion();
  const pageId = await findNotionPageByTaskId(task.id);

  if (!pageId) {
    // If not found in Notion, create it
    await createTaskInNotion(task);
    return;
  }

  await client.pages.update({
    page_id: pageId,
    properties: taskToNotionProperties(task),
  });
}

export async function deleteTaskInNotion(taskId: string): Promise<void> {
  const client = getNotion();
  const pageId = await findNotionPageByTaskId(taskId);

  if (pageId) {
    await client.blocks.delete({ block_id: pageId });
  }
}
