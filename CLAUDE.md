# CLAUDE.md — このリポジトリで作業する際のガイド

## プロジェクト概要
基本情報技術者試験（FE）の学習アプリ「FE道場」。Next.js (App Router) + TypeScript + Tailwind、
データは Notion、ホスティングは Vercel。学習をゲーミフィケーション（XP・4 段階進化のキャラ）で継続支援する。

## アーキテクチャ
- すべての Notion アクセスはサーバー側のみ（`lib/notion.ts` 経由、`import "server-only"`）。トークンをクライアントに渡さない。
- 画面はサーバーコンポーネント（`force-dynamic`）で都度 Notion を読み、書き込みはサーバーアクション（`app/actions/*`）。
- ゲーミフィケーション/SRS の計算は純関数として `lib/xp.ts` `lib/srs.ts` `lib/character.ts` に集約（テストしやすい）。
- 分野の統制語彙の正本は `lib/fe-categories.ts`。Notion のセレクト選択肢はこれをミラーする。

## 重要ファイル
- `lib/notion.ts` / `lib/data.ts` — Notion クライアントとデータアクセス
- `lib/xp.ts` — XP・レベル計算（ゲーミフィケーションの核）
- `lib/srs.ts` — 間隔反復（SM-2-lite）
- `lib/character.ts` — レベル→進化段階→画像の対応
- `app/actions/*` — 書き込み（学習記録・過去問・復習・スケジュール・認証）

## 守るべき制約
- ⚖️ 過去問道場（fe-siken.com）の**問題文を取得・スクレイプ・保存・表示しない**。リンクと自己申告値のみ。
- モデル識別子（`claude-...`）をコミット・コード・PR 等の成果物に書かない。

## 開発
```bash
npm run dev      # 開発
npm run build    # 型チェック込みビルド（コミット前に通すこと）
npm run lint     # ESLint
```

## Claude による学習サポートの運用（Notion MCP）
アプリと Claude は同じ Notion DB を参照する。代表的な依頼:
- 週次レビュー: 「直近 1 週間の **Study Log** と **Category Stats** を読み、弱点・来週の重点・
  追加すべき復習トピックを提案して」
- 復習投入: 提案したトピックを **Review Queue** に `Status=Active`・`CreatedBy=claude` で追加。
- 進捗確認: **Character State** の TotalXP/Level/Stage、**Schedule** の試験本番日からの残日数を確認。
