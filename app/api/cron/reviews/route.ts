import { NextResponse } from "next/server";
import { listDueReviews } from "@/lib/data";
import { isNotionConfigured } from "@/lib/notion";

export const dynamic = "force-dynamic";

/**
 * 日次 cron（Vercel Cron）。期限到来の復習件数を集計して返す。
 * CRON_SECRET が設定されていれば Authorization: Bearer で検証する。
 * 将来: ここから Claude / Notion 経由でリマインドを送る拡張が可能。
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!isNotionConfigured()) {
    return NextResponse.json({ ok: false, reason: "notion-not-configured" });
  }

  const due = await listDueReviews();
  return NextResponse.json({
    ok: true,
    dueCount: due.length,
    items: due.map((d) => ({ name: d.name, category: d.category })),
  });
}
