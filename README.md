# FE道場 — 基本情報技術者試験 学習アプリ

キタミ式参考書＋[過去問道場](https://www.fe-siken.com/fekakomon.php)での学習を、**キャラ育成（多段進化）・毎日の記録・振り返り・間隔反復の復習・スケジュール**で楽しく続けるための、スマホ対応 PWA です。データは **Notion** に保存し、**Claude** が Notion MCP 経由で同じデータを読んで週次の振り返りやアドバイスを行えます。

- スタック: **Next.js (App Router) + TypeScript + Tailwind CSS**、ホスティングは **Vercel**
- データ基盤: **Notion**（アプリは Notion API、Claude は Notion MCP で共有）
- 認証: 単一ユーザー向けのパスフレーズ＋署名クッキー

> ⚖️ **著作権について**: 過去問道場の問題文は著作物です。本アプリは問題文を取得・転載・保存しません。外部リンクで開き、**解いた数・正答数・分野などの自己申告値のみ**を記録します。

---

## 主な機能

| 機能 | 内容 |
| --- | --- |
| 🎮 キャラ育成 | 学習で XP を獲得しレベルアップ。4 段階の進化で成長を実感 |
| ✏️ 学習記録 | 時間・教材・分野・章・気分・振り返りを記録（振り返りで +10 XP） |
| 📝 過去問記録 | 過去問道場へのリンク＋結果の自己申告。分野別正答率を集計 |
| 🔁 復習 | SM-2 ベースの間隔反復。Again/Hard/Good/Easy で採点 |
| 📅 スケジュール | 学習計画・模試・試験日を管理。試験本番までのカウントダウン |
| 📊 統計 | 分野別正答率グラフと弱点のハイライト |
| 📲 PWA | ホーム画面に追加してアプリのように利用可能 |

---

## セットアップ

### 1. Notion を準備する

1. [Notion Integrations](https://www.notion.so/my-integrations) で内部インテグレーションを作成し、**Internal Integration Token** を取得（`NOTION_TOKEN`）。
2. DB を置きたい**親ページ**を 1 つ作り、右上「…」→「コネクト」で**作成したインテグレーションを接続**。

#### 🚀 かんたんセットアップ（推奨）

6 つの DB をスキーマごと自動作成するスクリプトを同梱しています。手作業のミスを防げます。

```bash
npm install
NOTION_TOKEN=secret_xxx npm run setup:notion -- <親ページID>
```

実行後に出力される `NOTION_DB_*` の行を `.env.local` / Vercel にそのまま貼り付けてください。
（親ページ ID は親ページ URL 末尾の 32 桁。Integration への共有を忘れずに）

#### 手動で作る場合

各 DB の URL（`https://www.notion.so/xxxx…?v=…` の `xxxx…` 32 桁）を環境変数に設定し、下表どおりの列を作成します。

#### データベースと列（プロパティ名は完全一致させること）

**Study Log**（`NOTION_DB_STUDY_LOG`）
| プロパティ | 種類 |
| --- | --- |
| Name | タイトル |
| Date | 日付 |
| Minutes | 数値 |
| Source | セレクト（キタミ式 / 過去問道場 / その他）|
| Category | マルチセレクト（FE 分野）|
| Chapter | テキスト |
| ProblemsAttempted | 数値 |
| ProblemsCorrect | 数値 |
| XP | 数値 |
| Reflection | テキスト |
| Mood | セレクト（😀/😐/😫）|
| CreatedBy | セレクト（app / claude）|

**Review Queue**（`NOTION_DB_REVIEW`）
| プロパティ | 種類 |
| --- | --- |
| Name | タイトル |
| Category | セレクト |
| SourceRef | URL |
| EaseFactor | 数値 |
| IntervalDays | 数値 |
| Repetitions | 数値 |
| DueDate | 日付 |
| LastResult | セレクト（Again/Hard/Good/Easy）|
| LastReviewed | 日付 |
| Status | セレクト（Active/Suspended/Mastered）|

**Schedule**（`NOTION_DB_SCHEDULE`）
| プロパティ | 種類 |
| --- | --- |
| Name | タイトル |
| Date | 日付 |
| Type | セレクト（学習計画/模試/試験本番/復習）|
| Category | マルチセレクト |
| Done | チェックボックス |
| CalendarEventId | テキスト |

**Character State**（`NOTION_DB_CHARACTER`）— 1 行だけ自動作成されます
| プロパティ | 種類 |
| --- | --- |
| Name | タイトル |
| TotalXP | 数値 |
| Level | 数値 |
| Stage | 数値 |
| StageName | テキスト |
| Streak | 数値 |
| LastStudyDate | 日付 |

**Category Stats**（`NOTION_DB_CATEGORY_STATS`）
| プロパティ | 種類 |
| --- | --- |
| Name | タイトル（分野名）|
| TotalAttempted | 数値 |
| TotalCorrect | 数値 |
| Accuracy | 関数: `prop("TotalCorrect") / prop("TotalAttempted")`（任意。無くてもアプリ側で算出）|
| WeakFlag | 関数: `prop("Accuracy") < 0.6`（任意）|
| Syllabus | セレクト（テクノロジ系/マネジメント系/ストラテジ系）|

> 分野（Category / Syllabus）の統制語彙は `lib/fe-categories.ts` が正本です。Notion のセレクト選択肢はアプリの書き込み時に自動追加されるため、手動で全部作らなくても動きます。

### 2. 環境変数

`.env.example` を `.env.local` にコピーして設定します。

```bash
cp .env.example .env.local
```

| 変数 | 説明 |
| --- | --- |
| `NOTION_TOKEN` | Notion インテグレーションのトークン |
| `NOTION_DB_*` | 各データベースの ID（5 つ）|
| `APP_PASSPHRASE` | ログイン用パスフレーズ（**未設定だと認証無効**）|
| `AUTH_SECRET` | クッキー署名鍵（`openssl rand -base64 32`）|
| `CRON_SECRET` | Cron 用 Bearer トークン（任意）|

### 3. ローカル起動

```bash
npm install
npm run dev      # http://localhost:3000
```

`APP_PASSPHRASE` を設定している場合はログイン後に利用できます。Notion 未設定でも UI は閲覧でき、画面にセットアップ案内が表示されます。

### 4. Vercel へデプロイ

1. このリポジトリを Vercel に接続。
2. プロジェクト設定で上記の環境変数をすべて登録。
3. デプロイ。`vercel.json` により `/api/cron/reviews` が毎日 0:00 (UTC) に実行されます。

---

## Claude との連携

- アプリと Claude は **同じ Notion DB** を見ます（アプリ=Notion API、Claude=Notion MCP）。
- 週次の使い方例: Claude に「今週の Study Log と Category Stats を読んで、弱点・来週の重点・復習に追加すべきトピックを提案して」と依頼。
- Claude が提案した復習トピックは `CreatedBy = claude` として Review Queue に追加する運用も可能です。
- 詳細は `CLAUDE.md` を参照。

---

## 同梱の MCP サーバー

`mcp/` 配下には、Claude に別のデータ源をつなぐための MCP サーバーを置いています（本体アプリとは独立した Node パッケージ）。

| ディレクトリ | 内容 |
| --- | --- |
| [`mcp/moneyforward-me`](mcp/moneyforward-me/README.md) | マネーフォワード ME からエクスポートした家計簿 CSV を読み、支出の集計・明細検索・資産の把握・予算チェックを行う |

```bash
cd mcp/moneyforward-me
npm install   # postinstall でビルド
npm test
```

---

## キャラクター画像

現状はプレースホルダーの **インライン SVG**（`components/CharacterArt.tsx`）で 4 段階を描画しています。本番アートに差し替える手順は `public/characters/README.md` を参照してください（`lib/character.ts` の `imageForStage` が `/characters/stage-N.png` を返します）。

---

## XP・進化の設計

- 学習 1 分 = 1 XP / 過去問 正答 1 問 = 5 XP（挑戦でも +1）/ 振り返り = +10 XP
- 連続学習でボーナス倍率（最大 ×1.5）
- レベル: `xpForLevel(L) = 100 × L^1.5` の累積
- 進化: Lv1 / Lv5 / Lv9 / Lv13 で 4 段階（`lib/character.ts` で調整可能）

ロジックは `lib/xp.ts`・`lib/srs.ts`・`lib/character.ts` に純関数として集約しています。

---

## 開発コマンド

```bash
npm run dev      # 開発サーバー
npm run build    # 本番ビルド（型チェック含む）
npm run lint     # ESLint
npm run start    # 本番起動（要 build）
```
