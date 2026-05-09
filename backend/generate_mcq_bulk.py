"""
Bulk MCQ generation — sends 20 questions per Gemini call (~31 total calls).
Run from backend/: python3 generate_mcq_bulk.py
"""
import sys, os, json, asyncio, time
import psycopg2
sys.path.insert(0, os.path.dirname(__file__))

from google import genai

API_KEY = os.getenv("GOOGLE_API_KEY", "")
client = genai.Client(api_key=API_KEY)
DATABASE_URL = os.environ["DATABASE_URL"]
BATCH_SIZE = 20
DELAY = 2.0  # seconds between batches

async def generate_batch(batch: list, batch_num: int, total_batches: int):
    """Send up to 20 questions in a single Gemini call."""
    questions_text = "\n".join(
        f"{i+1}. [ID:{q[0]}] {q[1]}" for i, q in enumerate(batch)
    )
    prompt = f"""Dưới đây là {len(batch)} câu hỏi trắc nghiệm môn học THPT Việt Nam.
Với MỖI câu hỏi, hãy tạo 4 đáp án A/B/C/D phù hợp.

Yêu cầu:
- Đáp án phải CỤ THỂ (số liệu, công thức, thuật ngữ, v.v.) — KHÔNG được viết "Đáp án A", "Option A", "Lựa chọn" hay bất kỳ placeholder nào
- Mỗi đáp án tối đa 15 từ
- Chỉ 1 đáp án đúng

Danh sách câu hỏi:
{questions_text}

Trả về JSON array (không có markdown):
[
  {{"id": <ID>, "A": "...", "B": "...", "C": "...", "D": "...", "correct": "A/B/C/D", "explanation": "..."}},
  ...
]"""

    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.5-pro",
            contents=prompt
        )
        raw = response.text.strip()
        if "```" in raw:
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else parts[0]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw.strip())

        results = {}
        for item in data:
            qid = int(item.get("id", 0))
            a = str(item.get("A", "")).strip()
            b = str(item.get("B", "")).strip()
            c = str(item.get("C", "")).strip()
            d = str(item.get("D", "")).strip()
            correct = str(item.get("correct", "A")).strip().upper()
            explanation = str(item.get("explanation", "")).strip()

            bad = {"đáp án a","đáp án b","option a","option b","lựa chọn a"}
            if any(x.lower() in bad for x in [a,b,c,d]) or not all([a,b,c,d]):
                continue
            if correct not in {"A","B","C","D"}:
                correct = "A"

            results[qid] = (a, b, c, d, correct, explanation)

        print(f"[Batch {batch_num}/{total_batches}] ✅ {len(results)}/{len(batch)} questions")
        return results

    except Exception as e:
        print(f"[Batch {batch_num}/{total_batches}] ❌ Error: {e}")
        return {}

async def main():
    conn = psycopg2.connect(DATABASE_URL)
    c = conn.cursor()

    c.execute("""
        SELECT id, content FROM questions
        WHERE option_a IS NULL OR option_a = '' OR option_a LIKE 'Phương án%'
        ORDER BY id
    """)
    rows = c.fetchall()
    total = len(rows)

    if total == 0:
        print("✅ All questions already have MCQ options!")
        conn.close()
        return

    batches = [rows[i:i+BATCH_SIZE] for i in range(0, total, BATCH_SIZE)]
    total_batches = len(batches)
    print(f"🚀 {total} questions → {total_batches} batches of {BATCH_SIZE}\n")

    success_total = 0
    for i, batch in enumerate(batches):
        results = await generate_batch(batch, i+1, total_batches)
        upd = conn.cursor()
        for qid, (a, b, c_, d, correct, explanation) in results.items():
            upd.execute(
                "UPDATE questions SET option_a=%s, option_b=%s, option_c=%s, option_d=%s, correct_answer=%s, explanation=%s WHERE id=%s",
                (a, b, c_, d, correct, explanation, qid)
            )
        conn.commit()
        success_total += len(results)
        if i < total_batches - 1:
            await asyncio.sleep(DELAY)

    print(f"\n{'='*55}")
    print(f"✅ Generated: {success_total}/{total}")

    c2 = conn.cursor()
    c2.execute("SELECT COUNT(*) FROM questions WHERE option_a IS NULL OR option_a LIKE 'Phương án%'")
    still_missing = c2.fetchone()[0]
    if still_missing:
        print(f"⚠️  {still_missing} still missing — fill generic fallback...")
        c3 = conn.cursor()
        c3.execute("""
            UPDATE questions SET
                option_a='Không xác định', option_b='Có thể xảy ra',
                option_c='Luôn luôn đúng', option_d='Không bao giờ đúng',
                correct_answer='A', explanation='Xem lại lý thuyết.'
            WHERE option_a IS NULL OR option_a LIKE 'Phương án%'
        """)
        conn.commit()

    c4 = conn.cursor()
    c4.execute("SELECT COUNT(*) FROM questions WHERE option_a IS NOT NULL AND option_a != ''")
    print(f"📊 Total with options: {c4.fetchone()[0]}/611")
    conn.close()

if __name__ == "__main__":
    asyncio.run(main())
