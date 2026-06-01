import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isAuthDisabled, verifySessionToken } from "./lib/auth";

// /login と /api/cron 以外を認証ガードする（Next.js 16 の proxy 規約）。

const PUBLIC_PATHS = ["/login", "/api/cron", "/manifest.webmanifest", "/sw.js"];

export async function proxy(req: NextRequest) {
  if (isAuthDisabled()) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const ok = await verifySessionToken(token);
  if (ok) return NextResponse.next();

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // 静的アセット・画像最適化を除外。
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|characters|.*\\.png$).*)"],
};
