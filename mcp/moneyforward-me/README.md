# マネーフォワード ME MCP サーバー

マネーフォワード ME からエクスポートした**家計簿 CSV をローカルで読み取り**、Claude から
支出の集計・明細検索・資産の把握・予算チェックができるようにする MCP サーバーです。

```
「今月の食費は予算内？」
「先月より増えた費目トップ5は？」
「ポケカ関連の支出を今年分ぜんぶ出して」
「総資産はこの半年でどう推移してる？」
```

---

## なぜ CSV 方式なのか

マネーフォワード ME には**個人向けの公開 API がありません**（API があるのは事業者向けの
「マネーフォワード クラウド」側です）。そのため取れる手段は実質 3 つで、このサーバーは 1 番目を採用しています。

| 方式 | 判定 |
| --- | --- |
| **CSV エクスポートを読む**（本サーバー） | ✅ 利用規約に抵触しない。認証情報を一切扱わない。壊れにくい |
| ヘッドレスブラウザで自動ログインして CSV を取得 | ❌ 自動化アクセスは MF の利用規約で禁止。2 段階認証・reCAPTCHA・DOM 変更で壊れ、アカウント停止のリスク |
| ログインして HTML をスクレイピング | ❌ 上記に加えて最も壊れやすい |

**このサーバーはマネーフォワードにネットワークアクセスしません。** 読むのはあなたが自分で
ダウンロードしてローカルに置いた CSV だけです。ID・パスワードを設定する場所もありません。

---

## セットアップ

### 1. ビルド

```bash
cd mcp/moneyforward-me
npm install          # postinstall で自動的にビルドされます
npm test             # 34 件のテスト（サンプル CSV 込み）
```

### 2. データフォルダを用意して CSV を置く

```bash
mkdir -p ~/moneyforward-me
```

マネーフォワード ME の **Web 版**（アプリではなく https://moneyforward.com ）から:

- **入出金明細**: 「家計簿」→「入出金」→ 右上の **ダウンロード** → その月の CSV
  （`収入・支出詳細_YYYY-MM-DD_YYYY-MM-DD.csv`）
- **資産推移**（任意）: 「資産」→ 資産推移のグラフ下の **ダウンロード**

ダウンロードした CSV を `~/moneyforward-me/` に置きます。**サブフォルダに入れても構いません**し、
月をまたいで重複してダウンロードしても、明細の ID で自動的に重複排除されます。

- 文字コードは Shift_JIS / UTF-8 のどちらでも自動判別します（MF の既定は Shift_JIS）。
- ファイル名ではなく**ヘッダの内容**で取引 CSV / 資産 CSV を判定するので、リネームしても大丈夫です。
- 置き場所を変えたい場合は環境変数 `MF_DATA_DIR` にフォルダのパスを指定します。

> 💡 毎月 1 回、前月分の CSV をこのフォルダに放り込むだけで最新状態になります。

### 3. Claude に登録する

**Claude Code の場合**

```bash
claude mcp add moneyforward-me \
  --env MF_DATA_DIR=$HOME/moneyforward-me \
  -- node /absolute/path/to/mcp/moneyforward-me/dist/index.js
```

**Claude Desktop の場合** — 設定ファイルに追記します
（macOS: `~/Library/Application Support/Claude/claude_desktop_config.json` /
Windows: `%APPDATA%\Claude\claude_desktop_config.json`）。

```json
{
  "mcpServers": {
    "moneyforward-me": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/moneyforward-me/dist/index.js"],
      "env": { "MF_DATA_DIR": "/Users/you/moneyforward-me" }
    }
  }
}
```

登録できたら、まず **「マネーフォワードのデータの読み込み状況を教えて」** と聞いてみてください
（`list_datasets` が呼ばれ、どの期間のデータが揃っているかが分かります）。

---

## ツール一覧

| ツール | 用途 |
| --- | --- |
| `list_datasets` | 読み込めた CSV の一覧・件数・カバー期間。**データが無い月の警告つき** |
| `list_categories` | 実際に登場する大項目 / 中項目 / 金融機関の一覧（支出の大きい順） |
| `search_transactions` | 期間・費目・金融機関・キーワード・金額レンジで明細を検索 |
| `summarize_spending` | 大項目 / 中項目 / 金融機関 / 月 / 日 / 内容で集計。前期間との比較も可 |
| `monthly_trend` | 月次の支出・収入・収支の推移と月平均 |
| `compare_periods` | 2 期間を突き合わせ、増減の大きい費目から並べる |
| `get_assets` | 最新時点の残高内訳と総資産 |
| `asset_trend` | 総資産の推移（月次 / 日次） |
| `set_budget` | 大項目ごとの月額予算を設定（`budget.json` に保存） |
| `get_budget_status` | 消化率・月末の着地見込み・超過アラート |

### 期間の指定

すべての集計系ツールで `period`（プリセット）か `from` / `to` を指定できます。`from` / `to` が優先されます。

- プリセット: `today` / `this_month` / `last_month` / `this_year` / `last_year` /
  `last_3_months` / `last_6_months` / `last_12_months` / `all`
- `from` / `to`: `2026-08-15`（日）・`2026-08`（月まるごと）・`2026`（年まるごと）。両端を含みます。

### 集計のルール

- **金額は円。支出は正の値で報告します**（CSV 上は支出がマイナス）。
- 既定で **「振替」**（口座間の移動）と **「計算対象 = 0」** の行を除外します。
  含めたい場合は `include_transfers` / `include_excluded` を `true` に。
- 大項目・中項目・金融機関の指定は**部分一致**です（`食費` は `食費` に、`カード` は `三井住友カード` に一致）。

### 予算

`set_budget` で設定した予算は `$MF_DATA_DIR/budget.json` に保存されます（手で編集しても構いません）。

```json
{
  "version": 1,
  "monthly": { "食費": 45000, "趣味・娯楽": 30000, "水道・光熱費": 15000 },
  "total": 250000
}
```

`get_budget_status` は月の経過率から**月末の着地見込み**を出し、次の 4 段階で判定します。

| 判定 | 条件 |
| --- | --- |
| 🔴 超過 | 実績がすでに予算以上 |
| 🟠 ペース超過 | 今のペースだと月末に予算を超える見込み |
| 🟡 注意 | 消化率 80% 以上 |
| 🟢 順調 | それ以外 |

予算を設定していないのに支出がある費目も併せて報告するので、設定漏れに気づけます。
予算額に迷ったら `summarize_spending`（`group_by=category`, `period=last_3_months`）で実績を見てから決めるのがおすすめです。

---

## プライバシー

- 家計データは**あなたのマシンのローカルフォルダから読むだけ**で、どこにも送信しません。
- サーバーは MF にログインしないため、認証情報を保存しません。
- ただし **Claude に質問した内容と、ツールが返した集計結果は Claude に送られます**。
  明細をそのまま大量に見せたくない場合は、`search_transactions` ではなく `summarize_spending` など
  集計系のツールを使うよう Claude に指示してください。

---

## 構成

```
src/
  index.ts      MCP サーバー本体（ツール定義と出力整形）
  csv.ts        Shift_JIS/UTF-8 の自動判別、RFC4180 パーサ、日付・金額の正規化
  load.ts       フォルダ走査、ヘッダによる CSV 種別判定、重複排除、キャッシュ
  analyze.ts    絞り込み・集計・期間比較（純関数）
  assets.ts     資産スナップショットと推移（純関数）
  budget.ts     予算の保存・読み込みと消化状況の判定（純関数）
  period.ts     期間プリセットと前期間の算出（純関数）
  format.ts     円表記・Markdown テーブル
test/           node:test による純関数テスト
sample-data/    動作確認用のダミー CSV（Shift_JIS）
```

計算ロジックはすべて純関数として `analyze` / `assets` / `budget` / `period` に切り出してあり、
MCP のプロトコル層（`index.ts`）から独立してテストできます。

サンプルデータで試すには:

```bash
MF_DATA_DIR=./sample-data npm start
```
