import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FE道場 — 基本情報技術者試験 学習",
    short_name: "FE道場",
    description: "基本情報技術者試験を、キャラ育成・記録・復習で楽しく続ける学習アプリ。",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0e1018",
    theme_color: "#6d5efc",
    lang: "ja",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
