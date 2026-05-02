import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getMonthlySummary, getOverallStats } from "@/lib/stats";

type Json = Record<string, unknown>;

export type Tool = {
  name: string;
  description: string;
  inputSchema: Json;
  handler: (args: any) => Promise<unknown>;
};

function admin() {
  return createSupabaseAdminClient();
}

async function getOwnerId() {
  // Single-user mode: resolve the owner via ALLOWED_EMAIL.
  const email = process.env.ALLOWED_EMAIL?.toLowerCase();
  if (!email) throw new Error("ALLOWED_EMAIL is not configured");
  const sb = admin();
  const { data, error } = await sb.auth.admin.listUsers();
  if (error) throw error;
  const user = data.users.find((u: any) => u.email?.toLowerCase() === email);
  if (!user) throw new Error("Owner user not found. Sign in via the web app first.");
  return user.id as string;
}

export const tools: Tool[] = [
  {
    name: "list_books",
    description:
      "ユーザーの蔵書を一覧する。status と tag で絞り込み可能。読書ステータス: to_read(積読), reading(読書中), finished(読了), dnf(中断)",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["to_read", "reading", "finished", "dnf"] },
        tag: { type: "string" },
        limit: { type: "number", default: 50 },
      },
    },
    handler: async ({ status, limit = 50 }) => {
      const userId = await getOwnerId();
      const sb = admin();
      let q = sb
        .from("books")
        .select("id,isbn,title,authors,status,rating,current_page,total_pages,started_at,finished_at,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return { books: data };
    },
  },
  {
    name: "search_books",
    description: "タイトル・著者・メモ・ハイライト本文を横断して全文検索する",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "number", default: 30 } },
      required: ["query"],
    },
    handler: async ({ query, limit = 30 }) => {
      const userId = await getOwnerId();
      const sb = admin();
      const q = String(query).replace(/[%_]/g, "");
      const [books, highlights] = await Promise.all([
        sb
          .from("books")
          .select("id,title,authors,status")
          .eq("user_id", userId)
          .or(`title.ilike.%${q}%,notes.ilike.%${q}%`)
          .limit(limit),
        sb
          .from("highlights")
          .select("id,book_id,text,note,page,books(title)")
          .eq("user_id", userId)
          .or(`text.ilike.%${q}%,note.ilike.%${q}%`)
          .limit(limit),
      ]);
      return { books: books.data ?? [], highlights: highlights.data ?? [] };
    },
  },
  {
    name: "get_book_detail",
    description: "1冊の本の詳細(ハイライト・読書セッション含む)を取得する",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    handler: async ({ id }) => {
      const userId = await getOwnerId();
      const sb = admin();
      const [book, highlights, sessions] = await Promise.all([
        sb.from("books").select("*").eq("user_id", userId).eq("id", id).single(),
        sb
          .from("highlights")
          .select("page,text,note,created_at")
          .eq("user_id", userId)
          .eq("book_id", id)
          .order("page", { ascending: true, nullsFirst: false }),
        sb
          .from("reading_sessions")
          .select("started_at,ended_at,duration_min,pages_read")
          .eq("user_id", userId)
          .eq("book_id", id)
          .order("started_at", { ascending: false }),
      ]);
      if (book.error || !book.data) throw new Error("not found");
      return {
        book: book.data,
        highlights: highlights.data ?? [],
        sessions: sessions.data ?? [],
      };
    },
  },
  {
    name: "get_monthly_summary",
    description:
      "指定月の読書実績を集計(冊数・時間・ページ・セッション数・読了タイトル・印象的なハイライト抜粋)。" +
      "Claudeはこのデータを元に自然言語でその月の傾向を要約できる。",
    inputSchema: {
      type: "object",
      properties: {
        year: { type: "number" },
        month: { type: "number", minimum: 1, maximum: 12 },
      },
      required: ["year", "month"],
    },
    handler: async ({ year, month }) => {
      const userId = await getOwnerId();
      return await getMonthlySummary(admin(), userId, Number(year), Number(month));
    },
  },
  {
    name: "get_reading_stats",
    description: "全期間の読書統計(累計、今年読了、連続読書日数など)を取得する",
    inputSchema: { type: "object", properties: {} },
    handler: async () => {
      const userId = await getOwnerId();
      return await getOverallStats(admin(), userId);
    },
  },
  {
    name: "list_highlights",
    description:
      "ハイライトを一覧する。book_id を指定すると特定の本のみ。最近順、最大100件。",
    inputSchema: {
      type: "object",
      properties: {
        book_id: { type: "string" },
        limit: { type: "number", default: 50 },
      },
    },
    handler: async ({ book_id, limit = 50 }) => {
      const userId = await getOwnerId();
      const sb = admin();
      let q = sb
        .from("highlights")
        .select("id,book_id,page,text,note,created_at,books(title,authors)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (book_id) q = q.eq("book_id", book_id);
      const { data, error } = await q;
      if (error) throw error;
      return { highlights: data };
    },
  },
];
