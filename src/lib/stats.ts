import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient<any, any, any>;

export type MonthlySummary = {
  period: { year: number; month: number };
  totals: {
    books_finished: number;
    books_started: number;
    pages_read: number;
    minutes_read: number;
    sessions: number;
    highlights_added: number;
  };
  finished: Array<{
    id: string;
    title: string;
    authors: string[];
    rating: number | null;
    finished_at: string | null;
  }>;
  reading_now: Array<{
    id: string;
    title: string;
    current_page: number;
    total_pages: number | null;
  }>;
  notable_highlights: Array<{
    book_title: string;
    text: string;
    note: string | null;
  }>;
};

export async function getMonthlySummary(
  supabase: Client,
  userId: string,
  year: number,
  month: number
): Promise<MonthlySummary> {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const [finishedRes, startedRes, sessionsRes, highlightsRes, readingRes] = await Promise.all([
    supabase
      .from("books")
      .select("id,title,authors,rating,finished_at")
      .eq("user_id", userId)
      .gte("finished_at", start.toISOString())
      .lt("finished_at", end.toISOString()),
    supabase
      .from("books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("started_at", start.toISOString())
      .lt("started_at", end.toISOString()),
    supabase
      .from("reading_sessions")
      .select("duration_min,pages_read")
      .eq("user_id", userId)
      .gte("started_at", start.toISOString())
      .lt("started_at", end.toISOString()),
    supabase
      .from("highlights")
      .select("text,note,books!inner(title,user_id)")
      .eq("user_id", userId)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .limit(20),
    supabase
      .from("books")
      .select("id,title,current_page,total_pages")
      .eq("user_id", userId)
      .eq("status", "reading"),
  ]);

  const sessions = sessionsRes.data ?? [];
  const minutes_read = sessions.reduce((a: number, s: any) => a + (s.duration_min ?? 0), 0);
  const pages_read = sessions.reduce((a: number, s: any) => a + (s.pages_read ?? 0), 0);

  return {
    period: { year, month },
    totals: {
      books_finished: finishedRes.data?.length ?? 0,
      books_started: startedRes.count ?? 0,
      pages_read,
      minutes_read,
      sessions: sessions.length,
      highlights_added: highlightsRes.data?.length ?? 0,
    },
    finished: (finishedRes.data ?? []) as MonthlySummary["finished"],
    reading_now: (readingRes.data ?? []) as MonthlySummary["reading_now"],
    notable_highlights: (highlightsRes.data ?? []).slice(0, 10).map((h: any) => ({
      book_title: h.books?.title ?? "",
      text: h.text,
      note: h.note,
    })),
  };
}

export type OverallStats = {
  total_books: number;
  finished: number;
  reading: number;
  to_read: number;
  total_minutes: number;
  total_pages: number;
  total_highlights: number;
  this_year_finished: number;
  current_streak_days: number;
};

export async function getOverallStats(supabase: Client, userId: string): Promise<OverallStats> {
  const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));

  const [counts, sessions, highlights, yearFinished, recentSessions] = await Promise.all([
    supabase.from("books").select("status").eq("user_id", userId),
    supabase.from("reading_sessions").select("duration_min,pages_read").eq("user_id", userId),
    supabase.from("highlights").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "finished")
      .gte("finished_at", yearStart.toISOString()),
    supabase
      .from("reading_sessions")
      .select("started_at")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(60),
  ]);

  const byStatus = (counts.data ?? []).reduce<Record<string, number>>((acc: Record<string, number>, b: any) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  const total_minutes = (sessions.data ?? []).reduce((a: number, s: any) => a + (s.duration_min ?? 0), 0);
  const total_pages = (sessions.data ?? []).reduce((a: number, s: any) => a + (s.pages_read ?? 0), 0);

  // Current streak: consecutive days back from today with at least one session.
  const days = new Set(
    (recentSessions.data ?? []).map((s: any) =>
      new Date(s.started_at).toISOString().slice(0, 10)
    )
  );
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) streak++;
    else if (i > 0) break;
  }

  return {
    total_books: counts.data?.length ?? 0,
    finished: byStatus.finished ?? 0,
    reading: byStatus.reading ?? 0,
    to_read: byStatus.to_read ?? 0,
    total_minutes,
    total_pages,
    total_highlights: highlights.count ?? 0,
    this_year_finished: yearFinished.count ?? 0,
    current_streak_days: streak,
  };
}
