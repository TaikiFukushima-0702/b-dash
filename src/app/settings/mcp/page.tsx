import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function McpSettingsPage() {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const mcpUrl = `${url}/api/mcp`;

  const claudeDesktopConfig = `{
  "mcpServers": {
    "b-dash": {
      "type": "http",
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_BEARER_TOKEN"
      }
    }
  }
}`;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/stats" className="text-sm text-muted">← 戻る</Link>
      <h1 className="text-2xl font-bold">MCP接続設定</h1>

      <Card>
        <p className="text-sm mb-2">
          ClaudeからB-Dashの読書データに直接アクセスできます。以下のURLとトークンを使って接続してください。
        </p>
        <div className="text-xs text-muted">エンドポイント</div>
        <code className="block bg-bg border border-border rounded px-2 py-1 my-1 text-sm break-all">
          {mcpUrl}
        </code>
        <div className="text-xs text-muted mt-2">認証</div>
        <code className="block bg-bg border border-border rounded px-2 py-1 my-1 text-sm">
          Authorization: Bearer &lt;MCP_BEARER_TOKEN&gt;
        </code>
        <p className="text-xs text-muted mt-2">
          トークンは環境変数 <code>MCP_BEARER_TOKEN</code> に設定した値です。
        </p>
      </Card>

      <Card>
        <h2 className="font-semibold mb-2">Claude Desktop での設定例</h2>
        <p className="text-xs text-muted mb-2">
          <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>{" "}
          (macOS) に追記
        </p>
        <pre className="bg-bg border border-border rounded p-3 text-xs overflow-x-auto">
{claudeDesktopConfig}
        </pre>
      </Card>

      <Card>
        <h2 className="font-semibold mb-2">使い方の例</h2>
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>「今月の読書を要約して」 → <code>get_monthly_summary</code> を自動実行</li>
          <li>「最近の読書傾向は?」 → <code>get_reading_stats</code> + <code>list_books</code></li>
          <li>「『深層学習』についてのハイライトを教えて」 → <code>search_books</code></li>
          <li>「読書中の本のおすすめの読み進め方は?」 → <code>list_books(status=reading)</code></li>
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold mb-2">公開ツール</h2>
        <ul className="text-sm space-y-1">
          <li><code>list_books</code> — 蔵書一覧</li>
          <li><code>search_books</code> — 横断検索</li>
          <li><code>get_book_detail</code> — 1冊の詳細</li>
          <li><code>list_highlights</code> — ハイライト一覧</li>
          <li><code>get_monthly_summary</code> — 月次要約</li>
          <li><code>get_reading_stats</code> — 全期間統計</li>
        </ul>
      </Card>
    </div>
  );
}
