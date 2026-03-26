# ボス戦 Phase 1: 門番 (The Gatekeeper)

**対象範囲:** Ch.1-3（SELECT基本、WHERE句）
**合格条件:** 10問中8問正解で撃破
**推奨時期:** Week 4の土曜日

---

## ルール

1. テキストを見ずに解くこと（ノーヒントバッジ狙いの場合）
2. SQLiteターミナルで実際にクエリを書いて実行すること
3. 制限時間: 60分
4. 解答後、Claude Codeに採点を依頼すること

---

## 前提テーブル

以下のテーブルが `practice.db` に存在する前提です。
ボス戦前に `sqlite3 ~/b-dash/practice.db` で確認してください。

```sql
-- 商品テーブル
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price INTEGER,
    stock INTEGER,
    release_date TEXT,
    is_discontinued INTEGER DEFAULT 0
);

-- 顧客テーブル
CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    age INTEGER,
    prefecture TEXT,
    registered_date TEXT
);

-- 注文テーブル
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    order_date TEXT,
    status TEXT
);
```

---

## 問題

### Q1. 基本SELECT（難易度: ★☆☆）
商品テーブルから、すべての商品の `name` と `price` を取得してください。

### Q2. 列の別名（難易度: ★☆☆）
商品テーブルから `name` を「商品名」、`price` を「価格」という別名で取得してください。

### Q3. DISTINCT（難易度: ★☆☆）
商品テーブルに登録されているカテゴリの一覧を重複なしで取得してください。

### Q4. WHERE 比較演算子（難易度: ★★☆）
価格が3000円以上の商品の `name` と `price` を取得してください。

### Q5. WHERE 複数条件 AND（難易度: ★★☆）
カテゴリが「食品」で、かつ在庫が10以上ある商品の全列を取得してください。

### Q6. WHERE OR + NOT（難易度: ★★☆）
カテゴリが「家電」または「文具」で、かつ販売終了していない（is_discontinued = 0）商品を取得してください。

### Q7. LIKE（難易度: ★★☆）
商品名に「プレミアム」を含む商品の `name` と `price` を取得してください。

### Q8. BETWEEN + IS NULL（難易度: ★★★）
価格が1000円から5000円の間で、カテゴリがNULLでない商品の `name`、`category`、`price` を取得してください。

### Q9. IN + ORDER BY（難易度: ★★★）
都道府県が「東京都」「大阪府」「福岡県」のいずれかである顧客を、年齢の降順で取得してください。

### Q10. 総合問題（難易度: ★★★）
以下のビジネス要件をSQLに変換してください:

「2026年1月以降に注文され、ステータスが"完了"または"発送済み"で、
数量が3以上の注文を、注文日の新しい順に表示したい。
表示する列は注文ID、顧客ID、商品ID、数量、注文日とする。」

---

## 採点方法

全問解き終わったら、以下のようにClaude Codeに依頼してください:

```
ボス戦Phase 1を解きました。採点してください。
Q1: （自分の解答SQLを貼る）
Q2: ...
```

**8問以上正解 → 門番撃破! +150 XP**
**7問以下 → 再挑戦（復習してから再チャレンジ）**
