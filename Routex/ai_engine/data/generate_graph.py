import json

# Khởi tạo siêu đồ thị tri thức (Knowledge Graph)
knowledge_graph = {
    # ================= TOÁN HỌC =================
    # LỚP 10 (Nền tảng)
    "toan_10_skill_1": {"name": "Mệnh đề & Tập hợp", "prerequisites": []},
    "toan_10_skill_2": {"name": "Hàm số bậc nhất & bậc hai", "prerequisites": ["toan_10_skill_1"]},
    "toan_10_skill_3": {"name": "Vector cơ bản", "prerequisites": []},
    "toan_10_skill_4": {"name": "Tích vô hướng của 2 vector", "prerequisites": ["toan_10_skill_3"]},
    
    # LỚP 11
    "toan_11_skill_1": {"name": "Hàm số lượng giác", "prerequisites": ["toan_10_skill_2"]},
    "toan_11_skill_2": {"name": "Dãy số, Cấp số cộng, Cấp số nhân", "prerequisites": []},
    "toan_11_skill_3": {"name": "Giới hạn (Limits)", "prerequisites": ["toan_11_skill_2"]},
    "toan_11_skill_4": {"name": "Đạo hàm", "prerequisites": ["toan_11_skill_3", "toan_10_skill_2"]},
    
    # LỚP 12
    "toan_12_skill_1": {"name": "Khảo sát hàm số & Vẽ đồ thị", "prerequisites": ["toan_11_skill_4"]},
    "toan_12_skill_2": {"name": "Mũ & Logarit", "prerequisites": ["toan_10_skill_2"]},
    "toan_12_skill_3": {"name": "Nguyên hàm & Tích phân", "prerequisites": ["toan_11_skill_4"]},
    "toan_12_skill_4": {"name": "Số phức", "prerequisites": []},

    # ================= VẬT LÝ =================
    # LỚP 10
    "ly_10_skill_1": {"name": "Động học chất điểm", "prerequisites": ["toan_10_skill_3"]}, # Cần biết vector
    "ly_10_skill_2": {"name": "Động lực học (Các định luật Newton)", "prerequisites": ["ly_10_skill_1"]},
    "ly_10_skill_3": {"name": "Công & Năng lượng", "prerequisites": ["ly_10_skill_2", "toan_10_skill_4"]},
    
    # LỚP 11
    "ly_11_skill_1": {"name": "Điện tích & Điện trường", "prerequisites": ["ly_10_skill_2"]},
    "ly_11_skill_2": {"name": "Dòng điện không đổi", "prerequisites": ["ly_11_skill_1"]},
    "ly_11_skill_3": {"name": "Từ trường & Cảm ứng điện từ", "prerequisites": ["ly_11_skill_2"]},

    # LỚP 12
    "ly_12_skill_1": {"name": "Dao động cơ học", "prerequisites": ["ly_10_skill_2", "toan_11_skill_1"]}, # Cần đạo hàm & lượng giác
    "ly_12_skill_2": {"name": "Sóng cơ học", "prerequisites": ["ly_12_skill_1"]},
    "ly_12_skill_3": {"name": "Dòng điện xoay chiều", "prerequisites": ["ly_12_skill_1", "ly_11_skill_3"]},

    # ================= HÓA HỌC =================
    # LỚP 10
    "hoa_10_skill_1": {"name": "Cấu tạo nguyên tử", "prerequisites": []},
    "hoa_10_skill_2": {"name": "Bảng tuần hoàn các nguyên tố", "prerequisites": ["hoa_10_skill_1"]},
    "hoa_10_skill_3": {"name": "Liên kết hóa học", "prerequisites": ["hoa_10_skill_2"]},
    "hoa_10_skill_4": {"name": "Phản ứng Oxi hóa - Khử", "prerequisites": ["hoa_10_skill_3"]},

    # LỚP 11
    "hoa_11_skill_1": {"name": "Sự điện li", "prerequisites": ["hoa_10_skill_3"]},
    "hoa_11_skill_2": {"name": "Đại cương Hóa Hữu cơ", "prerequisites": ["hoa_10_skill_3"]},
    "hoa_11_skill_3": {"name": "Hydrocarbon (Alkane, Alkene)", "prerequisites": ["hoa_11_skill_2"]},
    "hoa_11_skill_4": {"name": "Alcohol & Phenol", "prerequisites": ["hoa_11_skill_3"]},

    # LỚP 12
    "hoa_12_skill_1": {"name": "Ester & Lipid", "prerequisites": ["hoa_11_skill_4"]},
    "hoa_12_skill_2": {"name": "Carbohydrate", "prerequisites": ["hoa_12_skill_1"]},
    "hoa_12_skill_3": {"name": "Amino Acid & Protein", "prerequisites": ["hoa_11_skill_2"]},

    # ================= SINH HỌC =================
    # LỚP 10
    "sinh_10_skill_1": {"name": "Thành phần hóa học của tế bào", "prerequisites": []},
    "sinh_10_skill_2": {"name": "Cấu trúc tế bào nhân sơ & nhân thực", "prerequisites": ["sinh_10_skill_1"]},
    "sinh_10_skill_3": {"name": "Chu kỳ tế bào & Phân bào", "prerequisites": ["sinh_10_skill_2"]},

    # LỚP 11
    "sinh_11_skill_1": {"name": "Chuyển hóa vật chất ở thực vật", "prerequisites": ["sinh_10_skill_2"]},
    "sinh_11_skill_2": {"name": "Chuyển hóa vật chất ở động vật", "prerequisites": ["sinh_10_skill_2"]},

    # LỚP 12
    "sinh_12_skill_1": {"name": "Cơ chế di truyền phân tử (ADN/ARN)", "prerequisites": ["sinh_10_skill_1"]},
    "sinh_12_skill_2": {"name": "Quy luật di truyền Mendel", "prerequisites": ["sinh_12_skill_1", "sinh_10_skill_3"]},
    "sinh_12_skill_3": {"name": "Di truyền quần thể", "prerequisites": ["sinh_12_skill_2", "toan_10_skill_1"]}, # Tính tần số alen cần Toán
}

# Xuất ra file JSON
file_path = "master_knowledge_graph.json"
with open(file_path, "w", encoding="utf-8") as f:
    json.dump(knowledge_graph, f, ensure_ascii=False, indent=4)

print(f"✅ Đã tạo thành công Siêu bản đồ tri thức tại: {file_path}")
print(f"Tổng cộng: {len(knowledge_graph)} kỹ năng (nodes).")