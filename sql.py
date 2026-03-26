#!/usr/bin/env python3
"""SQL Quest -- 対話式SQLコンソール
使い方: python3 sql.py
  SQLを入力してEnter → 結果表示
  空行でEnter → 終了
  .tables → テーブル一覧
  .schema テーブル名 → テーブル定義
"""
import sqlite3
import sys
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "practice.db")

def print_table(cursor):
    """クエリ結果をテーブル形式で表示"""
    if cursor.description is None:
        print("(実行完了)")
        return
    headers = [d[0] for d in cursor.description]
    rows = cursor.fetchall()
    if not rows:
        print("(0件)")
        return
    # 列幅計算
    widths = [len(h) for h in headers]
    str_rows = []
    for row in rows:
        str_row = [str(v) if v is not None else "NULL" for v in row]
        str_rows.append(str_row)
        for i, v in enumerate(str_row):
            widths[i] = max(widths[i], len(v))
    # ヘッダー表示
    header_line = " | ".join(h.ljust(w) for h, w in zip(headers, widths))
    sep_line = "-+-".join("-" * w for w in widths)
    print(header_line)
    print(sep_line)
    for row in str_rows:
        print(" | ".join(v.ljust(w) for v, w in zip(row, widths)))
    print(f"({len(str_rows)}件)")

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    print(f"SQL Quest コンソール (DB: {DB_PATH})")
    print("SQLを入力してください。空行で終了。")
    print("-" * 50)

    while True:
        try:
            sql = input("\nsql> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nさようなら！")
            break

        if not sql:
            print("さようなら！")
            break

        # 特殊コマンド
        if sql == ".tables":
            cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            for row in cur:
                print(f"  {row[0]}")
            continue
        if sql.startswith(".schema"):
            parts = sql.split()
            if len(parts) >= 2:
                table = parts[1]
                cur = conn.execute("SELECT sql FROM sqlite_master WHERE name=?", (table,))
                row = cur.fetchone()
                if row:
                    print(row[0])
                else:
                    print(f"テーブル '{table}' が見つかりません")
            else:
                cur = conn.execute("SELECT sql FROM sqlite_master WHERE type='table' ORDER BY name")
                for row in cur:
                    if row[0]:
                        print(row[0] + ";\n")
            continue

        try:
            cur = conn.execute(sql)
            conn.commit()
            print_table(cur)
        except Exception as e:
            print(f"エラー: {e}")

    conn.close()

if __name__ == "__main__":
    main()
