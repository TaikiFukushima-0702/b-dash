import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Study Quest 〜まなびそだてるたまご〜",
  description:
    "勉強や読書、運動などの自己研鑽でキャラクターが育つ、たまごっち風の学習ゲーム",
};

export const viewport: Viewport = {
  themeColor: "#fff7e6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <ToastProvider>
          <header className="mx-auto w-full max-w-xl px-4 pt-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-frame-dark drop-shadow-sm">
                ✨ Study Quest
              </h1>
              <span className="rounded-full border-2 border-frame-dark bg-white px-3 py-0.5 text-[10px] font-bold text-frame-dark shadow-pop">
                v0.1
              </span>
            </div>
          </header>
          <main className="mx-auto w-full max-w-xl px-4 pb-32 pt-4">{children}</main>
          <Nav />
        </ToastProvider>
      </body>
    </html>
  );
}
