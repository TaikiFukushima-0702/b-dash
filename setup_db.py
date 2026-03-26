#!/usr/bin/env python3
"""SQL Quest -- 練習用データベースセットアップ
ボス戦Phase 1対応のサンプルデータを投入します。
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "practice.db")

def setup():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # テーブル作成
    c.executescript("""
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS customers;
    DROP TABLE IF EXISTS products;

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
        status TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- ==========================================
    -- サンプルデータ: 商品
    -- ==========================================
    INSERT INTO products (id, name, category, price, stock, release_date, is_discontinued) VALUES
    (1,  'プレミアムコーヒー豆',   '食品',   2500,  50,  '2025-01-15', 0),
    (2,  '有機緑茶セット',         '食品',   1800,  30,  '2025-03-01', 0),
    (3,  'プレミアム紅茶',         '食品',   3200,  15,  '2024-11-20', 0),
    (4,  'チョコレートギフト',     '食品',    980,   8,  '2025-06-10', 0),
    (5,  'ワイヤレスイヤホン',     '家電',   8900,  20,  '2025-02-14', 0),
    (6,  'USBハブ 7ポート',        '家電',   3500,  45,  '2024-08-01', 0),
    (7,  'LEDデスクライト',        '家電',   4200,  12,  '2025-04-01', 1),
    (8,  'ボールペンセット',       '文具',    600,  100, '2024-06-15', 0),
    (9,  'プレミアム万年筆',       '文具',  12000,   5,  '2025-01-01', 0),
    (10, 'A4ノート5冊パック',      '文具',    450,  200, '2024-09-01', 0),
    (11, 'ヨガマット',             'スポーツ', 3800, 25, '2025-05-01', 0),
    (12, 'ランニングシューズ',     'スポーツ', 7500,  0, '2024-04-01', 1),
    (13, '謎の商品X',              NULL,      9999,  1,  '2025-12-25', 0),
    (14, 'アロマキャンドル',       '雑貨',   1500,  60,  '2025-07-01', 0),
    (15, 'プレミアムタオルセット', '雑貨',   4500,  35,  '2025-08-15', 0);

    -- ==========================================
    -- サンプルデータ: 顧客
    -- ==========================================
    INSERT INTO customers (id, name, email, age, prefecture, registered_date) VALUES
    (1,  '田中太郎',   'tanaka@example.com',    28, '東京都',   '2024-01-10'),
    (2,  '鈴木花子',   'suzuki@example.com',    35, '大阪府',   '2024-02-20'),
    (3,  '佐藤一郎',   'sato@example.com',      42, '福岡県',   '2024-03-15'),
    (4,  '山田美咲',   'yamada@example.com',     22, '北海道',   '2024-04-01'),
    (5,  '高橋健太',   'takahashi@example.com',  31, '東京都',   '2024-05-20'),
    (6,  '伊藤さくら', 'ito@example.com',        26, '愛知県',   '2024-06-10'),
    (7,  '渡辺大輔',   'watanabe@example.com',   38, '大阪府',   '2024-07-05'),
    (8,  '中村真理',   'nakamura@example.com',   45, '福岡県',   '2024-08-15'),
    (9,  '小林翔',     'kobayashi@example.com',  19, '東京都',   '2025-01-01'),
    (10, '加藤優子',   'kato@example.com',       33, '神奈川県', '2025-02-14');

    -- ==========================================
    -- サンプルデータ: 注文
    -- ==========================================
    INSERT INTO orders (id, customer_id, product_id, quantity, order_date, status) VALUES
    (1,  1,  1,  2, '2025-11-01', '完了'),
    (2,  1,  5,  1, '2025-12-15', '完了'),
    (3,  2,  3,  3, '2026-01-10', '完了'),
    (4,  2,  8,  5, '2026-01-20', '発送済み'),
    (5,  3,  9,  1, '2026-02-01', '完了'),
    (6,  3,  6,  2, '2025-10-05', 'キャンセル'),
    (7,  4, 11,  1, '2026-01-25', '処理中'),
    (8,  5,  1,  4, '2026-02-10', '発送済み'),
    (9,  5, 14,  3, '2026-02-14', '完了'),
    (10, 6,  2,  2, '2025-09-20', '完了'),
    (11, 7, 15,  1, '2026-03-01', '処理中'),
    (12, 7,  5,  1, '2026-03-05', '発送済み'),
    (13, 8,  3,  5, '2026-01-15', '完了'),
    (14, 9, 10, 10, '2026-02-20', '完了'),
    (15, 9,  4,  2, '2026-03-10', '発送済み'),
    (16, 10, 1,  1, '2026-03-15', '処理中'),
    (17, 1, 14,  3, '2026-03-01', '発送済み'),
    (18, 3, 11,  1, '2026-01-30', '完了'),
    (19, 5,  9,  1, '2026-03-20', '処理中'),
    (20, 2,  6,  4, '2026-02-28', '完了');
    """)

    conn.commit()

    # 確認
    for table in ['products', 'customers', 'orders']:
        count = c.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"  {table}: {count}件")

    conn.close()
    print(f"\nデータベース作成完了: {DB_PATH}")
    print("起動コマンド: python3 ~/b-dash/sql.py")

if __name__ == "__main__":
    print("SQL Quest -- 練習用DB セットアップ中...")
    setup()
