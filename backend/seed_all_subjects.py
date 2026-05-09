"""
Full replacement seed: deletes all docx-based questions and replaces with
hand-crafted, proper MCQ questions for all subjects and grades.
Hóa 12 (already good) is preserved.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine, SessionLocal
from app.db.base import Base
import app.models.user, app.models.curriculum, app.models.assessment, app.models.progress
Base.metadata.create_all(bind=engine)

from app.models.curriculum import Topic
from app.models.assessment import Question

# ─────────────────────────────────────────────
# QUESTION BANK
# ─────────────────────────────────────────────

ALL_DATA = {

# ══════════════════════════════════════════════
# TOÁN (MATHEMATICS)
# ══════════════════════════════════════════════
("Toán", 10): [
    {
        "topic": "Hàm số và đồ thị",
        "questions": [
            {
                "content": "Hàm số y = f(x) = 2x + 3 đồng biến trên tập xác định của nó. Giá trị f(5) bằng bao nhiêu?",
                "option_a": "13",
                "option_b": "11",
                "option_c": "10",
                "option_d": "8",
                "correct": "A",
                "explanation": "f(5) = 2×5 + 3 = 10 + 3 = 13. Hàm số bậc nhất y = ax + b đồng biến khi a > 0 (ở đây a = 2 > 0)."
            },
            {
                "content": "Tập xác định của hàm số y = √(x − 2) là gì?",
                "option_a": "[2; +∞)",
                "option_b": "(2; +∞)",
                "option_c": "(−∞; 2]",
                "option_d": "ℝ",
                "correct": "A",
                "explanation": "Để √(x − 2) xác định cần x − 2 ≥ 0, tức là x ≥ 2. Tập xác định là [2; +∞). Chú ý: x = 2 cho √0 = 0 nên x = 2 thuộc tập xác định."
            },
            {
                "content": "Đồ thị hàm số y = x² − 4x + 3 cắt trục Ox tại những điểm nào?",
                "option_a": "x = 1 và x = 3",
                "option_b": "x = −1 và x = −3",
                "option_c": "x = 2 và x = 4",
                "option_d": "x = 0 và x = 4",
                "correct": "A",
                "explanation": "Giải x² − 4x + 3 = 0: dùng công thức nghiệm hoặc phân tích (x−1)(x−3) = 0, suy ra x = 1 hoặc x = 3. Đây là giao điểm với trục Ox."
            },
            {
                "content": "Hàm số y = −x² + 4x − 1 đạt giá trị lớn nhất bằng bao nhiêu?",
                "option_a": "3",
                "option_b": "4",
                "option_c": "1",
                "option_d": "5",
                "correct": "A",
                "explanation": "Parabol y = −x² + 4x − 1 mở xuống (a = −1 < 0) nên có giá trị lớn nhất tại đỉnh. x_đỉnh = −b/(2a) = −4/(−2) = 2. y_max = −(2²) + 4×2 − 1 = −4 + 8 − 1 = 3."
            },
            {
                "content": "Với giá trị nào của m thì hàm số y = (m−1)x + 2 là hàm hằng?",
                "option_a": "m = 1",
                "option_b": "m = 0",
                "option_c": "m = 2",
                "option_d": "m = −1",
                "correct": "A",
                "explanation": "Hàm số y = (m−1)x + 2 là hàm hằng khi hệ số của x bằng 0, tức là m − 1 = 0, suy ra m = 1. Khi đó y = 0·x + 2 = 2 với mọi x."
            },
        ]
    },
    {
        "topic": "Bất phương trình bậc nhất và bậc hai",
        "questions": [
            {
                "content": "Tập nghiệm của bất phương trình 2x − 5 > 3 là gì?",
                "option_a": "(4; +∞)",
                "option_b": "[4; +∞)",
                "option_c": "(−∞; 4)",
                "option_d": "(−∞; 4]",
                "correct": "A",
                "explanation": "2x − 5 > 3 ⟺ 2x > 8 ⟺ x > 4. Vì bất phương trình chặt nên nghiệm là x > 4, tức tập (4; +∞). Không bao gồm x = 4 vì đây là bất phương trình nghiêm ngặt."
            },
            {
                "content": "Bất phương trình x² − 5x + 6 < 0 có tập nghiệm là gì?",
                "option_a": "(2; 3)",
                "option_b": "(−∞; 2) ∪ (3; +∞)",
                "option_c": "[2; 3]",
                "option_d": "∅ (vô nghiệm)",
                "correct": "A",
                "explanation": "x² − 5x + 6 = (x−2)(x−3). Tam thức âm khi 2 < x < 3 (nằm giữa 2 nghiệm, vì a = 1 > 0 nên parabol mở lên, âm ở giữa). Tập nghiệm là (2; 3)."
            },
            {
                "content": "Bất phương trình x² + 2x + 5 > 0 đúng với:",
                "option_a": "Mọi x ∈ ℝ",
                "option_b": "Không có x nào",
                "option_c": "Chỉ x > 0",
                "option_d": "Chỉ x < −1",
                "correct": "A",
                "explanation": "Δ = 4 − 20 = −16 < 0, và a = 1 > 0, nên tam thức luôn dương với mọi x. Tập nghiệm là ℝ. Đây là tam thức bậc hai không có nghiệm thực và dương với mọi x."
            },
            {
                "content": "Tập nghiệm của hệ bất phương trình: x > 1 và x ≤ 4 là gì?",
                "option_a": "(1; 4]",
                "option_b": "(1; 4)",
                "option_c": "[1; 4]",
                "option_d": "∅",
                "correct": "A",
                "explanation": "Nghiệm chung của x > 1 (không lấy x=1) và x ≤ 4 (lấy x=4) là 1 < x ≤ 4, tức khoảng (1; 4]. x=1 bị loại (vì x>1 chặt), x=4 được giữ (vì x≤4)."
            },
            {
                "content": "Cho bất phương trình |x − 3| < 2. Tập nghiệm của nó là gì?",
                "option_a": "(1; 5)",
                "option_b": "(−∞; 1) ∪ (5; +∞)",
                "option_c": "[1; 5]",
                "option_d": "(−5; 5)",
                "correct": "A",
                "explanation": "|x − 3| < 2 ⟺ −2 < x − 3 < 2 ⟺ 1 < x < 5. Tập nghiệm là (1; 5). Quy tắc: |A| < B (B>0) tương đương −B < A < B."
            },
        ]
    },
    {
        "topic": "Hệ thức lượng trong tam giác",
        "questions": [
            {
                "content": "Trong tam giác ABC, nếu a = 5, b = 7, C = 60° thì cạnh c bằng bao nhiêu? (Dùng định lý cosin)",
                "option_a": "c = √39 ≈ 6,24",
                "option_b": "c = √74 ≈ 8,60",
                "option_c": "c = 6",
                "option_d": "c = √61 ≈ 7,81",
                "correct": "A",
                "explanation": "Định lý cosin: c² = a² + b² − 2ab·cosC = 25 + 49 − 2×5×7×cos60° = 74 − 70×0,5 = 74 − 35 = 39. Vậy c = √39 ≈ 6,24."
            },
            {
                "content": "Công thức tính diện tích tam giác ABC theo hai cạnh và góc xen giữa là gì?",
                "option_a": "S = (1/2)·a·b·sinC",
                "option_b": "S = a·b·cosC",
                "option_c": "S = (1/2)·(a + b + c)·r",
                "option_d": "S = a·b/(2R)",
                "correct": "A",
                "explanation": "Diện tích tam giác = (1/2) × tích hai cạnh × sin góc xen giữa. S = (1/2)·ab·sinC = (1/2)·bc·sinA = (1/2)·ac·sinB. Đây là công thức thường dùng nhất trong thực hành."
            },
            {
                "content": "Định lý sin trong tam giác ABC phát biểu là gì?",
                "option_a": "a/sinA = b/sinB = c/sinC = 2R",
                "option_b": "a·sinA = b·sinB = c·sinC",
                "option_c": "sinA/a = sinB/b = sinC/c = R",
                "option_d": "a² = b² + c² − 2bc·cosA",
                "correct": "A",
                "explanation": "Định lý sin: a/sinA = b/sinB = c/sinC = 2R, trong đó R là bán kính đường tròn ngoại tiếp. Định lý này dùng để tính cạnh khi biết hai góc và một cạnh, hoặc tính góc khi biết ba cạnh."
            },
        ]
    },
    {
        "topic": "Vectơ trong mặt phẳng",
        "questions": [
            {
                "content": "Cho vectơ a⃗ = (3; 4). Độ dài (mô-đun) của a⃗ là bao nhiêu?",
                "option_a": "5",
                "option_b": "7",
                "option_c": "√7",
                "option_d": "12",
                "correct": "A",
                "explanation": "|a⃗| = √(3² + 4²) = √(9 + 16) = √25 = 5. Đây là bộ số Pythagore (3-4-5) quen thuộc. Mô-đun vectơ a⃗ = (x; y) là √(x² + y²)."
            },
            {
                "content": "Hai vectơ a⃗ = (2; −1) và b⃗ = (k; 2) cùng phương khi nào?",
                "option_a": "k = −4",
                "option_b": "k = 4",
                "option_c": "k = 1",
                "option_d": "k = −1",
                "correct": "A",
                "explanation": "a⃗ và b⃗ cùng phương ⟺ 2×2 − (−1)×k = 0 ⟺ 4 + k = 0 ⟺ k = −4. Điều kiện cùng phương của (x₁;y₁) và (x₂;y₂): x₁y₂ − x₂y₁ = 0."
            },
            {
                "content": "Tích vô hướng của a⃗ = (1; 2) và b⃗ = (3; −1) bằng bao nhiêu?",
                "option_a": "1",
                "option_b": "5",
                "option_c": "−1",
                "option_d": "7",
                "correct": "A",
                "explanation": "a⃗ · b⃗ = 1×3 + 2×(−1) = 3 − 2 = 1. Tích vô hướng của (x₁;y₁)·(x₂;y₂) = x₁x₂ + y₁y₂. Nếu tích vô hướng = 0, hai vectơ vuông góc nhau."
            },
        ]
    },
    {
        "topic": "Thống kê và Xác suất cơ bản",
        "questions": [
            {
                "content": "Trung bình cộng của dãy số: 4, 7, 3, 9, 2 là bao nhiêu?",
                "option_a": "5",
                "option_b": "4",
                "option_c": "6",
                "option_d": "7",
                "correct": "A",
                "explanation": "Trung bình cộng = (4 + 7 + 3 + 9 + 2) / 5 = 25 / 5 = 5. Trung bình cộng (mean) là tổng tất cả giá trị chia cho số lượng giá trị."
            },
            {
                "content": "Gieo một đồng xu cân đối một lần. Xác suất xuất hiện mặt ngửa là bao nhiêu?",
                "option_a": "1/2",
                "option_b": "1/4",
                "option_c": "1",
                "option_d": "0",
                "correct": "A",
                "explanation": "Không gian mẫu: {ngửa, sấp}, có 2 kết quả đồng khả năng. Biến cố {ngửa} có 1 kết quả. P(ngửa) = 1/2. Đây là xác suất cổ điển: số kết quả thuận lợi / tổng số kết quả."
            },
            {
                "content": "Mốt (mode) của dãy số 3, 5, 7, 5, 2, 5, 8 là bao nhiêu?",
                "option_a": "5",
                "option_b": "3",
                "option_c": "7",
                "option_d": "8",
                "correct": "A",
                "explanation": "Mốt là giá trị xuất hiện nhiều lần nhất. Trong dãy: 3 xuất hiện 1 lần, 5 xuất hiện 3 lần, 7 xuất hiện 1 lần, 2 xuất hiện 1 lần, 8 xuất hiện 1 lần. Mốt = 5 (xuất hiện nhiều nhất)."
            },
        ]
    },
],

("Toán", 11): [
    {
        "topic": "Hàm số lượng giác",
        "questions": [
            {
                "content": "Giá trị của sin(π/6) bằng bao nhiêu?",
                "option_a": "1/2",
                "option_b": "√2/2",
                "option_c": "√3/2",
                "option_d": "1",
                "correct": "A",
                "explanation": "sin(π/6) = sin(30°) = 1/2. Các giá trị lượng giác cơ bản: sin30° = 1/2, sin45° = √2/2, sin60° = √3/2, sin90° = 1. Cần thuộc bảng giá trị này."
            },
            {
                "content": "Chu kỳ của hàm số y = sin(2x) là bao nhiêu?",
                "option_a": "π",
                "option_b": "2π",
                "option_c": "π/2",
                "option_d": "4π",
                "correct": "A",
                "explanation": "Hàm y = sin(ωx) có chu kỳ T = 2π/ω. Ở đây ω = 2, nên T = 2π/2 = π. Chu kỳ là độ dài một giai đoạn lặp lại của hàm tuần hoàn."
            },
            {
                "content": "Với x ∈ [0; π], hàm số y = cos(x) đạt giá trị lớn nhất tại x = ?",
                "option_a": "x = 0",
                "option_b": "x = π",
                "option_c": "x = π/2",
                "option_d": "x = π/4",
                "correct": "A",
                "explanation": "Trên [0; π]: cos(0) = 1, cos(π/2) = 0, cos(π) = −1. Hàm cos giảm từ 1 xuống −1 trên khoảng [0; π]. Giá trị lớn nhất là cos(0) = 1, đạt tại x = 0."
            },
            {
                "content": "Phương trình sin(x) = 1/2 có nghiệm tổng quát là gì?",
                "option_a": "x = π/6 + 2kπ hoặc x = 5π/6 + 2kπ (k ∈ ℤ)",
                "option_b": "x = π/6 + kπ (k ∈ ℤ)",
                "option_c": "x = π/3 + 2kπ (k ∈ ℤ)",
                "option_d": "x = π/6 + 2kπ (k ∈ ℤ)",
                "correct": "A",
                "explanation": "sin(x) = 1/2 = sin(π/6). Phương trình sinx = sina có nghiệm x = a + 2kπ hoặc x = π − a + 2kπ. Vậy x = π/6 + 2kπ hoặc x = π − π/6 + 2kπ = 5π/6 + 2kπ (k ∈ ℤ)."
            },
            {
                "content": "Giá trị của cos²(x) + sin²(x) bằng bao nhiêu với mọi x?",
                "option_a": "1",
                "option_b": "0",
                "option_c": "2",
                "option_d": "Phụ thuộc x",
                "correct": "A",
                "explanation": "Đây là hệ thức cơ bản: sin²x + cos²x = 1 với mọi x. Đây là hệ quả trực tiếp của định lý Pythagore trên đường tròn đơn vị. Từ đây suy ra: cos²x = 1 − sin²x và sin²x = 1 − cos²x."
            },
        ]
    },
    {
        "topic": "Tổ hợp và Xác suất",
        "questions": [
            {
                "content": "Có bao nhiêu cách sắp xếp 4 học sinh vào 4 ghế khác nhau?",
                "option_a": "24",
                "option_b": "12",
                "option_c": "16",
                "option_d": "4",
                "correct": "A",
                "explanation": "Số cách sắp xếp 4 học sinh vào 4 ghế = 4! = 4×3×2×1 = 24 (hoán vị). Ghế 1 có 4 lựa chọn, ghế 2 còn 3, ghế 3 còn 2, ghế 4 còn 1. Tổng: 4×3×2×1 = 24."
            },
            {
                "content": "C(5,2) (tổ hợp chập 2 từ 5 phần tử) bằng bao nhiêu?",
                "option_a": "10",
                "option_b": "20",
                "option_c": "5",
                "option_d": "15",
                "correct": "A",
                "explanation": "C(5,2) = 5!/(2!×3!) = (5×4)/(2×1) = 20/2 = 10. Tổ hợp là số cách chọn không quan tâm thứ tự, khác hoán vị (có quan tâm thứ tự). A(5,2) = 20 ≠ C(5,2) = 10."
            },
            {
                "content": "Từ một bộ bài 52 lá, rút ngẫu nhiên 1 lá. Xác suất rút được lá bích (♠) là bao nhiêu?",
                "option_a": "1/4",
                "option_b": "1/13",
                "option_c": "1/52",
                "option_d": "1/2",
                "correct": "A",
                "explanation": "Bộ bài 52 lá có 4 chất (♠ ♥ ♦ ♣), mỗi chất 13 lá. Số lá bích = 13. P(lá bích) = 13/52 = 1/4. Xác suất là tỷ lệ số kết quả thuận lợi trên tổng số kết quả đồng khả năng."
            },
            {
                "content": "Tung hai đồng xu cân đối. Xác suất để cả hai đều ngửa là bao nhiêu?",
                "option_a": "1/4",
                "option_b": "1/2",
                "option_c": "3/4",
                "option_d": "1",
                "correct": "A",
                "explanation": "Không gian mẫu: {(N,N), (N,S), (S,N), (S,S)}, có 4 kết quả. Biến cố cả hai ngửa: {(N,N)}, có 1 kết quả. P = 1/4. Hoặc: P = P(ngửa) × P(ngửa) = 1/2 × 1/2 = 1/4 (vì 2 đồng xu độc lập)."
            },
            {
                "content": "Khai triển (a + b)³ theo nhị thức Newton bằng gì?",
                "option_a": "a³ + 3a²b + 3ab² + b³",
                "option_b": "a³ + b³",
                "option_c": "a³ + 2a²b + 2ab² + b³",
                "option_d": "a³ − 3a²b + 3ab² − b³",
                "correct": "A",
                "explanation": "(a+b)³ = C(3,0)a³ + C(3,1)a²b + C(3,2)ab² + C(3,3)b³ = a³ + 3a²b + 3ab² + b³. Hệ số là các số tổ hợp C(3,k): 1, 3, 3, 1 (hàng thứ 3 trong tam giác Pascal)."
            },
        ]
    },
    {
        "topic": "Giới hạn và tính liên tục",
        "questions": [
            {
                "content": "Giới hạn lim(x→2) (x² − 4)/(x − 2) bằng bao nhiêu?",
                "option_a": "4",
                "option_b": "0",
                "option_c": "Không tồn tại",
                "option_d": "∞",
                "correct": "A",
                "explanation": "(x²−4)/(x−2) = (x−2)(x+2)/(x−2) = x+2 (khi x ≠ 2). Vậy lim(x→2) = 2+2 = 4. Đây là dạng vô định 0/0, cần rút gọn trước khi tính giới hạn."
            },
            {
                "content": "lim(n→∞) 1/n bằng bao nhiêu?",
                "option_a": "0",
                "option_b": "1",
                "option_c": "∞",
                "option_d": "−1",
                "correct": "A",
                "explanation": "Khi n → ∞, phân số 1/n ngày càng nhỏ và tiến về 0. Ví dụ: 1/10 = 0,1; 1/100 = 0,01; 1/1000 = 0,001... → 0. Đây là giới hạn cơ bản nhất cần nhớ."
            },
            {
                "content": "Hàm số y = f(x) liên tục tại x = a khi nào?",
                "option_a": "f(a) xác định và lim(x→a) f(x) = f(a)",
                "option_b": "f(a) = 0",
                "option_c": "f(x) không có giới hạn tại a",
                "option_d": "Đạo hàm f'(a) tồn tại",
                "correct": "A",
                "explanation": "Hàm số liên tục tại x = a khi: (1) f(a) xác định (có giá trị tại a), (2) lim(x→a) f(x) tồn tại, (3) lim(x→a) f(x) = f(a). Nếu thiếu 1 trong 3 điều kiện, hàm không liên tục tại a."
            },
        ]
    },
    {
        "topic": "Đạo hàm",
        "questions": [
            {
                "content": "Đạo hàm của hàm số y = x³ − 2x² + 5x − 1 là gì?",
                "option_a": "y' = 3x² − 4x + 5",
                "option_b": "y' = 3x² − 2x + 5",
                "option_c": "y' = x² − 4x + 5",
                "option_d": "y' = 3x³ − 4x + 5",
                "correct": "A",
                "explanation": "Đạo hàm từng hạng tử: (x³)' = 3x², (2x²)' = 4x, (5x)' = 5, (1)' = 0. Kết hợp: y' = 3x² − 4x + 5. Quy tắc: (xⁿ)' = n·xⁿ⁻¹."
            },
            {
                "content": "Đạo hàm của hàm số y = sin(x) là gì?",
                "option_a": "y' = cos(x)",
                "option_b": "y' = −cos(x)",
                "option_c": "y' = −sin(x)",
                "option_d": "y' = tan(x)",
                "correct": "A",
                "explanation": "Đạo hàm cơ bản: (sinx)' = cosx, (cosx)' = −sinx, (tanx)' = 1/cos²x. Đây là công thức phải thuộc lòng trong chương trình phổ thông."
            },
            {
                "content": "Hàm số y = 2x³ − 3x² đồng biến trên khoảng nào?",
                "option_a": "(−∞; 0) ∪ (1; +∞)",
                "option_b": "(0; 1)",
                "option_c": "(−∞; 1)",
                "option_d": "(0; +∞)",
                "correct": "A",
                "explanation": "y' = 6x² − 6x = 6x(x−1). y' > 0 khi x < 0 hoặc x > 1. Hàm đồng biến khi y' > 0, tức trên (−∞;0) ∪ (1;+∞). Hàm nghịch biến trên (0;1) vì y' < 0."
            },
            {
                "content": "Phương trình tiếp tuyến của đồ thị y = x² tại điểm có hoành độ x₀ = 2 là gì?",
                "option_a": "y = 4x − 4",
                "option_b": "y = 2x − 4",
                "option_c": "y = 4x + 4",
                "option_d": "y = 4x",
                "correct": "A",
                "explanation": "y' = 2x. Tại x₀ = 2: hệ số góc k = y'(2) = 4; điểm tiếp xúc: y₀ = 2² = 4. Phương trình tiếp tuyến: y − y₀ = k(x − x₀) → y − 4 = 4(x − 2) → y = 4x − 4."
            },
        ]
    },
],

("Toán", 12): [
    {
        "topic": "Ứng dụng đạo hàm – Cực trị và Đơn điệu",
        "questions": [
            {
                "content": "Hàm số y = x³ − 3x có bao nhiêu điểm cực trị?",
                "option_a": "2 điểm cực trị (x = −1 cực đại, x = 1 cực tiểu)",
                "option_b": "1 điểm cực trị",
                "option_c": "3 điểm cực trị",
                "option_d": "Không có cực trị",
                "correct": "A",
                "explanation": "y' = 3x² − 3 = 3(x²−1) = 3(x−1)(x+1). y' = 0 tại x = ±1. Tại x = −1: y' đổi từ + sang − → cực đại y(−1) = 2. Tại x = 1: y' đổi từ − sang + → cực tiểu y(1) = −2."
            },
            {
                "content": "Giá trị lớn nhất của hàm số y = −x² + 4x + 1 trên đoạn [0; 5] là bao nhiêu?",
                "option_a": "5",
                "option_b": "1",
                "option_c": "4",
                "option_d": "6",
                "correct": "A",
                "explanation": "y' = −2x + 4 = 0 → x = 2. Bảng giá trị: y(0) = 1, y(2) = −4+8+1 = 5, y(5) = −25+20+1 = −4. Giá trị lớn nhất là 5 tại x = 2 (nằm trong [0;5])."
            },
            {
                "content": "Đường cong y = ax³ + bx² + cx + d có điểm uốn ở đâu?",
                "option_a": "Tại điểm x₀ mà y'' = 0 và y'' đổi dấu qua x₀",
                "option_b": "Tại điểm y = 0",
                "option_c": "Tại điểm y' = 0",
                "option_d": "Không bao giờ có điểm uốn",
                "correct": "A",
                "explanation": "Điểm uốn là điểm mà đồ thị đổi chiều lõm lồi. Điều kiện: y'' = 0 và y'' đổi dấu tại điểm đó. Ví dụ: y = x³ có y'' = 6x = 0 tại x = 0, và y'' đổi từ − sang + → điểm uốn (0; 0)."
            },
        ]
    },
    {
        "topic": "Tích phân",
        "questions": [
            {
                "content": "∫x² dx bằng gì?",
                "option_a": "x³/3 + C",
                "option_b": "2x + C",
                "option_c": "x³ + C",
                "option_d": "3x² + C",
                "correct": "A",
                "explanation": "∫xⁿ dx = xⁿ⁺¹/(n+1) + C (n ≠ −1). Với n = 2: ∫x² dx = x³/3 + C. Kiểm tra: đạo hàm của x³/3 là x²  ✓. C là hằng số tích phân tùy ý."
            },
            {
                "content": "Tích phân xác định ∫₀² (2x + 1) dx bằng bao nhiêu?",
                "option_a": "6",
                "option_b": "4",
                "option_c": "5",
                "option_d": "8",
                "correct": "A",
                "explanation": "∫₀²(2x+1)dx = [x² + x]₀² = (4+2) − (0+0) = 6. Tính nguyên hàm: ∫(2x+1)dx = x² + x. Áp dụng Newton-Leibniz: F(2) − F(0) = (4+2) − 0 = 6."
            },
            {
                "content": "Diện tích hình phẳng giới hạn bởi y = x², trục Ox, và đoạn [0; 3] bằng bao nhiêu?",
                "option_a": "9",
                "option_b": "27",
                "option_c": "6",
                "option_d": "3",
                "correct": "A",
                "explanation": "S = ∫₀³ x² dx = [x³/3]₀³ = 27/3 − 0 = 9. Công thức diện tích: S = ∫ₐᵇ |f(x)| dx. Vì x² ≥ 0 trên [0;3], S = ∫₀³ x² dx = 9."
            },
            {
                "content": "∫ sin(x) dx bằng gì?",
                "option_a": "−cos(x) + C",
                "option_b": "cos(x) + C",
                "option_c": "−sin(x) + C",
                "option_d": "tan(x) + C",
                "correct": "A",
                "explanation": "∫sin(x)dx = −cos(x) + C. Kiểm tra: đạo hàm của −cos(x) là −(−sin(x)) = sin(x) ✓. Bảng nguyên hàm cơ bản: ∫sinx dx = −cosx + C; ∫cosx dx = sinx + C."
            },
        ]
    },
    {
        "topic": "Số phức",
        "questions": [
            {
                "content": "Số phức z = 3 + 4i có mô-đun |z| bằng bao nhiêu?",
                "option_a": "5",
                "option_b": "7",
                "option_c": "√7",
                "option_d": "4",
                "correct": "A",
                "explanation": "|z| = √(a² + b²) với z = a + bi. |3 + 4i| = √(9 + 16) = √25 = 5. Mô-đun là khoảng cách từ điểm biểu diễn số phức đến gốc tọa độ trên mặt phẳng Argand."
            },
            {
                "content": "Tích của hai số phức (2 + i)(1 − i) bằng gì?",
                "option_a": "3 − i",
                "option_b": "3 + i",
                "option_c": "1 − i",
                "option_d": "2 − 2i",
                "correct": "A",
                "explanation": "(2+i)(1−i) = 2×1 + 2×(−i) + i×1 + i×(−i) = 2 − 2i + i − i² = 2 − i − (−1) = 2 − i + 1 = 3 − i. Nhớ: i² = −1."
            },
            {
                "content": "Phương trình x² + 4 = 0 có nghiệm là gì trong tập số phức?",
                "option_a": "x = ±2i",
                "option_b": "Vô nghiệm",
                "option_c": "x = ±2",
                "option_d": "x = 2 + i",
                "correct": "A",
                "explanation": "x² = −4 → x = ±√(−4) = ±√4·√(−1) = ±2i. Trong tập số thực phương trình vô nghiệm, nhưng trong số phức: i = √(−1), nên x = 2i hoặc x = −2i."
            },
        ]
    },
    {
        "topic": "Hình học không gian",
        "questions": [
            {
                "content": "Thể tích của hình hộp chữ nhật có các cạnh a = 3, b = 4, c = 5 là bao nhiêu?",
                "option_a": "60",
                "option_b": "47",
                "option_c": "120",
                "option_d": "94",
                "correct": "A",
                "explanation": "V = a × b × c = 3 × 4 × 5 = 60 (đơn vị khối). Hình hộp chữ nhật là trường hợp đặc biệt của lăng trụ, thể tích = diện tích đáy × chiều cao = (3×4) × 5 = 60."
            },
            {
                "content": "Thể tích của hình cầu có bán kính R = 3 là bao nhiêu?",
                "option_a": "36π",
                "option_b": "27π",
                "option_c": "12π",
                "option_d": "108π",
                "correct": "A",
                "explanation": "V = (4/3)πR³ = (4/3)π(3³) = (4/3)π×27 = 36π. Công thức thể tích hình cầu V = 4πR³/3 là công thức quan trọng cần nhớ trong hình học không gian."
            },
        ]
    },
],

# ══════════════════════════════════════════════
# VẬT LÝ (PHYSICS)
# ══════════════════════════════════════════════
("Lý", 11): [
    {
        "topic": "Điện tích và Điện trường",
        "questions": [
            {
                "content": "Định luật Coulomb nói gì về lực tương tác giữa hai điện tích điểm?",
                "option_a": "F = k·|q₁q₂|/r², lực tỉ lệ thuận với tích hai điện tích và tỉ lệ nghịch với bình phương khoảng cách",
                "option_b": "F = k·|q₁q₂|/r, lực tỉ lệ nghịch với khoảng cách",
                "option_c": "F = k·(q₁ + q₂)/r², lực tỉ lệ thuận với tổng hai điện tích",
                "option_d": "F = m·g, lực không phụ thuộc vào điện tích",
                "correct": "A",
                "explanation": "Định luật Coulomb: F = k|q₁q₂|/r², với k = 9×10⁹ N·m²/C² (hệ số Coulomb), q₁, q₂ là hai điện tích, r là khoảng cách. Hai điện tích cùng dấu đẩy nhau, khác dấu hút nhau."
            },
            {
                "content": "Cường độ điện trường E tại một điểm được định nghĩa như thế nào?",
                "option_a": "E = F/q (lực điện tác dụng lên điện tích thử q dương đặt tại điểm đó chia cho q)",
                "option_b": "E = q·F (tích của điện tích và lực điện)",
                "option_c": "E = U·d (tích điện thế và khoảng cách)",
                "option_d": "E = F·r² (lực nhân bình phương khoảng cách)",
                "correct": "A",
                "explanation": "Cường độ điện trường E = F/q₀, trong đó F là lực điện tác dụng lên điện tích thử q₀ dương đặt tại điểm đó. Đơn vị: V/m. Đây là đại lượng vectơ, cùng chiều lực tác dụng lên điện tích dương."
            },
            {
                "content": "Điện thế V tại một điểm trong điện trường là gì?",
                "option_a": "Đại lượng đặc trưng cho khả năng sinh công của điện trường tại điểm đó, V = A/q",
                "option_b": "Lực tác dụng lên điện tích đặt tại điểm đó",
                "option_c": "Điện tích của điểm đó",
                "option_d": "Năng lượng tổng cộng của điện trường",
                "correct": "A",
                "explanation": "Điện thế V = W_p/q = A_{∞→M}/q. V đặc trưng cho khả năng sinh công khi dịch chuyển điện tích từ điểm đó ra vô cực. Đơn vị: Volt (V). Hiệu điện thế U_AB = V_A − V_B = A_AB/q."
            },
            {
                "content": "Tụ điện là gì và đặc trưng chính của tụ điện là gì?",
                "option_a": "Linh kiện gồm 2 bản dẫn song song, đặc trưng bởi điện dung C = Q/U (đơn vị Farad)",
                "option_b": "Dây dẫn cuộn lại, đặc trưng bởi điện trở R",
                "option_c": "Linh kiện biến đổi điện thành nhiệt, đặc trưng bởi công suất P",
                "option_d": "Linh kiện tạo ra điện từ cơ năng, đặc trưng bởi suất điện động",
                "correct": "A",
                "explanation": "Tụ điện gồm 2 bản dẫn cách nhau bởi chất điện môi, dùng tích điện. Điện dung C = Q/U (Q: điện tích, U: hiệu điện thế), đơn vị Farad (F). Năng lượng tụ: W = CU²/2 = Q²/(2C) = QU/2."
            },
            {
                "content": "Công thức tính điện trở của dây dẫn kim loại là gì?",
                "option_a": "R = ρ·L/S (ρ: điện trở suất, L: chiều dài, S: tiết diện)",
                "option_b": "R = S/(ρ·L)",
                "option_c": "R = ρ·L·S",
                "option_d": "R = L/(ρ·S²)",
                "correct": "A",
                "explanation": "R = ρ·L/S. ρ (điện trở suất, Ω·m) phụ thuộc bản chất vật liệu. R tỉ lệ thuận chiều dài L và tỉ lệ nghịch tiết diện S. Dây dài → R lớn; dây dày (S lớn) → R nhỏ."
            },
        ]
    },
    {
        "topic": "Dòng điện trong các môi trường",
        "questions": [
            {
                "content": "Định luật Ohm cho đoạn mạch phát biểu như thế nào?",
                "option_a": "I = U/R (cường độ dòng điện tỉ lệ thuận hiệu điện thế và tỉ lệ nghịch điện trở)",
                "option_b": "U = I + R",
                "option_c": "R = U + I",
                "option_d": "I = R/U",
                "correct": "A",
                "explanation": "Định luật Ohm: I = U/R. I (A), U (V), R (Ω). Biến thể: U = I·R; R = U/I. Đây là định luật cơ bản nhất trong điện học phổ thông. Ví dụ: U = 12V, R = 4Ω → I = 12/4 = 3A."
            },
            {
                "content": "Đoạn mạch gồm R₁ = 3Ω và R₂ = 6Ω mắc song song. Điện trở tương đương là bao nhiêu?",
                "option_a": "2Ω",
                "option_b": "9Ω",
                "option_c": "4Ω",
                "option_d": "18Ω",
                "correct": "A",
                "explanation": "Mắc song song: 1/R = 1/R₁ + 1/R₂ = 1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2. Vậy R = 2Ω. Mắc nối tiếp: R = R₁ + R₂ = 9Ω. Điện trở song song luôn nhỏ hơn điện trở nhỏ nhất trong nhóm."
            },
            {
                "content": "Công suất điện của một đoạn mạch được tính theo công thức nào?",
                "option_a": "P = U·I = I²·R = U²/R",
                "option_b": "P = U + I + R",
                "option_c": "P = U/I",
                "option_d": "P = I/(U·R)",
                "correct": "A",
                "explanation": "Công suất điện P = UI = I²R = U²/R (đơn vị Watt). Các công thức tương đương vì U = IR. Điện năng tiêu thụ: A = P·t (Joule hoặc kWh). 1 kWh = 3,6×10⁶ J."
            },
        ]
    },
    {
        "topic": "Từ trường",
        "questions": [
            {
                "content": "Quy tắc bàn tay trái dùng để xác định điều gì?",
                "option_a": "Chiều lực Lorentz tác dụng lên hạt mang điện dương chuyển động trong từ trường",
                "option_b": "Chiều đường sức từ của nam châm thẳng",
                "option_c": "Chiều dòng điện cảm ứng",
                "option_d": "Chiều của lực hút giữa hai nam châm",
                "correct": "A",
                "explanation": "Quy tắc bàn tay trái: đặt bàn tay trái sao cho đường sức từ đi vào lòng bàn tay, 4 ngón tay chỉ chiều dòng điện (hoặc chiều chuyển động điện tích +) → ngón cái chỉ chiều lực Lorentz/lực Ampere."
            },
            {
                "content": "Lực từ tác dụng lên đoạn dây dẫn mang dòng điện đặt trong từ trường đều được tính theo công thức nào?",
                "option_a": "F = B·I·L·sinα (B: cảm ứng từ, I: cường độ dòng, L: chiều dài dây, α: góc giữa dây và B⃗)",
                "option_b": "F = B·I·L·cosα",
                "option_c": "F = B²·I·L",
                "option_d": "F = B·I/L",
                "correct": "A",
                "explanation": "Lực Ampere: F = BILsinα. Khi α = 90° (dây vuông góc với B⃗): F = BIL (cực đại). Khi α = 0° (dây song song với B⃗): F = 0. Đơn vị: B (Tesla), I (Ampere), L (mét), F (Newton)."
            },
            {
                "content": "Từ thông Φ qua một diện tích S trong từ trường đều B được tính như thế nào?",
                "option_a": "Φ = B·S·cosα (α là góc giữa vectơ cảm ứng từ và pháp tuyến của mặt phẳng S)",
                "option_b": "Φ = B·S·sinα",
                "option_c": "Φ = B·S + α",
                "option_d": "Φ = B/(S·cosα)",
                "correct": "A",
                "explanation": "Từ thông Φ = B·S·cosα (đơn vị Weber = Wb). α là góc giữa B⃗ và pháp tuyến n⃗ của mặt S. Khi α = 0 (B⃗ vuông góc mặt phẳng): Φ = BS (cực đại). Khi α = 90° (B⃗ song song mặt phẳng): Φ = 0."
            },
        ]
    },
    {
        "topic": "Quang học (Lý 11)",
        "questions": [
            {
                "content": "Định luật khúc xạ ánh sáng (Snell-Descartes) phát biểu như thế nào?",
                "option_a": "n₁·sinθ₁ = n₂·sinθ₂ (n: chiết suất, θ: góc so với pháp tuyến)",
                "option_b": "sinθ₁/sinθ₂ = n₁·n₂",
                "option_c": "n₁·cosθ₁ = n₂·cosθ₂",
                "option_d": "θ₁/θ₂ = n₂/n₁",
                "correct": "A",
                "explanation": "Định luật Snell: n₁sinθ₁ = n₂sinθ₂. Ánh sáng truyền từ môi trường có chiết suất n₁ sang môi trường n₂. Nếu n₂ > n₁ (dày hơn), tia khúc xạ lệch về phía pháp tuyến (θ₂ < θ₁)."
            },
            {
                "content": "Thấu kính hội tụ có tiêu cự f > 0. Vật thật đặt ngoài tiêu điểm (d > f) cho ảnh như thế nào?",
                "option_a": "Ảnh thật, ngược chiều vật",
                "option_b": "Ảnh ảo, cùng chiều vật",
                "option_c": "Không tạo ảnh",
                "option_d": "Ảnh thật, cùng chiều vật",
                "correct": "A",
                "explanation": "Công thức thấu kính: 1/f = 1/d + 1/d'. Vật thật d > f → d' > 0 (ảnh thật). Độ phóng đại k = −d'/d < 0 (ảnh ngược chiều). Vật trong tiêu cự (d < f) → ảnh ảo cùng chiều phóng to."
            },
        ]
    },
],

("Lý", 12): [
    {
        "topic": "Dao động cơ học",
        "questions": [
            {
                "content": "Phương trình dao động điều hòa x = A·cos(ωt + φ). Biên độ dao động là gì?",
                "option_a": "A – giá trị lớn nhất của li độ x",
                "option_b": "ω – tần số góc",
                "option_c": "φ – pha ban đầu",
                "option_d": "T – chu kỳ",
                "correct": "A",
                "explanation": "Trong phương trình x = Acos(ωt + φ): A là biên độ (cm hoặc m) – li độ cực đại, A > 0; ω là tần số góc (rad/s); φ là pha ban đầu (rad); T = 2π/ω là chu kỳ; f = 1/T là tần số."
            },
            {
                "content": "Con lắc lò xo có khối lượng m = 400g, độ cứng k = 100 N/m. Chu kỳ dao động là bao nhiêu?",
                "option_a": "T = 0,4π s ≈ 1,26 s",
                "option_b": "T = 2π s ≈ 6,28 s",
                "option_c": "T = π/5 s ≈ 0,63 s",
                "option_d": "T = π/2 s ≈ 1,57 s",
                "correct": "A",
                "explanation": "T = 2π√(m/k) = 2π√(0,4/100) = 2π√(0,004) = 2π×0,0632 ≈ 2π/5 = 0,4π ≈ 1,26 s. Con lắc lò xo: T phụ thuộc m và k, không phụ thuộc biên độ."
            },
            {
                "content": "Trong dao động điều hòa, tại vị trí cân bằng, đại lượng nào đạt giá trị cực đại?",
                "option_a": "Vận tốc v đạt cực đại (v_max = Aω)",
                "option_b": "Li độ x đạt cực đại",
                "option_c": "Gia tốc a đạt cực đại",
                "option_d": "Thế năng đạt cực đại",
                "correct": "A",
                "explanation": "Tại vị trí cân bằng (x = 0): v = v_max = Aω (cực đại), a = 0 (cực tiểu), thế năng = 0, động năng = cực đại = ½mv²_max = ½mA²ω². Tại biên (x = ±A): v = 0, a = a_max = Aω², thế năng = cực đại."
            },
            {
                "content": "Con lắc đơn có chiều dài l = 1 m, g = 10 m/s². Chu kỳ dao động nhỏ là bao nhiêu?",
                "option_a": "T = 2π/√10 ≈ 1,99 s",
                "option_b": "T = π s",
                "option_c": "T = 2 s",
                "option_d": "T = π/2 s",
                "correct": "A",
                "explanation": "T = 2π√(l/g) = 2π√(1/10) = 2π/√10 = 2π×0,316 ≈ 1,99 s ≈ 2s. Con lắc đơn: T phụ thuộc chiều dài l và gia tốc trọng trường g, không phụ thuộc khối lượng hay biên độ nhỏ."
            },
            {
                "content": "Cộng hưởng cơ học xảy ra khi nào và có đặc điểm gì?",
                "option_a": "Khi tần số lực cưỡng bức bằng tần số riêng; biên độ dao động đạt cực đại",
                "option_b": "Khi tần số lực cưỡng bức lớn hơn tần số riêng",
                "option_c": "Khi lực cưỡng bức bằng 0",
                "option_d": "Khi dao động tắt dần hoàn toàn",
                "correct": "A",
                "explanation": "Cộng hưởng: khi f_cưỡng_bức = f_riêng (tần số tự nhiên). Biên độ đạt cực đại, có thể gây phá hủy kết cấu (ví dụ cầu Tacoma sụp đổ 1940). Giảm xóc giúp tránh cộng hưởng nguy hiểm."
            },
        ]
    },
    {
        "topic": "Sóng cơ và Sóng âm",
        "questions": [
            {
                "content": "Bước sóng λ của sóng có mối quan hệ với vận tốc v và tần số f như thế nào?",
                "option_a": "λ = v/f = v·T",
                "option_b": "λ = f/v",
                "option_c": "λ = v·f",
                "option_d": "λ = f·T",
                "correct": "A",
                "explanation": "λ = v/f = v·T. λ (m) là khoảng cách giữa hai điểm gần nhất dao động cùng pha. Ví dụ: âm thanh 440 Hz trong không khí (v = 340 m/s): λ = 340/440 ≈ 0,77 m."
            },
            {
                "content": "Trong thí nghiệm giao thoa sóng nước với 2 nguồn S₁, S₂ đồng bộ. Điểm M nằm trên đường cực đại giao thoa khi nào?",
                "option_a": "Hiệu đường đi |S₁M − S₂M| = k·λ (k nguyên), sóng hai nguồn cùng pha tại M",
                "option_b": "Hiệu đường đi = (k + 1/2)·λ",
                "option_c": "S₁M + S₂M = k·λ",
                "option_d": "S₁M = S₂M",
                "correct": "A",
                "explanation": "Cực đại giao thoa (tăng cường): Δd = d₁ − d₂ = kλ (k = 0, ±1, ±2,...). Cực tiểu (triệt tiêu): Δd = (k + 1/2)λ. Hai nguồn đồng pha, điểm trung trực (Δd = 0) luôn là cực đại."
            },
            {
                "content": "Sóng âm có tần số 20 Hz đến 20.000 Hz gọi là gì?",
                "option_a": "Âm nghe được (âm thanh) – trong vùng nghe của tai người",
                "option_b": "Siêu âm (ultrasound)",
                "option_c": "Hạ âm (infrasound)",
                "option_d": "Sóng điện từ",
                "correct": "A",
                "explanation": "Phân loại theo tần số: Hạ âm (f < 20 Hz) – người không nghe được, động vật cảm nhận; Âm nghe được (20 Hz – 20.000 Hz) – tai người; Siêu âm (f > 20.000 Hz) – ứng dụng y tế (siêu âm thai), sonar."
            },
        ]
    },
    {
        "topic": "Điện xoay chiều",
        "questions": [
            {
                "content": "Biểu thức điện áp xoay chiều u = 220√2·cos(100πt) V. Giá trị hiệu dụng U là bao nhiêu?",
                "option_a": "U = 220 V",
                "option_b": "U = 220√2 V ≈ 311 V",
                "option_c": "U = 110 V",
                "option_d": "U = 100 V",
                "correct": "A",
                "explanation": "Giá trị hiệu dụng U = U₀/√2 = 220√2/√2 = 220 V. U₀ = 220√2 là biên độ (giá trị đỉnh). Giá trị hiệu dụng là giá trị tương đương DC về công suất tỏa nhiệt. Điện sinh hoạt Việt Nam: 220V/50Hz."
            },
            {
                "content": "Cộng hưởng điện (mạch RLC) xảy ra khi nào và trở kháng Z lúc đó bằng bao nhiêu?",
                "option_a": "Khi ZL = ZC (hay ωL = 1/ωC); Z = R (cực tiểu), I đạt cực đại",
                "option_b": "Khi ZL + ZC = 0; Z = 0",
                "option_c": "Khi R = ZL = ZC; Z = 3R",
                "option_d": "Khi ZL > ZC; Z = ZL − ZC",
                "correct": "A",
                "explanation": "Cộng hưởng RLC: ωL = 1/(ωC) → ω₀ = 1/√(LC). Lúc này ZL = ZC, Z = √(R²+(ZL−ZC)²) = R (nhỏ nhất). I₀ = U/R (lớn nhất). cos φ = 1 (φ = 0: u và i cùng pha). Ứng dụng: radio chọn kênh."
            },
            {
                "content": "Máy biến áp lý tưởng có tỉ số cuộn dây N₁/N₂ = 10. Nếu U₁ = 220V thì U₂ là bao nhiêu?",
                "option_a": "U₂ = 22 V (hạ áp)",
                "option_b": "U₂ = 2200 V (tăng áp)",
                "option_c": "U₂ = 220 V (không đổi)",
                "option_d": "U₂ = 110 V",
                "correct": "A",
                "explanation": "Máy biến áp: U₁/U₂ = N₁/N₂ = I₂/I₁. N₁/N₂ = 10/1 → U₂ = U₁×(N₂/N₁) = 220×(1/10) = 22V (máy hạ áp). Máy tăng áp: N₂ > N₁; máy hạ áp: N₂ < N₁."
            },
            {
                "content": "Công suất điện trung bình tiêu thụ trên mạch điện xoay chiều RLC là gì?",
                "option_a": "P = U·I·cosφ = I²·R (chỉ điện trở tiêu thụ công suất)",
                "option_b": "P = U·I·sinφ",
                "option_c": "P = U·I",
                "option_d": "P = I²·(R + ZL + ZC)",
                "correct": "A",
                "explanation": "Công suất trung bình P = UIcosφ = I²R. Hệ số công suất cosφ = R/Z. Tụ điện và cuộn cảm thuần không tiêu thụ công suất (chỉ tích/phóng điện), chỉ điện trở R tỏa nhiệt (tiêu thụ công suất)."
            },
        ]
    },
    {
        "topic": "Vật lý hạt nhân",
        "questions": [
            {
                "content": "Hạt nhân nguyên tử gồm những hạt nào và lực gì giữ chúng lại?",
                "option_a": "Proton và Nơtron, giữ bởi lực hạt nhân mạnh (lực tương tác mạnh)",
                "option_b": "Proton và Electron, giữ bởi lực điện từ",
                "option_c": "Proton, Nơtron và Electron, giữ bởi lực hấp dẫn",
                "option_d": "Chỉ Proton, giữ bởi lực điện",
                "correct": "A",
                "explanation": "Hạt nhân gồm proton (p, điện tích +e) và nơtron (n, trung hòa). Lực hạt nhân mạnh (strong force) giữ các nucleon lại, mạnh hơn lực đẩy Coulomb giữa các proton. Tầm tác dụng rất ngắn (~10⁻¹⁵ m)."
            },
            {
                "content": "Phóng xạ α là gì?",
                "option_a": "Hạt nhân mẹ phát ra hạt α (₂⁴He), số khối giảm 4, số proton giảm 2",
                "option_b": "Hạt nhân phát ra electron",
                "option_c": "Hạt nhân phát ra photon năng lượng cao",
                "option_d": "Hạt nhân hấp thụ một neutron",
                "correct": "A",
                "explanation": "Phóng xạ α: ²³⁸₉₂U → ²³⁴₉₀Th + ⁴₂He (hạt α). Số khối A giảm 4, số Z giảm 2. Hạt α (hạt nhân He-4) có khả năng ion hóa mạnh, đâm xuyên yếu (bị giấy chặn). Phổ biến ở hạt nhân nặng."
            },
            {
                "content": "Chu kỳ bán rã T₁/₂ của một chất phóng xạ là gì?",
                "option_a": "Thời gian để số hạt nhân phóng xạ giảm còn một nửa ban đầu",
                "option_b": "Thời gian để chất phóng xạ phân rã hoàn toàn",
                "option_c": "Thời gian để số hạt nhân tăng gấp đôi",
                "option_d": "Thời gian trung bình sống của một hạt nhân",
                "correct": "A",
                "explanation": "Chu kỳ bán rã T₁/₂: sau mỗi T₁/₂, số hạt nhân còn lại = N₀/2, N₀/4, N₀/8... Công thức: N = N₀·(1/2)^(t/T₁/₂) = N₀·e^(−λt). Ví dụ: C-14 có T₁/₂ ≈ 5730 năm, dùng định tuổi cổ vật."
            },
        ]
    },
],

# ══════════════════════════════════════════════
# SINH HỌC (BIOLOGY)
# ══════════════════════════════════════════════
("Sinh", 10): [
    {
        "topic": "Tế bào – Đơn vị cơ bản của sự sống",
        "questions": [
            {
                "content": "Màng tế bào (màng sinh chất) có cấu tạo theo mô hình nào?",
                "option_a": "Mô hình khảm lỏng (Singer & Nicolson): lớp kép phospholipid với protein gắn vào",
                "option_b": "Lớp đơn protein bao quanh lipid",
                "option_c": "Chỉ gồm các phân tử protein liên kết với nhau",
                "option_d": "Cellulose bao quanh lớp protein",
                "correct": "A",
                "explanation": "Màng sinh chất theo mô hình khảm lỏng (1972): lớp kép phospholipid (đuôi kỵ nước quay vào trong, đầu ưa nước ra ngoài) với protein xuyên màng và protein bề mặt. Cholesterol ổn định màng. Màng có tính thấm chọn lọc."
            },
            {
                "content": "Ty thể (mitochondria) có chức năng chính là gì?",
                "option_a": "Tổng hợp ATP qua hô hấp tế bào (cung cấp năng lượng cho tế bào)",
                "option_b": "Tổng hợp protein",
                "option_c": "Phân giải chất độc",
                "option_d": "Tổng hợp lipid",
                "correct": "A",
                "explanation": "Ty thể là 'nhà máy điện' của tế bào. Oxy hóa glucose qua chu trình Krebs và chuỗi truyền điện tử tạo ATP. 1 glucose → ~38 ATP. Ty thể có DNA riêng và màng kép. Di truyền theo dòng mẹ."
            },
            {
                "content": "Lục lạp (chloroplast) có chức năng gì và chỉ có ở tế bào nào?",
                "option_a": "Quang hợp (chuyển đổi năng lượng ánh sáng thành hóa năng), chỉ có ở tế bào thực vật và tảo",
                "option_b": "Hô hấp tế bào, có ở mọi tế bào nhân thực",
                "option_c": "Tiêu hóa nội bào, có ở tế bào động vật",
                "option_d": "Tổng hợp protein, có ở tế bào vi khuẩn",
                "correct": "A",
                "explanation": "Lục lạp chứa diệp lục (chlorophyll) thực hiện quang hợp: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂. Có màng kép và hệ thống thylakoid. Chỉ ở tế bào quang hợp (thực vật, tảo). Có DNA riêng như ty thể."
            },
            {
                "content": "Điểm khác biệt cơ bản giữa tế bào nhân sơ (procaryote) và tế bào nhân thực (eucaryote) là gì?",
                "option_a": "Tế bào nhân sơ không có màng nhân bao quanh DNA; tế bào nhân thực có nhân có màng",
                "option_b": "Tế bào nhân sơ không có ribosome; tế bào nhân thực có ribosome",
                "option_c": "Tế bào nhân sơ lớn hơn tế bào nhân thực",
                "option_d": "Tế bào nhân thực không có màng tế bào",
                "correct": "A",
                "explanation": "Sự khác biệt chính: nhân sơ (bacteria, archaea) – DNA vòng không được bao bởi màng nhân, không có bào quan có màng; nhân thực (động vật, thực vật, nấm, nguyên sinh vật) – nhân có màng kép, có đầy đủ bào quan."
            },
            {
                "content": "Ribôxôm (ribosome) có chức năng gì?",
                "option_a": "Tổng hợp protein (dịch mã từ mRNA thành chuỗi polypeptide)",
                "option_b": "Tổng hợp ATP",
                "option_c": "Phân giải protein cũ",
                "option_d": "Tổng hợp DNA",
                "correct": "A",
                "explanation": "Ribôxôm là nơi tổng hợp protein (dịch mã). Ribosome đọc mRNA và lắp ráp các amino acid thành chuỗi polypeptide. Gồm 2 tiểu đơn vị (lớn và nhỏ). Có ở mọi tế bào sống (nhân sơ lẫn nhân thực)."
            },
        ]
    },
    {
        "topic": "Enzim và Chuyển hóa vật chất",
        "questions": [
            {
                "content": "Enzim có bản chất hóa học là gì và hoạt động như thế nào?",
                "option_a": "Hầu hết enzim là protein, xúc tác làm giảm năng lượng hoạt hóa của phản ứng",
                "option_b": "Enzim là lipid, làm tăng năng lượng hoạt hóa",
                "option_c": "Enzim là carbohydrate, bị tiêu hao trong phản ứng",
                "option_d": "Enzim là DNA, mang thông tin di truyền",
                "correct": "A",
                "explanation": "Enzim = chất xúc tác sinh học. Hầu hết là protein (một số là RNA – ribozyme). Giảm năng lượng hoạt hóa nên phản ứng xảy ra nhanh hơn. Không bị tiêu hao, hoạt động theo cơ chế 'khóa-chìa khóa' (trung tâm hoạt động đặc hiệu với cơ chất)."
            },
            {
                "content": "Yếu tố nào ảnh hưởng đến hoạt tính của enzim?",
                "option_a": "Nhiệt độ, pH, nồng độ cơ chất và enzim, chất ức chế/hoạt hóa",
                "option_b": "Chỉ có nhiệt độ",
                "option_c": "Chỉ có pH",
                "option_d": "Áp suất khí quyển và màu sắc ánh sáng",
                "correct": "A",
                "explanation": "Hoạt tính enzim phụ thuộc: (1) Nhiệt độ – có T_opt (thường 37°C ở người), quá cao gây biến tính; (2) pH – mỗi enzim có pH_opt (pepsin: pH 2; amylase nước bọt: pH 6,7-7); (3) Nồng độ cơ chất và enzim; (4) Chất ức chế/hoạt hóa."
            },
            {
                "content": "Quang hợp ở thực vật xảy ra ở đâu và phương trình tổng quát là gì?",
                "option_a": "Lục lạp; 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (cần ánh sáng và diệp lục)",
                "option_b": "Ty thể; C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O",
                "option_c": "Ribosome; amino acid → protein",
                "option_d": "Nhân tế bào; ADN → ARN",
                "correct": "A",
                "explanation": "Quang hợp tại lục lạp: 6CO₂ + 6H₂O + ánh sáng → C₆H₁₂O₆ + 6O₂. Gồm 2 pha: pha sáng (thylakoid, tạo ATP và NADPH, giải phóng O₂) và pha tối/chu trình Calvin (stroma, cố định CO₂, tạo glucose)."
            },
        ]
    },
    {
        "topic": "Phân bào và Di truyền tế bào",
        "questions": [
            {
                "content": "Nguyên phân (mitosis) kết thúc tạo ra bao nhiêu tế bào con và có đặc điểm gì?",
                "option_a": "2 tế bào con giống hệt nhau và giống tế bào mẹ về bộ NST (2n = 2n)",
                "option_b": "4 tế bào con với bộ NST giảm đi một nửa",
                "option_c": "2 tế bào con với bộ NST đơn bội",
                "option_d": "1 tế bào con giống tế bào mẹ",
                "correct": "A",
                "explanation": "Nguyên phân: 1 tế bào 2n → 2 tế bào 2n (bộ NST được giữ nguyên). Chức năng: tăng trưởng, tái tạo, sinh sản vô tính. Giảm phân: 1 tế bào 2n → 4 tế bào n (bộ NST giảm đôi), dùng trong sinh sản hữu tính."
            },
        ]
    },
],

("Sinh", 11): [
    {
        "topic": "Dinh dưỡng và Tiêu hóa ở thực vật",
        "questions": [
            {
                "content": "Nước và muối khoáng từ đất được hấp thu và vận chuyển lên thân cây qua con đường nào chính?",
                "option_a": "Qua lông hút rễ → mạch gỗ (xylem) → lên thân, lá (nhờ áp suất thẩm thấu và thoát hơi nước)",
                "option_b": "Qua lỗ khí → mạch rây (phloem) → xuống rễ",
                "option_c": "Qua bề mặt lá → mạch gỗ → xuống rễ",
                "option_d": "Qua màng tế bào toàn thân theo khuếch tán đơn giản",
                "correct": "A",
                "explanation": "Con đường nước: Lông hút hấp thụ nước (thẩm thấu) → mạch gỗ (xylem) dẫn lên → lá thoát hơi nước (động lực kéo nước). Mạch gỗ dẫn nước và khoáng từ rễ lên. Mạch rây (phloem) dẫn sản phẩm quang hợp từ lá xuống."
            },
            {
                "content": "Thoát hơi nước qua lá có vai trò gì đối với cây?",
                "option_a": "Tạo lực kéo nước từ rễ lên lá và điều tiết nhiệt độ cây",
                "option_b": "Cung cấp H₂O cho quang hợp trực tiếp",
                "option_c": "Đẩy khoáng chất từ lá xuống rễ",
                "option_d": "Không có vai trò, chỉ là quá trình thụ động",
                "correct": "A",
                "explanation": "Thoát hơi nước (transpiration): (1) Tạo lực kéo – động lực chính vận chuyển nước từ rễ lên; (2) Điều nhiệt – làm mát cây; (3) Tạo 'con đường' cho khoáng chất hòa tan di chuyển lên. 97-99% nước hấp thu được thoát qua lá."
            },
            {
                "content": "Cây cần nguyên tố khoáng N (Nitơ) để tổng hợp những chất gì?",
                "option_a": "Protein, axit nucleic (ADN, ARN), ATP, chlorophyll",
                "option_b": "Chỉ cellulose trong thành tế bào",
                "option_c": "Chỉ tinh bột và đường",
                "option_d": "Chỉ lipid trong màng tế bào",
                "correct": "A",
                "explanation": "Nitơ là thành phần của: amino acid → protein, nucleotide → ADN/ARN, ATP (adenine), chlorophyll (diệp lục). Thiếu N: lá vàng (thiếu chlorophyll), sinh trưởng kém. Nitơ là nguyên tố đa lượng quan trọng nhất sau C, H, O."
            },
        ]
    },
    {
        "topic": "Tuần hoàn máu",
        "questions": [
            {
                "content": "Tim người có bao nhiêu ngăn và hệ tuần hoàn thuộc loại nào?",
                "option_a": "4 ngăn (2 tâm nhĩ + 2 tâm thất), hệ tuần hoàn kép và kín",
                "option_b": "2 ngăn, hệ tuần hoàn đơn",
                "option_c": "3 ngăn, hệ tuần hoàn kép",
                "option_d": "4 ngăn, hệ tuần hoàn đơn",
                "correct": "A",
                "explanation": "Tim người 4 ngăn: tâm nhĩ phải, tâm thất phải, tâm nhĩ trái, tâm thất trái. Vòng tuần hoàn nhỏ (phổi): Tim phải → phổi (trao đổi khí) → Tim trái. Vòng tuần hoàn lớn (cơ thể): Tim trái → cơ thể → Tim phải. Máu oxy hóa và khử oxy không trộn lẫn."
            },
            {
                "content": "Máu được phân thành mấy thành phần chính và chức năng của mỗi thành phần?",
                "option_a": "Huyết tương (55%) vận chuyển chất hòa tan; Hồng cầu vận chuyển O₂/CO₂; Bạch cầu miễn dịch; Tiểu cầu đông máu",
                "option_b": "Chỉ gồm nước và hồng cầu",
                "option_c": "Protein và muối khoáng",
                "option_d": "Hồng cầu (90%) và bạch cầu (10%)",
                "correct": "A",
                "explanation": "Máu gồm: Huyết tương (~55%, dịch) chứa protein, chất dinh dưỡng, hormone, CO₂; Hồng cầu (RBC) chứa hemoglobin gắn O₂ và CO₂; Bạch cầu (WBC) – miễn dịch, thực bào; Tiểu cầu – đông máu, cầm máu."
            },
            {
                "content": "Huyết áp là gì và giá trị bình thường ở người trưởng thành là bao nhiêu?",
                "option_a": "Áp lực máu lên thành mạch; bình thường ~120/80 mmHg (tâm thu/tâm trương)",
                "option_b": "Nồng độ oxy trong máu; bình thường 80-100 mmHg",
                "option_c": "Số lượng hồng cầu trong 1mm³ máu; bình thường 4,5-5,5 triệu",
                "option_d": "Nhiệt độ máu; bình thường 36-37°C",
                "correct": "A",
                "explanation": "Huyết áp = áp lực máu lên thành động mạch. HA bình thường: 120/80 mmHg (tâm thu/tâm trương). HA cao (>140/90): tăng huyết áp. HA thấp (<90/60): hạ huyết áp. Tim co bóp tạo áp lực đẩy máu lưu thông."
            },
        ]
    },
    {
        "topic": "Hô hấp và Bài tiết",
        "questions": [
            {
                "content": "Hô hấp ngoài (phổi) ở người diễn ra theo cơ chế nào?",
                "option_a": "Khuếch tán O₂ từ phế nang (nồng độ cao) vào máu, và CO₂ từ máu vào phế nang",
                "option_b": "Bơm tích cực O₂ vào máu bằng năng lượng ATP",
                "option_c": "Lọc O₂ qua màng bán thấm",
                "option_d": "Hemoglobin tích cực hút O₂ từ không khí",
                "correct": "A",
                "explanation": "Trao đổi khí ở phổi theo cơ chế khuếch tán thụ động: O₂ phế nang (pO₂ cao) → khuếch tán vào mao mạch phổi (pO₂ thấp); CO₂ trong máu (pCO₂ cao) → khuếch tán ra phế nang. Không cần năng lượng."
            },
        ]
    },
],

("Sinh", 12): [
    {
        "topic": "Di truyền học Mendel",
        "questions": [
            {
                "content": "Định luật phân li của Mendel phát biểu như thế nào?",
                "option_a": "Mỗi tính trạng do một cặp alen quy định; qua giảm phân, các alen phân li đồng đều vào giao tử",
                "option_b": "Các tính trạng luôn di truyền cùng nhau",
                "option_c": "Con luôn giống bố về tất cả tính trạng",
                "option_d": "Tính trạng lặn không bao giờ biểu hiện ở đời con",
                "correct": "A",
                "explanation": "Định luật 1 Mendel (Phân li): cơ thể dị hợp Aa qua giảm phân tạo 2 loại giao tử A và a với tỉ lệ 1:1. F₂ lai Aa × Aa: kiểu gen 1AA:2Aa:1aa; kiểu hình 3 trội:1 lặn (nếu A trội hoàn toàn)."
            },
            {
                "content": "Lai hai cặp tính trạng (Mendel): AaBb × AaBb. Tỉ lệ kiểu hình ở đời con là gì?",
                "option_a": "9 A_B_ : 3 A_bb : 3 aaB_ : 1 aabb (9:3:3:1)",
                "option_b": "3:1",
                "option_c": "1:1:1:1",
                "option_d": "1:2:1",
                "correct": "A",
                "explanation": "Định luật 2 Mendel (Phân li độc lập): AaBb × AaBb → 16 tổ hợp giao tử. Tỉ lệ kiểu hình: 9 A_B_ (2 tính trạng trội) : 3 A_bb : 3 aaB_ : 1 aabb. Điều này xảy ra khi 2 gen nằm trên 2 NST khác nhau."
            },
            {
                "content": "Cơ thể có kiểu gen Aa × aa cho tỉ lệ kiểu hình ở đời con như thế nào?",
                "option_a": "1 trội (Aa) : 1 lặn (aa)",
                "option_b": "3 trội : 1 lặn",
                "option_c": "Toàn trội",
                "option_d": "Toàn lặn",
                "correct": "A",
                "explanation": "Aa × aa: giao tử của Aa là A và a (1:1); giao tử của aa là chỉ a. Kết quả: 1/2 Aa (biểu hiện trội) : 1/2 aa (biểu hiện lặn) → tỉ lệ 1:1. Đây là phép lai phân tích (test cross) để xác định kiểu gen."
            },
            {
                "content": "Nhóm máu ABO ở người được quy định bởi bao nhiêu alen và người nhóm O có kiểu gen gì?",
                "option_a": "3 alen (Iᴬ, Iᴮ, i); người nhóm O có kiểu gen ii (đồng hợp lặn)",
                "option_b": "2 alen; người nhóm O có kiểu gen Ai",
                "option_c": "4 alen; người nhóm O không có kiểu gen",
                "option_d": "1 alen; người nhóm O là i",
                "correct": "A",
                "explanation": "Nhóm máu ABO: 3 alen đồng trội (Iᴬ đồng trội với Iᴮ, cả hai trội hơn i). Nhóm A: IᴬIᴬ hoặc Iᴬi; Nhóm B: IᴮIᴮ hoặc Iᴮi; Nhóm AB: IᴬIᴮ; Nhóm O: ii. Người O cho máu cho tất cả (hồng cầu không có kháng nguyên A, B)."
            },
        ]
    },
    {
        "topic": "Cơ sở phân tử của Di truyền",
        "questions": [
            {
                "content": "ADN (DNA) có cấu trúc như thế nào theo mô hình Watson và Crick (1953)?",
                "option_a": "Chuỗi xoắn kép: 2 mạch polynucleotide đối song song, liên kết bởi liên kết hydro giữa các bazơ bổ sung (A-T, G-X)",
                "option_b": "Chuỗi đơn polynucleotide cuộn tròn",
                "option_c": "3 mạch xoắn song song",
                "option_d": "Chuỗi kép gồm 2 mạch protein",
                "correct": "A",
                "explanation": "Mô hình Watson-Crick: ADN = 2 mạch polynucleotide xoắn kép phải, đối song song (3'-5' và 5'-3'). Liên kết hydro: A với T (2 liên kết), G với X (3 liên kết). Tỉ lệ Chargaff: %A = %T; %G = %X."
            },
            {
                "content": "Quá trình nhân đôi ADN (tái bản) tuân theo nguyên tắc gì?",
                "option_a": "Nguyên tắc bổ sung và bán bảo tồn: mỗi ADN mới gồm 1 mạch gốc + 1 mạch mới tổng hợp",
                "option_b": "Bảo tồn hoàn toàn: ADN mẹ giữ nguyên, 2 mạch hoàn toàn mới",
                "option_c": "Phân tán: các đoạn cũ và mới xen kẽ ngẫu nhiên",
                "option_d": "Chỉ 1 mạch mới tổng hợp, mạch kia bị phân hủy",
                "correct": "A",
                "explanation": "Bán bảo tồn (Meselson-Stahl, 1958): 2 mạch ADN tách nhau làm khuôn. Mỗi mạch mới lắp nucleotide theo nguyên tắc bổ sung (A ghép T, G ghép X). 2 ADN con, mỗi cái có 1 mạch cũ và 1 mạch mới."
            },
            {
                "content": "Quá trình dịch mã (translation) diễn ra như thế nào?",
                "option_a": "Ribosome đọc mRNA theo chiều 5'→3', tRNA mang amino acid, cứ 3 nucleotide (codon) mã hóa 1 amino acid",
                "option_b": "ADN → trực tiếp protein (không qua mRNA)",
                "option_c": "mRNA → ADN (phiên mã ngược)",
                "option_d": "Protein → mRNA (dịch mã ngược)",
                "correct": "A",
                "explanation": "Dịch mã: ribosome gắn vào mRNA tại codon mở đầu AUG. tRNA mang amino acid đến, anticodon của tRNA bổ sung với codon mRNA. Ribosome trượt theo chiều 5'→3'. Chuỗi peptide kéo dài đến codon kết thúc (UAA, UAG, UGA). 1 codon = 3 nucleotide = 1 amino acid."
            },
            {
                "content": "Đột biến gen là gì và loại nào nguy hiểm nhất?",
                "option_a": "Thay đổi trong trình tự nucleotide của gen; đột biến dịch khung (thêm/mất nucleotide) nguy hiểm nhất vì làm lệch toàn bộ khung đọc",
                "option_b": "Thay đổi số lượng nhiễm sắc thể",
                "option_c": "Thay đổi hình dạng nhiễm sắc thể",
                "option_d": "Thay đổi màu sắc tế bào",
                "correct": "A",
                "explanation": "Đột biến gen (point mutation): thay thế, thêm, mất 1-vài nucleotide. Nguy hiểm nhất: đột biến dịch khung (frameshift) – thêm/mất 1 nucleotide làm lệch toàn bộ khung đọc từ vị trí đột biến, thay đổi toàn bộ chuỗi amino acid sau đó."
            },
        ]
    },
    {
        "topic": "Tiến hóa",
        "questions": [
            {
                "content": "Học thuyết tiến hóa hiện đại (thuyết tổng hợp) xác định đơn vị tiến hóa cơ sở là gì?",
                "option_a": "Quần thể – nhóm cá thể cùng loài cùng khu vực, giao phối tự do với nhau",
                "option_b": "Cá thể – mỗi sinh vật riêng lẻ",
                "option_c": "Gen – từng gen riêng lẻ",
                "option_d": "Loài – toàn bộ một loài",
                "correct": "A",
                "explanation": "Thuyết tổng hợp (neo-Darwinism): đơn vị tiến hóa = quần thể (population). Tiến hóa = biến đổi tần số alen trong quần thể qua các thế hệ. Nhân tố tiến hóa: đột biến, chọn lọc tự nhiên, di-nhập gen, phiêu bạt di truyền."
            },
            {
                "content": "Chọn lọc tự nhiên (Darwin) hoạt động dựa trên cơ chế nào?",
                "option_a": "Cá thể có đặc điểm thích nghi tốt hơn → sống sót và sinh sản nhiều hơn → tần số gen thích nghi tăng",
                "option_b": "Cá thể yếu hơn tự phát sinh gen mới để thích nghi",
                "option_c": "Môi trường trực tiếp thay đổi kiểu gen của cá thể",
                "option_d": "Các loài mạnh tiêu diệt các loài yếu hơn",
                "correct": "A",
                "explanation": "CLTN (natural selection): biến dị di truyền có sẵn → môi trường 'chọn' cá thể thích nghi nhất (survival of the fittest) → chúng sinh sản nhiều hơn → tần số alen có lợi tăng qua các thế hệ. Darwin: không tạo ra biến dị, chỉ sàng lọc biến dị có sẵn."
            },
        ]
    },
],

# ══════════════════════════════════════════════
# HÓA HỌC – GRADE 10 & 11
# ══════════════════════════════════════════════
("Hóa", 10): [
    {
        "topic": "Cấu tạo nguyên tử",
        "questions": [
            {
                "content": "Nguyên tử gồm những hạt nào và hạt nào mang điện tích âm?",
                "option_a": "Proton (+), Nơtron (0), Electron (−); Electron mang điện âm",
                "option_b": "Proton (−), Electron (+), Nơtron (0)",
                "option_c": "Chỉ Proton và Electron, không có Nơtron",
                "option_d": "Proton (+) và Nơtron (0) trong hạt nhân; toàn bộ điện tích âm ở hạt nhân",
                "correct": "A",
                "explanation": "Nguyên tử gồm: Hạt nhân (proton p⁺, nơtron n⁰) và Vỏ electron (e⁻). Số proton = số electron (nguyên tử trung hòa điện). Số proton = số hiệu nguyên tử (Z). Số khối A = Z + N (N = số nơtron)."
            },
            {
                "content": "Đồng vị là gì? Ví dụ: ¹H, ²H (D), ³H (T) là đồng vị của nhau vì:",
                "option_a": "Cùng số proton (Z=1), khác số nơtron (0, 1, 2 nơtron) nên khác số khối",
                "option_b": "Cùng số nơtron, khác số proton",
                "option_c": "Cùng số khối, khác số proton",
                "option_d": "Cùng số electron lớp ngoài cùng, khác số lớp",
                "correct": "A",
                "explanation": "Đồng vị = các nguyên tử cùng nguyên tố (cùng Z), khác số nơtron N, nên khác số khối A. ¹H (p=1,n=0), ²H/D (p=1,n=1), ³H/T (p=1,n=2). Đồng vị phóng xạ ³H được dùng trong nghiên cứu sinh học."
            },
            {
                "content": "Electron trong nguyên tử được sắp xếp như thế nào theo lý thuyết lớp và phân lớp?",
                "option_a": "Theo lớp K,L,M,N... và phân lớp s,p,d,f; electron điền vào theo thứ tự mức năng lượng tăng dần",
                "option_b": "Ngẫu nhiên xung quanh hạt nhân",
                "option_c": "Tất cả electron ở cùng một lớp",
                "option_d": "Electron chỉ có 2 lớp K và L",
                "correct": "A",
                "explanation": "Cấu hình electron: theo lớp (K=1, L=2, M=3, N=4) và phân lớp (s≤2e, p≤6e, d≤10e, f≤14e). Nguyên lý Aufbau: điền theo thứ tự 1s, 2s, 2p, 3s, 3p, 4s, 3d... Ví dụ Na (Z=11): 1s²2s²2p⁶3s¹."
            },
            {
                "content": "Nguyên tử Natri (Na, Z=11) có cấu hình electron là gì và thuộc chu kỳ, nhóm nào trong bảng tuần hoàn?",
                "option_a": "1s²2s²2p⁶3s¹; Chu kỳ 3, Nhóm IA",
                "option_b": "1s²2s²2p⁶3s²; Chu kỳ 3, Nhóm IIA",
                "option_c": "1s²2s²2p⁵; Chu kỳ 2, Nhóm VIIA",
                "option_d": "1s²2s²2p⁶3s²3p¹; Chu kỳ 3, Nhóm IIIA",
                "correct": "A",
                "explanation": "Na (Z=11): 1s²2s²2p⁶3s¹ (tổng 11e). Lớp ngoài cùng 3s¹ → 1 electron lớp ngoài → nhóm IA. Lớp ngoài cùng n=3 → chu kỳ 3. Na là kim loại kiềm điển hình, dễ nhường 1e tạo Na⁺."
            },
            {
                "content": "Quy luật biến đổi độ âm điện trong bảng tuần hoàn là gì?",
                "option_a": "Tăng từ trái sang phải trong một chu kỳ; giảm từ trên xuống dưới trong một nhóm",
                "option_b": "Tăng từ trên xuống dưới trong một nhóm",
                "option_c": "Giảm từ trái sang phải trong một chu kỳ",
                "option_d": "Không có quy luật rõ ràng",
                "correct": "A",
                "explanation": "Độ âm điện: (1) Cùng chu kỳ: tăng từ trái sang phải (lực hút hạt nhân tăng, bán kính giảm). (2) Cùng nhóm: giảm từ trên xuống (bán kính tăng, electron lớp ngoài xa hạt nhân hơn). F có độ âm điện cao nhất (3,98), Cs thấp nhất trong kim loại."
            },
        ]
    },
    {
        "topic": "Liên kết hóa học",
        "questions": [
            {
                "content": "Liên kết ion được hình thành như thế nào?",
                "option_a": "Nguyên tử kim loại nhường electron cho nguyên tử phi kim, tạo cation và anion hút nhau",
                "option_b": "Hai nguyên tử dùng chung cặp electron",
                "option_c": "Hai nguyên tử trao đổi nơtron với nhau",
                "option_d": "Các electron di chuyển tự do giữa các nguyên tử kim loại",
                "correct": "A",
                "explanation": "Liên kết ion: kim loại nhường e → cation (+); phi kim nhận e → anion (−). Lực hút tĩnh điện giữa cation và anion = liên kết ion. Ví dụ: Na → Na⁺ + e⁻; Cl + e⁻ → Cl⁻; Na⁺ + Cl⁻ → NaCl. Bền, nhiệt độ nóng chảy cao."
            },
            {
                "content": "Phân tử H₂O có dạng hình học như thế nào và điều đó giải thích tính chất gì?",
                "option_a": "Hình góc (V-shape), góc H-O-H ≈ 104,5°; phân tử phân cực mạnh → điểm sôi cao, dung môi tốt",
                "option_b": "Thẳng (linear), O ở giữa; phân tử không phân cực",
                "option_c": "Tam giác đều, 3 nguyên tử xếp đều",
                "option_d": "Tứ diện đều, 4 nguyên tử ở 4 góc",
                "correct": "A",
                "explanation": "H₂O có 2 cặp e tự do trên O → đẩy mạnh → góc H-O-H ≈ 104,5° (nhỏ hơn 109,5° của tứ diện đều). Phân tử phân cực mạnh: O kéo e về phía mình. Hệ quả: liên kết hydro → t°sôi = 100°C (cao bất thường), dung môi vạn năng."
            },
            {
                "content": "Liên kết kim loại khác liên kết ion và liên kết cộng hóa trị ở điểm gì?",
                "option_a": "Các electron hóa trị di chuyển tự do trong mạng tinh thể kim loại (biển electron), không thuộc về nguyên tử cụ thể nào",
                "option_b": "Các nguyên tử kim loại dùng chung electron theo từng cặp",
                "option_c": "Nguyên tử kim loại nhường toàn bộ electron cho nguyên tử khác",
                "option_d": "Các cation kim loại được giữ bởi lực hấp dẫn với anion",
                "correct": "A",
                "explanation": "Liên kết kim loại: cation kim loại trong mạng tinh thể được bao quanh bởi 'biển' electron tự do. Electron hóa trị không thuộc nguyên tử cụ thể, tự do di chuyển → giải thích: dẫn điện, dẫn nhiệt tốt, có ánh kim, dẻo."
            },
        ]
    },
    {
        "topic": "Phản ứng oxi hóa – khử",
        "questions": [
            {
                "content": "Trong phản ứng Fe + CuSO₄ → FeSO₄ + Cu: chất nào bị oxi hóa và chất nào bị khử?",
                "option_a": "Fe bị oxi hóa (Fe → Fe²⁺ + 2e⁻); Cu²⁺ bị khử (Cu²⁺ + 2e⁻ → Cu)",
                "option_b": "Cu bị oxi hóa; Fe²⁺ bị khử",
                "option_c": "SO₄²⁻ bị oxi hóa; Fe bị khử",
                "option_d": "Không có sự oxi hóa hay khử",
                "correct": "A",
                "explanation": "Fe: số oxi hóa từ 0 → +2 (tăng) → bị oxi hóa (chất khử). Cu²⁺: số oxi hóa từ +2 → 0 (giảm) → bị khử (chất oxi hóa). Quy tắc: oxi hóa = tăng số oxi hóa = nhường electron; khử = giảm số oxi hóa = nhận electron."
            },
            {
                "content": "Phương pháp thăng bằng electron: cân bằng phương trình MnO₄⁻ + Fe²⁺ + H⁺ → Mn²⁺ + Fe³⁺ + H₂O. Tỉ lệ MnO₄⁻ : Fe²⁺ là bao nhiêu?",
                "option_a": "1 : 5",
                "option_b": "1 : 2",
                "option_c": "2 : 5",
                "option_d": "1 : 1",
                "correct": "A",
                "explanation": "Mn: +7 → +2 (nhận 5e); Fe: +2 → +3 (nhường 1e). Để electron nhường = electron nhận: 1 MnO₄⁻ × 5e = 5 Fe²⁺ × 1e. Tỉ lệ MnO₄⁻:Fe²⁺ = 1:5. Phương trình đầy đủ: MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O."
            },
            {
                "content": "Số oxi hóa của Cl trong HClO₄ (axit pecloric) là bao nhiêu?",
                "option_a": "+7",
                "option_b": "+5",
                "option_c": "+3",
                "option_d": "−1",
                "correct": "A",
                "explanation": "Trong HClO₄: H = +1, O = −2, gọi Cl = x. +1 + x + 4×(−2) = 0 → x = +7. Cl có thể có số oxi hóa: −1 (HCl), +1 (HClO), +3 (HClO₂), +5 (HClO₃), +7 (HClO₄ – cao nhất). Số oxi hóa cao nhất = số nhóm (Cl nhóm VIIA, số oxi hóa cao nhất +7)."
            },
        ]
    },
    {
        "topic": "Halogen",
        "questions": [
            {
                "content": "Halogen nào có tính oxi hóa mạnh nhất và tại sao?",
                "option_a": "Flo (F₂) – nhỏ nhất, độ âm điện cao nhất (3,98), dễ nhận electron nhất",
                "option_b": "Clo (Cl₂) – phổ biến nhất trong tự nhiên",
                "option_c": "Brom (Br₂) – ở thể lỏng ở điều kiện thường",
                "option_d": "Iot (I₂) – nặng nhất trong halogen phổ biến",
                "correct": "A",
                "explanation": "Tính oxi hóa halogen giảm: F₂ > Cl₂ > Br₂ > I₂. Flo mạnh nhất vì: bán kính nguyên tử nhỏ nhất, độ âm điện cao nhất, năng lượng liên kết F-F thấp (dễ bứt). F₂ oxi hóa được cả nước: 2F₂ + 2H₂O → 4HF + O₂."
            },
            {
                "content": "Cl₂ tác dụng với NaOH loãng, nguội tạo ra sản phẩm gì?",
                "option_a": "NaCl + NaClO + H₂O (nước Javel)",
                "option_b": "NaCl + H₂O + O₂",
                "option_c": "NaClO₃ + NaCl + H₂O",
                "option_d": "NaOH + Cl₂ không phản ứng",
                "correct": "A",
                "explanation": "Cl₂ + 2NaOH (nguội, loãng) → NaCl + NaClO + H₂O. Hỗn hợp NaCl + NaClO là nước Javel, dùng tẩy trắng và khử trùng. Cl₂ + NaOH nóng đặc → NaClO₃ + NaCl + H₂O (tỉ lệ khác). Cl₂ vừa là chất oxi hóa vừa là chất khử trong phản ứng này (tự oxi hóa khử)."
            },
        ]
    },
    {
        "topic": "Oxi – Lưu huỳnh",
        "questions": [
            {
                "content": "Axit sunfuric đặc (H₂SO₄ đặc) có những tính chất đặc trưng nào?",
                "option_a": "Hút ẩm mạnh, tính oxi hóa mạnh, háo nước (than hóa đường), thụ động hóa Fe/Al ở nguội",
                "option_b": "Chỉ là axit thông thường, không có tính oxi hóa đặc biệt",
                "option_c": "Dễ bay hơi và mùi hắc đặc trưng",
                "option_d": "Không phản ứng với kim loại",
                "correct": "A",
                "explanation": "H₂SO₄ đặc đặc trưng: (1) Hút ẩm (dùng làm khô khí); (2) Tính oxi hóa mạnh: tác dụng với hầu hết kim loại trừ Au, Pt (kể cả Cu: Cu + 2H₂SO₄đặc → CuSO₄ + SO₂↑ + 2H₂O); (3) Háo nước: C₁₂H₂₂O₁₁ → 12C + 11H₂O; (4) Thụ động Fe, Al ở nguội."
            },
            {
                "content": "SO₂ là oxit gì và có những ứng dụng/tác hại nào?",
                "option_a": "Oxit axit: gây mưa axit (SO₂ + H₂O → H₂SO₃), chất tẩy trắng bột giấy, bảo quản thực phẩm",
                "option_b": "Oxit bazơ: dùng sản xuất vôi sống",
                "option_c": "Oxit trung tính: không có ứng dụng",
                "option_d": "Oxit lưỡng tính: vừa tác dụng axit vừa tác dụng bazơ",
                "correct": "A",
                "explanation": "SO₂ là oxit axit: SO₂ + H₂O ⇌ H₂SO₃; SO₂ + 2NaOH → Na₂SO₃ + H₂O. Ứng dụng: tẩy trắng giấy/bột vải, bảo quản thực phẩm. Tác hại: gây mưa axit (từ nhà máy đốt than/dầu), gây viêm đường hô hấp."
            },
        ]
    },
],

("Hóa", 11): [
    {
        "topic": "Sự điện li",
        "questions": [
            {
                "content": "Chất điện li mạnh là gì? Cho ví dụ.",
                "option_a": "Điện li hoàn toàn trong dung dịch nước; ví dụ: HCl, NaOH, NaCl, H₂SO₄",
                "option_b": "Chỉ điện li một phần; ví dụ: CH₃COOH",
                "option_c": "Không điện li; ví dụ: đường glucozơ",
                "option_d": "Điện li tạo ra electron tự do; ví dụ: Cu, Fe",
                "correct": "A",
                "explanation": "Điện li mạnh: phân ly hoàn toàn → 100% ion. HCl → H⁺ + Cl⁻; NaOH → Na⁺ + OH⁻; NaCl → Na⁺ + Cl⁻. Điện li yếu (điện li một phần): CH₃COOH ⇌ CH₃COO⁻ + H⁺ (chỉ vài %). Không điện li: C₁₂H₂₂O₁₁ (đường), C₂H₅OH."
            },
            {
                "content": "Phản ứng giữa dung dịch HCl và dung dịch NaOH là phản ứng trung hòa. Phương trình ion rút gọn là gì?",
                "option_a": "H⁺ + OH⁻ → H₂O",
                "option_b": "HCl + NaOH → NaCl + H₂O",
                "option_c": "Na⁺ + Cl⁻ → NaCl",
                "option_d": "H₂O → H⁺ + OH⁻",
                "correct": "A",
                "explanation": "Phương trình phân tử: HCl + NaOH → NaCl + H₂O. Phương trình ion đầy đủ: H⁺ + Cl⁻ + Na⁺ + OH⁻ → Na⁺ + Cl⁻ + H₂O. Ion rút gọn (bỏ ion khán giả Na⁺, Cl⁻): H⁺ + OH⁻ → H₂O. Đây là bản chất của mọi phản ứng trung hòa (axit mạnh + bazơ mạnh)."
            },
            {
                "content": "pH = 2 nghĩa là gì và dung dịch đó có tính gì?",
                "option_a": "Nồng độ H⁺ = 10⁻² mol/L = 0,01 M; dung dịch có tính axit mạnh",
                "option_b": "pH = 2 là bazơ yếu",
                "option_c": "Nồng độ OH⁻ = 0,01 M; dung dịch trung tính",
                "option_d": "pH = 2 là dung dịch trung tính vì giữa 0 và 7",
                "correct": "A",
                "explanation": "pH = −log[H⁺]. pH = 2 → [H⁺] = 10⁻² = 0,01 M. pH < 7: axit; pH = 7: trung tính; pH > 7: bazơ. pH = 2 là axit khá mạnh (nước chanh: pH ≈ 2-3; dịch dạ dày: pH ≈ 1,5-2; Coca-Cola: pH ≈ 2,5)."
            },
        ]
    },
    {
        "topic": "Nitơ – Photpho",
        "questions": [
            {
                "content": "Amoniac (NH₃) có tính bazơ yếu. Phản ứng của NH₃ với HCl tạo ra sản phẩm gì?",
                "option_a": "NH₄Cl (amoni clorua) – muối không màu, dạng khói trắng",
                "option_b": "N₂ + H₂O + HCl",
                "option_c": "NO + H₂O",
                "option_d": "NH₃ không phản ứng với HCl",
                "correct": "A",
                "explanation": "NH₃ + HCl → NH₄Cl. Đây là phản ứng axit-bazơ (Lewis): NH₃ (cho cặp e) + HCl (nhận cặp e) → NH₄⁺Cl⁻. Khi cho bình NH₃ tiếp xúc bình HCl: xuất hiện khói trắng dày đặc (NH₄Cl). Dùng để nhận biết NH₃."
            },
            {
                "content": "Quá trình công nghiệp Haber-Bosch tổng hợp NH₃ từ N₂ và H₂ cần điều kiện gì?",
                "option_a": "Nhiệt độ 400-500°C, áp suất cao 150-300 atm, xúc tác Fe",
                "option_b": "Nhiệt độ thấp 0°C, áp suất thường, xúc tác Pt",
                "option_c": "Đun sôi ở 100°C, áp suất thường, không cần xúc tác",
                "option_d": "Nhiệt độ phòng, áp suất chân không",
                "correct": "A",
                "explanation": "N₂ + 3H₂ ⇌ 2NH₃ (ΔH < 0, thuận nghịch). Điều kiện Haber-Bosch: T = 400-500°C (xúc tác hoạt động tốt), P = 150-300 atm (tăng áp → tăng hiệu suất vì phản ứng giảm số mol khí), Fe xúc tác. Đây là phản ứng quan trọng nhất trong công nghiệp hóa học."
            },
            {
                "content": "Axit nitric đặc (HNO₃ đặc) tác dụng với Cu tạo ra khí gì?",
                "option_a": "NO₂ (màu nâu đỏ) – sản phẩm của HNO₃ đặc với kim loại",
                "option_b": "NO (không màu) – sản phẩm của HNO₃ loãng",
                "option_c": "N₂ – khí không màu, không mùi",
                "option_d": "H₂ – khí cháy được",
                "correct": "A",
                "explanation": "Cu + 4HNO₃(đặc) → Cu(NO₃)₂ + 2NO₂↑(nâu đỏ) + 2H₂O. HNO₃ loãng: 3Cu + 8HNO₃(loãng) → 3Cu(NO₃)₂ + 2NO↑(không màu) + 4H₂O. Quy tắc: HNO₃ đặc + kim loại → NO₂; HNO₃ loãng + kim loại → NO."
            },
        ]
    },
    {
        "topic": "Đại cương hóa học hữu cơ",
        "questions": [
            {
                "content": "Hóa học hữu cơ nghiên cứu về loại hợp chất nào?",
                "option_a": "Hợp chất của cacbon (trừ CO, CO₂, muối cacbonat, xianua...)",
                "option_b": "Tất cả hợp chất trong tự nhiên",
                "option_c": "Chỉ hợp chất có nguồn gốc sinh vật sống",
                "option_d": "Hợp chất của tất cả các nguyên tố phi kim",
                "correct": "A",
                "explanation": "Hóa học hữu cơ = hóa học hợp chất cacbon (trừ một số hợp chất đơn giản: CO, CO₂, CaCO₃, HCN... được xếp vào vô cơ). Hiện nay >20 triệu hợp chất hữu cơ đã biết. Đặc điểm: chủ yếu liên kết cộng hóa trị, nhiệt độ nóng chảy thấp, dễ cháy."
            },
            {
                "content": "Ankan là gì và công thức chung của ankan là gì?",
                "option_a": "Hiđrocacbon no, mạch hở, chỉ chứa liên kết đơn C-C; công thức CₙH₂ₙ₊₂ (n ≥ 1)",
                "option_b": "Hiđrocacbon có một liên kết đôi C=C; công thức CₙH₂ₙ",
                "option_c": "Hiđrocacbon vòng; công thức CₙH₂ₙ",
                "option_d": "Hiđrocacbon có liên kết ba C≡C; công thức CₙH₂ₙ₋₂",
                "correct": "A",
                "explanation": "Ankan (paraffin): CₙH₂ₙ₊₂. CH₄ (metan, n=1), C₂H₆ (etan, n=2), C₃H₈ (propan, n=3)... Tính chất: bền, phản ứng thế với halogen khi có ánh sáng, không làm mất màu dung dịch Br₂. Anken: CₙH₂ₙ (có C=C). Ankin: CₙH₂ₙ₋₂ (có C≡C)."
            },
            {
                "content": "Benzen (C₆H₆) có tính chất hóa học đặc trưng nào?",
                "option_a": "Phản ứng thế halogen (dễ) hơn phản ứng cộng (khó), không làm mất màu dung dịch KMnO₄",
                "option_b": "Dễ phản ứng cộng như anken, làm mất màu Br₂",
                "option_c": "Không tham gia bất kỳ phản ứng hóa học nào",
                "option_d": "Phản ứng cộng và oxi hóa dễ dàng",
                "correct": "A",
                "explanation": "Benzen (vòng thơm): ưu tiên phản ứng thế (SE) hơn cộng. C₆H₆ + Br₂(xúc tác FeBr₃) → C₆H₅Br + HBr (phản ứng thế). Benzen bền với KMnO₄ (không bị oxi hóa) và không làm mất màu Br₂/CCl₄ (không cộng dễ). Đây là đặc điểm 'thơm' của vòng benzene."
            },
        ]
    },
    {
        "topic": "Ancol – Anđehit – Axit cacboxylic",
        "questions": [
            {
                "content": "Etanol (C₂H₅OH) phản ứng với Na tạo ra sản phẩm gì?",
                "option_a": "C₂H₅ONa (natri etylat) + H₂↑",
                "option_b": "C₂H₅OH + Na không phản ứng",
                "option_c": "CH₃CHO (etanal) + NaH",
                "option_d": "Na₂O + C₂H₅OH → sản phẩm hữu cơ",
                "correct": "A",
                "explanation": "2C₂H₅OH + 2Na → 2C₂H₅ONa + H₂↑. Ancol phản ứng với Na (nhẹ hơn nước phản ứng Na), do liên kết O-H phân cực. So sánh: nước phản ứng Na mạnh hơn ancol (pKa nước = 15,7 < pKa etanol = 15,9 → nước axit hơn chút)."
            },
            {
                "content": "Andehit fomic (HCHO – formaldehyde) có phản ứng tráng gương không và sản phẩm là gì?",
                "option_a": "Có; HCHO + 2[Ag(NH₃)₂]OH → HCOONH₄ + 2Ag↓ + 3NH₃ + H₂O",
                "option_b": "Không; andehit không phản ứng với AgNO₃/NH₃",
                "option_c": "Có; tạo ra CO₂ và nước",
                "option_d": "Chỉ keton mới tráng gương được",
                "correct": "A",
                "explanation": "Andehit (R-CHO) có nhóm -CHO dễ bị oxi hóa → phản ứng tráng gương (AgNO₃/NH₃) và phản ứng với Cu(OH)₂/NaOH đun nóng (tạo Cu₂O kết tủa đỏ gạch). Keton không có phản ứng này (dùng để phân biệt andehit và keton). HCHO đặc biệt: tạo 4Ag (thay vì 2Ag) vì có 2 nhóm H-C-O."
            },
            {
                "content": "Axit axetic (CH₃COOH) phản ứng với NaOH tạo sản phẩm gì? Đây là loại phản ứng gì?",
                "option_a": "CH₃COONa (natri axetat) + H₂O; phản ứng trung hòa axit-bazơ",
                "option_b": "CH₃OH + CO₂ + NaOH",
                "option_c": "CH₃CHO + NaCl + H₂O",
                "option_d": "C₂H₄ + NaOH + H₂O",
                "correct": "A",
                "explanation": "CH₃COOH + NaOH → CH₃COONa + H₂O. Đây là phản ứng trung hòa (axit yếu + bazơ mạnh). Muối natri axetat CH₃COONa tan tốt trong nước và thủy phân cho môi trường bazơ yếu. Ứng dụng: giấm (5% CH₃COOH) dùng trong thực phẩm."
            },
        ]
    },
],

}  # end ALL_DATA


def seed_all():
    db = SessionLocal()
    grand_total = 0

    # Hóa 12 topic IDs to preserve (do not delete)
    HOA12_TOPIC_IDS = set()
    hoa12_topics = db.query(Topic).filter(Topic.subject == "Hóa", Topic.grade == 12).all()
    for t in hoa12_topics:
        HOA12_TOPIC_IDS.add(t.id)

    print(f"Preserving {len(HOA12_TOPIC_IDS)} Hóa 12 topics (IDs: {sorted(HOA12_TOPIC_IDS)})")

    # Delete all questions NOT in Hóa 12 topics
    all_topics = db.query(Topic).filter(~Topic.id.in_(HOA12_TOPIC_IDS)).all()
    topic_ids_to_delete = [t.id for t in all_topics]

    if topic_ids_to_delete:
        deleted_q = db.query(Question).filter(Question.topic_id.in_(topic_ids_to_delete)).delete(synchronize_session=False)
        deleted_t = db.query(Topic).filter(Topic.id.in_(topic_ids_to_delete)).delete(synchronize_session=False)
        db.commit()
        print(f"Deleted {deleted_q} old questions and {deleted_t} old topics.")

    # Seed new data
    for (subject, grade), topics_data in ALL_DATA.items():
        print(f"\n📚 Seeding {subject} Lớp {grade}...")
        for topic_data in topics_data:
            topic_name = topic_data["topic"]

            existing = db.query(Topic).filter(
                Topic.subject == subject,
                Topic.grade == grade,
                Topic.name == topic_name
            ).first()

            if not existing:
                topic = Topic(subject=subject, grade=grade, name=topic_name)
                db.add(topic)
                db.flush()
            else:
                topic = existing

            added = 0
            for q in topic_data["questions"]:
                exists = db.query(Question).filter(
                    Question.topic_id == topic.id,
                    Question.content == q["content"]
                ).first()
                if not exists:
                    new_q = Question(
                        topic_id=topic.id,
                        content=q["content"],
                        option_a=q["option_a"],
                        option_b=q["option_b"],
                        option_c=q["option_c"],
                        option_d=q["option_d"],
                        correct_answer=q["correct"],
                        explanation=q["explanation"],
                        difficulty=0.5
                    )
                    db.add(new_q)
                    added += 1

            db.commit()
            grand_total += added
            print(f"  ✓ {topic_name}: +{added} câu hỏi")

    # Final count
    total_q = db.query(Question).count()
    total_t = db.query(Topic).count()
    db.close()
    print(f"\n✅ DONE! Đã thêm {grand_total} câu hỏi mới. Tổng: {total_q} câu / {total_t} chủ đề.")

if __name__ == "__main__":
    seed_all()
