export function GET() {
  const manifest = {
    name: "B-Dash | 読書記録",
    short_name: "B-Dash",
    description: "あなた専用の読書ダッシュボード",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#4F46E5",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "本を追加", short_name: "追加", url: "/books/new" },
      { name: "検索", url: "/search" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
