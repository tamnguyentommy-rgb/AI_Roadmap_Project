"""
Migration: Thêm cột last_reviewed vào bảng user_mastery
=========================================================
Chạy 1 lần duy nhất trên DB đang có:
    cd backend
    python migrate_add_last_reviewed.py

Script này an toàn để chạy nhiều lần (idempotent):
- Nếu column đã tồn tại → bỏ qua, không báo lỗi.
- Backfill last_reviewed = last_updated cho tất cả row cũ
  (để time decay không tính sai cho user hiện có).
"""

import os
import sys
import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL environment variable not set.")
    sys.exit(1)

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# ── 1. Kiểm tra column đã tồn tại chưa ──────────────────────────────────────
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'user_mastery' AND column_name = 'last_reviewed'
""")
if cur.fetchone():
    print("✅ Column 'last_reviewed' đã tồn tại — không cần migration.")
    conn.close()
    sys.exit(0)

# ── 2. Thêm column ───────────────────────────────────────────────────────────
print("⏳ Thêm column 'last_reviewed' vào bảng user_mastery ...")
cur.execute("ALTER TABLE user_mastery ADD COLUMN last_reviewed TIMESTAMP")

# ── 3. Backfill ──────────────────────────────────────────────────────────────
print("⏳ Backfill last_reviewed = last_updated cho các row hiện có ...")
cur.execute("""
    UPDATE user_mastery
    SET last_reviewed = COALESCE(last_updated, NOW())
    WHERE last_reviewed IS NULL
""")

affected = cur.rowcount
conn.commit()
conn.close()

print(f"✅ Migration hoàn tất — đã backfill {affected} row(s).")
print("   Time decay sẽ bắt đầu tính từ lần ôn tiếp theo của mỗi user.")
