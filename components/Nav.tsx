"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "ホーム", emoji: "🏠" },
  { href: "/shop", label: "おみせ", emoji: "🏪" },
  { href: "/inventory", label: "もちもの", emoji: "🎒" },
  { href: "/goals", label: "もくひょう", emoji: "🎯" },
  { href: "/settings", label: "せってい", emoji: "⚙️" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-3 z-30 mx-auto mt-6 w-full max-w-xl px-3">
      <ul className="flex items-stretch justify-between gap-1 rounded-3xl border-4 border-frame-dark bg-white/95 p-2 shadow-pop backdrop-blur">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-transparent px-1 py-1 text-[10px] font-bold transition ${
                  active
                    ? "border-frame-dark bg-pop-yellow text-frame-dark shadow-pop"
                    : "text-frame-mid hover:bg-frame-light"
                }`}
              >
                <span className="text-xl">{t.emoji}</span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
