# B-Dash

あなた専用の読書記録ダッシュボード。スマホからでもPCからでも入力でき、
読書データはMCP経由でClaudeにそのまま連携できます。

## できること

- 蔵書管理(積読 / 読書中 / 読了 / 中断)
- **ISBNバーコードスキャン** — スマホのカメラで本の裏を撮ると自動で書誌情報取得
- 5段階評価
- ハイライト・引用メモ(ページ番号 + 自分のコメント付き)
- 読書セッションのタイムトラッキング(開始/終了 + 読んだページ数)
- 月次・全期間の統計(連続読書日数、累計時間、ジャンル傾向)
- タイトル・著者・ハイライト本文の横断検索
- **MCPサーバー内蔵** — Claudeから「今月の読書を要約して」と聞くだけで自動集計
- **PWA** — スマホのホーム画面に追加してネイティブアプリのように使える

## 技術スタック

すべて **無料枠で運用可能** な構成。

| 役割 | 採用 |
|------|------|
| Webアプリ | Next.js 16 (App Router) + TypeScript |
| ホスティング | Vercel (Free) |
| DB + 認証 | Supabase (Free) |
| UI | Tailwind CSS + lucide-react |
| ISBNスキャン | @zxing/browser |
| 書誌情報 | Google Books API + 国立国会図書館サーチAPI |
| MCP | JSON-RPC over HTTP (Streamable HTTP, ステートレス) |

## セットアップ

### 1. Supabaseプロジェクト作成

1. https://supabase.com で新規プロジェクトを作成
2. SQL Editor で `supabase/migrations/0001_init.sql` を実行
3. **Authentication > Providers > Email** でMagic Linkを有効化
4. **Authentication > URL Configuration** の Site URL / Redirect URLs に以下を登録
   - `http://localhost:3000` (開発)
   - `https://YOUR-DOMAIN.vercel.app` (本番)

### 2. 環境変数

`.env.example` を `.env.local` にコピーして埋めます。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...    # Settings > API > anon public
SUPABASE_SERVICE_ROLE_KEY=...        # Settings > API > service_role
ALLOWED_EMAIL=you@example.com        # ログインを許可するあなたのメール
MCP_BEARER_TOKEN=...                 # 例: `openssl rand -hex 32` の出力
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`ALLOWED_EMAIL` に一致するメールしかログインできない単一ユーザー設計です。

### 3. 起動

```bash
npm install
npm run dev
```

http://localhost:3000 → メール入力 → 届いたマジックリンクからログイン。

### 4. Vercelへデプロイ

GitHubリポジトリをVercelにImportし、上の環境変数を設定。
`NEXT_PUBLIC_APP_URL` は本番ドメインに更新します。

## ClaudeへのMCP接続

ログイン後、`/settings/mcp` ページで具体的な設定方法と現在のエンドポイントを確認できます。

### Claude Desktop の場合

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) に追記:

```json
{
  "mcpServers": {
    "b-dash": {
      "type": "http",
      "url": "https://YOUR-DOMAIN.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_BEARER_TOKEN"
      }
    }
  }
}
```

Claude Desktopを再起動すると、ツール一覧に b-dash が現れます。

### 公開ツール

| ツール | 用途 |
|--------|------|
| `list_books(status?, limit?)` | 蔵書一覧 |
| `search_books(query)` | タイトル・著者・ハイライト全文検索 |
| `get_book_detail(id)` | 1冊の詳細(ハイライト・セッション含む) |
| `list_highlights(book_id?)` | ハイライト一覧 |
| `get_monthly_summary(year, month)` | 月次集計 |
| `get_reading_stats()` | 全期間統計 |

### Claudeへの問いかけ例

- 「今月の読書を要約して」 → `get_monthly_summary` 呼び出し
- 「今読書中の本は何?」 → `list_books(status="reading")`
- 「『深層学習』のハイライトを見せて」 → `search_books("深層学習")`
- 「今年読了した本のおすすめは?」 → `list_books(status="finished")` + 評価で並び替え

## スマホでの使い方

1. ChromeまたはSafariで本番URLを開く
2. **「ホーム画面に追加」** でアイコンを追加
3. 開くとアプリ風UI(アドレスバーが消える)
4. 本追加時「ISBNスキャン」 → カメラで本の裏のバーコードを読み取り

## ディレクトリ構成

```
src/
├── app/                       # Next.js App Router
│   ├── api/
│   │   ├── books/             # 本のCRUD
│   │   ├── lookup/            # ISBN → 書誌情報
│   │   └── mcp/               # MCPサーバー (JSON-RPC)
│   ├── auth/                  # マジックリンク認証
│   ├── books/[id]/            # 本の詳細(ハイライト/セッション/タイマー)
│   ├── books/new/             # 本の追加(ISBNスキャナ)
│   ├── search/                # 横断検索
│   ├── settings/mcp/          # MCP接続設定
│   └── stats/                 # 統計ダッシュボード
├── components/
│   ├── ui/                    # button, input, card
│   └── IsbnScanner.tsx        # zxingバーコード読み取り
└── lib/
    ├── supabase/              # クライアント生成
    ├── mcp/tools.ts           # MCPツール定義
    ├── stats.ts               # 集計ロジック (Web/MCP共通)
    ├── book-lookup.ts         # Google Books + NDL
    └── utils.ts
supabase/
└── migrations/0001_init.sql   # RLS付きスキーマ
```

## ライセンス

MIT
