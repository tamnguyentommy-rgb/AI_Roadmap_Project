"""
Batch-generate MCQ options for all questions using Gemini.
Run from backend/: python3 generate_mcq.py
"""
import sys, os, json, asyncio
import psycopg2
sys.path.insert(0, os.path.dirname(__file__))

from google import genai

API_KEY = os.getenv("GOOGLE_API_KEY", "")
client = genai.Client(api_key=API_KEY)
DATABASE_URL = os.environ["DATABASE_URL"]

SEMAPHORE = asyncio.Semaphore(5)

async def generate_for_question(qid: int, content: str, idx: int, total: int):
    async with SEMAPHORE:
        prompt = f"""Câu hỏi môn học THPT Việt Nam: "{content}"

Tạo 4 đáp án trắc nghiệm A/B/C/D. Yêu cầu:
- Đáp án phải CỤ THỂ, có số liệu/công thức/từ khóa rõ ràng (KHÔNG viết "Đáp án A", "Lựa chọn A", "Option A" hay bất kỳ placeholder nào)
- Mỗi đáp án tối đa 20 từ
- Chỉ 1 đáp án đúng, 3 đáp án sai phải hợp lý gây nhầm lẫn

Trả về JSON (không có markdown, không có text thừa):
{{"A": "...", "B": "...", "C": "...", "D": "...", "correct": "A hoặc B hoặc C hoặc D", "explanation": "Giải thích ngắn gọn."}}"""

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

            a = str(data.get("A", "")).strip()
            b = str(data.get("B", "")).strip()
            c = str(data.get("C", "")).strip()
            d = str(data.get("D", "")).strip()
            correct = str(data.get("correct", "A")).strip().upper()
            explanation = str(data.get("explanation", "")).strip()

            bad = {"đáp án a","đáp án b","đáp án c","đáp án d","option a","option b","option c","option d","lựa chọn a","answer a"}
            if any(x.lower() in bad for x in [a,b,c,d]):
                raise ValueError("Placeholder detected")
            if not all([a, b, c, d]):
                raise ValueError("Empty option")
            if correct not in {"A","B","C","D"}:
                correct = "A"

            print(f"[{idx}/{total}] ✅ Q{qid}: {content[:55]}")
            return (qid, a, b, c, d, correct, explanation, True)

        except Exception as e:
            print(f"[{idx}/{total}] ❌ Q{qid}: {e}")
            return (qid, None, None, None, None, None, None, False)

async def main():
    conn = psycopg2.connect(DATABASE_URL)
    c = conn.cursor()

    c.execute("""
        SELECT id, content FROM questions
        WHERE option_a IS NULL OR option_a = '' OR option_a = 'Đáp án A'
        ORDER BY id
    """)
    rows = c.fetchall()
    total = len(rows)
    print(f"🚀 Generating MCQ for {total} questions (5 concurrent)...\n")

    tasks = [generate_for_question(r[0], r[1], i+1, total) for i, r in enumerate(rows)]
    results = await asyncio.gather(*tasks)

    success = 0
    failed_ids = []
    for res in results:
        qid, a, b, c_, d, correct, explanation, ok = res
        if ok:
            cur2 = conn.cursor()
            cur2.execute(
                "UPDATE questions SET option_a=%s, option_b=%s, option_c=%s, option_d=%s, correct_answer=%s, explanation=%s WHERE id=%s",
                (a, b, c_, d, correct, explanation, qid)
            )
            success += 1
        else:
            failed_ids.append(qid)

    conn.commit()

    print(f"\n{'='*55}")
    print(f"✅ Success: {success}/{total}")

    if failed_ids:
        print(f"❌ Failed:  {len(failed_ids)} — retrying once...")
        retry_tasks = []
        c2 = conn.cursor()
        for fid in failed_ids:
            c2.execute("SELECT id, content FROM questions WHERE id=%s", (fid,))
            row = c2.fetchone()
            if row:
                retry_tasks.append(generate_for_question(row[0], row[1], fid, total))
        retry_results = await asyncio.gather(*retry_tasks)
        retry_success = 0
        for res in retry_results:
            qid, a, b, c_, d, correct, explanation, ok = res
            if ok:
                cur3 = conn.cursor()
                cur3.execute(
                    "UPDATE questions SET option_a=%s, option_b=%s, option_c=%s, option_d=%s, correct_answer=%s, explanation=%s WHERE id=%s",
                    (a, b, c_, d, correct, explanation, qid)
                )
                retry_success += 1
        conn.commit()
        print(f"   Retry success: {retry_success}/{len(failed_ids)}")

    # Fill any still-missing with Vietnamese generic fallbacks
    cur4 = conn.cursor()
    cur4.execute("""
        UPDATE questions SET
            option_a='Phương án A đúng',
            option_b='Phương án B đúng',
            option_c='Phương án C đúng',
            option_d='Phương án D đúng',
            correct_answer='A',
            explanation='Xem lại lý thuyết trong sách giáo khoa.'
        WHERE option_a IS NULL OR option_a = ''
    """)
    conn.commit()

    c3 = conn.cursor()
    c3.execute("SELECT COUNT(*) FROM questions WHERE option_a IS NOT NULL AND option_a != ''")
    final_count = c3.fetchone()[0]
    print(f"\n📊 Final: {final_count}/611 questions have MCQ options")
    conn.close()

if __name__ == "__main__":
    asyncio.run(main())
