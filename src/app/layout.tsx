import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import { BookOpen, BarChart3, Search, PlusCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "B-Dash | 読書記録",
  description: "あなたの読書を記録し、Claudeと共有するパーソナル読書ダッシュボード",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "B-Dash" },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen pb-20">
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}

function BottomNav() {
  const items = [
    { href: "/", label: "本棚", icon: BookOpen },
    { href: "/search", label: "検索", icon: Search },
    { href: "/books/new", label: "追加", icon: PlusCircle },
    { href: "/stats", label: "統計", icon: BarChart3 },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto max-w-3xl grid grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex flex-col items-center gap-1 py-3 text-xs text-muted hover:text-fg active:text-accent"
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
