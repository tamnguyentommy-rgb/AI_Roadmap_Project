"""
Seed script: adds Hóa Lớp 12 questions with full MCQ options directly to the database.
Run from backend/: python seed_hoa12.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine, SessionLocal
from app.db.base import Base
import app.models.user, app.models.curriculum, app.models.assessment, app.models.progress
Base.metadata.create_all(bind=engine)

from app.models.curriculum import Topic
from app.models.assessment import Question

SUBJECT = "Hóa"
GRADE = 12

HOA12_DATA = [
    {
        "topic": "Este và Lipit",
        "questions": [
            {
                "content": "Este là sản phẩm của phản ứng giữa axit cacboxylic và chất nào sau đây?",
                "option_a": "Ancol",
                "option_b": "Andehit",
                "option_c": "Xeton",
                "option_d": "Amin",
                "correct": "A",
                "explanation": "Este được tạo thành từ phản ứng este hóa giữa axit cacboxylic và ancol, với xúc tác axit và đun nóng, tạo ra este và nước."
            },
            {
                "content": "Công thức tổng quát của este no, đơn chức, mạch hở là gì?",
                "option_a": "CnH2nO2 (n ≥ 2)",
                "option_b": "CnH2n+2O2 (n ≥ 1)",
                "option_c": "CnH2n-2O2 (n ≥ 3)",
                "option_d": "CnH2nO (n ≥ 2)",
                "correct": "A",
                "explanation": "Este no, đơn chức, mạch hở có công thức CnH2nO2 (n ≥ 2), ví dụ: CH3COOC2H5 (n=4) là etyl axetat."
            },
            {
                "content": "Phản ứng thủy phân este trong môi trường kiềm được gọi là phản ứng gì?",
                "option_a": "Phản ứng xà phòng hóa",
                "option_b": "Phản ứng trung hòa",
                "option_c": "Phản ứng este hóa",
                "option_d": "Phản ứng crackinh",
                "correct": "A",
                "explanation": "Phản ứng thủy phân este trong môi trường kiềm (NaOH) gọi là phản ứng xà phòng hóa, tạo ra muối của axit cacboxylic và ancol. Phản ứng này không thuận nghịch."
            },
            {
                "content": "Chất béo là trieste của glixerol với các axit nào sau đây?",
                "option_a": "Axit béo (axit cacboxylic mạch dài)",
                "option_b": "Axit vô cơ",
                "option_c": "Axit fomic",
                "option_d": "Axit axetic",
                "correct": "A",
                "explanation": "Chất béo (lipit) là trieste của glixerol (C3H5(OH)3) với các axit béo - là các axit cacboxylic có mạch cacbon dài, thường từ C12 đến C18."
            },
            {
                "content": "Dầu thực vật khác mỡ động vật ở điểm nào sau đây?",
                "option_a": "Dầu thực vật chứa nhiều gốc axit béo không no, mỡ động vật chứa nhiều gốc axit béo no",
                "option_b": "Dầu thực vật ở thể rắn, mỡ động vật ở thể lỏng",
                "option_c": "Dầu thực vật là hợp chất vô cơ, mỡ động vật là hợp chất hữu cơ",
                "option_d": "Dầu thực vật không tan trong nước, mỡ động vật tan trong nước",
                "correct": "A",
                "explanation": "Dầu thực vật chứa nhiều gốc axit béo không no (như axit oleic, linoleic) nên ở thể lỏng. Mỡ động vật chứa nhiều gốc axit béo no (như axit stearic, palmitic) nên ở thể rắn."
            },
            {
                "content": "Este CH3COOC2H5 có tên gọi là gì?",
                "option_a": "Etyl axetat",
                "option_b": "Metyl propionat",
                "option_c": "Propyl fomat",
                "option_d": "Etyl fomat",
                "correct": "A",
                "explanation": "CH3COOC2H5: nhóm CH3COO- là gốc axetat (từ axit axetic CH3COOH), nhóm C2H5- là gốc etyl. Nên tên đầy đủ là etyl axetat."
            },
            {
                "content": "Để nhận biết este với ancol, người ta có thể dùng phương pháp nào?",
                "option_a": "Thủy phân trong NaOH, este tạo muối và ancol còn ancol không phản ứng",
                "option_b": "Dùng giấy quỳ tím, este làm đổi màu còn ancol thì không",
                "option_c": "Đốt cháy, este không cháy còn ancol cháy được",
                "option_d": "Cho vào nước, este tan hoàn toàn còn ancol không tan",
                "correct": "A",
                "explanation": "Khi thủy phân trong NaOH đun nóng: este phản ứng tạo muối cacboxylat và ancol (xà phòng hóa), còn ancol không phản ứng với NaOH. Đây là cách phân biệt đặc trưng nhất."
            },
        ]
    },
    {
        "topic": "Cacbohiđrat (Gluxit)",
        "questions": [
            {
                "content": "Glucozơ (C6H12O6) thuộc loại cacbohiđrat nào?",
                "option_a": "Monosaccarit",
                "option_b": "Đisaccarit",
                "option_c": "Polisaccarit",
                "option_d": "Lipit",
                "correct": "A",
                "explanation": "Glucozơ là monosaccarit - cacbohiđrat đơn giản nhất, không bị thủy phân thành các phân tử đường nhỏ hơn. Đây là nguồn năng lượng trực tiếp cho tế bào."
            },
            {
                "content": "Phản ứng tráng gương của glucozơ chứng tỏ glucozơ có nhóm chức nào?",
                "option_a": "Nhóm andehit (-CHO)",
                "option_b": "Nhóm hydroxyl (-OH)",
                "option_c": "Nhóm cacboxyl (-COOH)",
                "option_d": "Nhóm xeton (C=O)",
                "correct": "A",
                "explanation": "Glucozơ tham gia phản ứng tráng gương (tráng bạc) với AgNO3/NH3 vì có nhóm andehit (-CHO). Phản ứng: C6H12O6 + 2AgNO3 + 3NH3 + H2O → C6H12O7 (amoni gluconat) + 2Ag↓ + 2NH4NO3."
            },
            {
                "content": "Saccarozơ khi thủy phân tạo ra những sản phẩm nào?",
                "option_a": "Glucozơ và Fructozơ",
                "option_b": "Chỉ Glucozơ",
                "option_c": "Glucozơ và Galactozơ",
                "option_d": "Chỉ Fructozơ",
                "correct": "A",
                "explanation": "Saccarozơ (đường mía) C12H22O11 là đisaccarit, khi thủy phân (với axit hoặc enzim invertase) tạo ra 1 phân tử glucozơ và 1 phân tử fructozơ: C12H22O11 + H2O → C6H12O6 (glucozơ) + C6H12O6 (fructozơ)."
            },
            {
                "content": "Tinh bột và xenlulozơ đều có công thức chung là gì?",
                "option_a": "(C6H10O5)n",
                "option_b": "(C6H12O6)n",
                "option_c": "C12H22O11",
                "option_d": "C6H12O6",
                "correct": "A",
                "explanation": "Cả tinh bột và xenlulozơ đều là polisaccarit với công thức chung (C6H10O5)n, nhưng khác nhau về cấu trúc mạch và giá trị n. Tinh bột có mạch phân nhánh, xenlulozơ có mạch thẳng."
            },
            {
                "content": "Xenlulozơ tác dụng với HNO3 đặc (xúc tác H2SO4 đặc) tạo ra sản phẩm gì?",
                "option_a": "Xenlulozơ trinitrat (thuốc súng không khói)",
                "option_b": "Xenlulozơ axetat (tơ axetat)",
                "option_c": "Glucozơ",
                "option_d": "Tinh bột",
                "correct": "A",
                "explanation": "Xenlulozơ phản ứng với HNO3 đặc/H2SO4 đặc tạo xenlulozơ trinitrat [C6H7O2(ONO2)3]n, còn gọi là thuốc súng không khói (colodion), rất dễ cháy và nổ."
            },
            {
                "content": "Phản ứng nào dùng để nhận biết tinh bột?",
                "option_a": "Dung dịch iot (I2) làm tinh bột chuyển sang màu xanh tím",
                "option_b": "Dung dịch NaOH làm tinh bột chuyển sang màu đỏ",
                "option_c": "Dung dịch AgNO3/NH3 tạo kết tủa trắng với tinh bột",
                "option_d": "Dung dịch Cu(OH)2 tạo màu xanh đặc trưng với tinh bột",
                "correct": "A",
                "explanation": "Nhận biết tinh bột bằng dung dịch iot: tinh bột + I2 → phức màu xanh tím đặc trưng. Khi đun nóng màu mất đi, khi nguội lại xuất hiện. Đây là phản ứng đặc trưng của tinh bột."
            },
        ]
    },
    {
        "topic": "Amin – Amino axit – Protein",
        "questions": [
            {
                "content": "Amin là hợp chất hữu cơ được tạo thành khi thay thế nguyên tử H trong phân tử amoniac (NH3) bằng gốc gì?",
                "option_a": "Gốc hiđrocacbon",
                "option_b": "Gốc axit",
                "option_c": "Gốc hydroxyl",
                "option_d": "Gốc andehit",
                "correct": "A",
                "explanation": "Amin được tạo thành khi thay thế 1, 2 hoặc 3 nguyên tử H trong NH3 bằng gốc hiđrocacbon. Ví dụ: CH3NH2 (metylamin), (CH3)2NH (đimetylamin), (CH3)3N (trimetylamin)."
            },
            {
                "content": "Anilin (C6H5NH2) có phản ứng với dung dịch HBr tạo ra sản phẩm gì?",
                "option_a": "C6H5NH3Br (phenylamoni bromua)",
                "option_b": "C6H5Br + NH3",
                "option_c": "C6H5NH2·HBr không phản ứng",
                "option_d": "C6H4Br·NH2 + H2",
                "correct": "A",
                "explanation": "Anilin (amin thơm) có tính bazơ yếu, phản ứng với axit mạnh HBr tạo muối phenylamoni bromua: C6H5NH2 + HBr → C6H5NH3Br. Muối này tan trong nước."
            },
            {
                "content": "Amino axit là hợp chất hữu cơ vừa có nhóm amino (-NH2) vừa có nhóm nào?",
                "option_a": "Nhóm cacboxyl (-COOH)",
                "option_b": "Nhóm hydroxyl (-OH)",
                "option_c": "Nhóm andehit (-CHO)",
                "option_d": "Nhóm xeton (-CO-)",
                "correct": "A",
                "explanation": "Amino axit là hợp chất lưỡng tính, phân tử chứa ít nhất 1 nhóm amino (-NH2) và 1 nhóm cacboxyl (-COOH). Ví dụ: Glyxin H2N-CH2-COOH là amino axit đơn giản nhất."
            },
            {
                "content": "Phản ứng trùng ngưng giữa các phân tử amino axit tạo thành loại polime nào?",
                "option_a": "Polipeptit (protein nhân tạo)",
                "option_b": "Polime trùng hợp",
                "option_c": "Cao su tổng hợp",
                "option_d": "Polieste",
                "correct": "A",
                "explanation": "Khi amino axit trùng ngưng với nhau, nhóm -COOH của phân tử này phản ứng với -NH2 của phân tử kế tiếp, tạo liên kết peptit (-CO-NH-) và giải phóng H2O, hình thành chuỗi polipeptit (protein nhân tạo)."
            },
            {
                "content": "Protein bị đông tụ (biến tính) khi gặp điều kiện nào?",
                "option_a": "Nhiệt độ cao, axit mạnh, bazơ mạnh hoặc kim loại nặng",
                "option_b": "Chỉ khi gặp nước",
                "option_c": "Khi phản ứng với O2 trong không khí",
                "option_d": "Khi tiếp xúc với ánh sáng mặt trời",
                "correct": "A",
                "explanation": "Protein bị biến tính (mất hoạt tính sinh học, thay đổi cấu trúc không gian) khi: đun nóng (trứng chín), gặp axit/bazơ mạnh, hoặc ion kim loại nặng (Pb2+, Hg2+). Đây là lý do rượu 70% diệt khuẩn (biến tính protein vi khuẩn)."
            },
            {
                "content": "Phản ứng màu biure dùng để nhận biết nhóm chất nào?",
                "option_a": "Protein (polipeptit có ≥ 2 liên kết peptit)",
                "option_b": "Glucozơ và đường đơn",
                "option_c": "Lipit và dầu mỡ",
                "option_d": "Axit amin đơn lẻ",
                "correct": "A",
                "explanation": "Phản ứng biure: protein + Cu(OH)2 trong môi trường kiềm → phức màu tím đặc trưng. Phản ứng này xảy ra với các peptit có từ 2 liên kết peptit trở lên, dùng để phát hiện protein trong mẫu sinh học."
            },
        ]
    },
    {
        "topic": "Polime và Vật liệu Polime",
        "questions": [
            {
                "content": "Polime được tổng hợp bằng phản ứng trùng hợp từ monome etilen (CH2=CH2). Sản phẩm tạo thành là gì?",
                "option_a": "Polietilen (PE) – (-CH2-CH2-)n",
                "option_b": "Polipropen (PP)",
                "option_c": "Polivinyl clorua (PVC)",
                "option_d": "Polistiren (PS)",
                "correct": "A",
                "explanation": "Phản ứng trùng hợp etilen: nCH2=CH2 → (-CH2-CH2-)n, tạo ra polietilen (PE). Đây là nhựa dẻo phổ biến nhất, dùng làm túi nhựa, ống dẫn nước, màng bọc thực phẩm."
            },
            {
                "content": "Sợi tổng hợp nilon-6,6 được tạo ra bằng phản ứng trùng ngưng giữa hai monome nào?",
                "option_a": "Hexametylenđiamin và axit ađipic",
                "option_b": "Axit axetic và etilen glycol",
                "option_c": "Vinyl clorua và etilen",
                "option_d": "Stiren và butađien",
                "correct": "A",
                "explanation": "Nilon-6,6 tạo bởi trùng ngưng hexametylenđiamin H2N-(CH2)6-NH2 và axit ađipic HOOC-(CH2)4-COOH. Mỗi đơn vị mạch có 6C từ mỗi monome → tên nilon-6,6. Dùng làm sợi vải, dây thừng, bánh răng."
            },
            {
                "content": "Cao su buna được tổng hợp từ monome nào bằng phản ứng trùng hợp?",
                "option_a": "Butađien (CH2=CH-CH=CH2)",
                "option_b": "Isopren (CH2=C(CH3)-CH=CH2)",
                "option_c": "Stiren (C6H5-CH=CH2)",
                "option_d": "Vinyl clorua (CH2=CHCl)",
                "correct": "A",
                "explanation": "Cao su buna tổng hợp từ butađien (buta-1,3-đien) CH2=CH-CH=CH2 bằng phản ứng trùng hợp: nCH2=CH-CH=CH2 → (-CH2-CH=CH-CH2-)n. 'Buna' = Butađien + Na (natri làm xúc tác)."
            },
            {
                "content": "Thủy tinh hữu cơ (plexiglas) là polime nào sau đây?",
                "option_a": "Poli(metyl metacrylat) – PMMA",
                "option_b": "Polietilen (PE)",
                "option_c": "Polivinyl clorua (PVC)",
                "option_d": "Polistiren (PS)",
                "correct": "A",
                "explanation": "Thủy tinh hữu cơ (plexiglas, acrylic) là poli(metyl metacrylat) PMMA, tổng hợp từ monome metyl metacrylat CH2=C(CH3)COOCH3. Trong suốt, nhẹ hơn thủy tinh vô cơ, dùng làm kính chắn gió, đèn chiếu sáng."
            },
            {
                "content": "Polivinyl clorua (PVC) được điều chế từ monome nào?",
                "option_a": "Vinyl clorua (CH2=CHCl)",
                "option_b": "Etilen và Clo",
                "option_c": "Axetilen và HCl",
                "option_d": "Cả B và C đều đúng (đều là cách điều chế vinyl clorua)",
                "correct": "D",
                "explanation": "PVC điều chế bằng trùng hợp vinyl clorua CH2=CHCl. Vinyl clorua có thể được tổng hợp từ: (1) CH2=CH2 + Cl2 → CH2ClCH2Cl → CH2=CHCl + HCl, hoặc (2) HC≡CH + HCl → CH2=CHCl. Cả hai con đường B và C đều cho vinyl clorua, nên D đúng."
            },
        ]
    },
    {
        "topic": "Đại cương về Kim loại",
        "questions": [
            {
                "content": "Kim loại có tính chất vật lý đặc trưng nào sau đây?",
                "option_a": "Dẫn điện, dẫn nhiệt tốt, có ánh kim, dẻo",
                "option_b": "Không dẫn điện nhưng dẫn nhiệt tốt",
                "option_c": "Cứng giòn, không có ánh kim",
                "option_d": "Nhẹ hơn nước và không tan trong axit",
                "correct": "A",
                "explanation": "Kim loại có 4 tính chất vật lý đặc trưng: (1) Dẫn điện tốt (do electron tự do), (2) Dẫn nhiệt tốt, (3) Có ánh kim (phản xạ ánh sáng), (4) Tính dẻo (có thể dát mỏng, kéo sợi). Các tính chất này do cấu trúc mạng tinh thể kim loại quyết định."
            },
            {
                "content": "Trong dãy điện hóa (dãy hoạt động hóa học của kim loại), kim loại đứng trước có thể đẩy kim loại đứng sau ra khỏi dung dịch muối. Phản ứng nào sau đây xảy ra?",
                "option_a": "Fe + CuSO4 → FeSO4 + Cu",
                "option_b": "Cu + FeSO4 → CuSO4 + Fe",
                "option_c": "Ag + CuSO4 → AgSO4 + Cu",
                "option_d": "Au + FeCl3 → AuCl3 + Fe",
                "correct": "A",
                "explanation": "Theo dãy điện hóa: Fe đứng trước Cu. Sắt (Fe) đẩy được đồng (Cu) ra khỏi dung dịch muối đồng: Fe + CuSO4 → FeSO4 + Cu↓. Cu đứng sau Fe nên không đẩy được Fe (phản ứng B không xảy ra)."
            },
            {
                "content": "Hiện tượng ăn mòn điện hóa xảy ra khi nào?",
                "option_a": "Hai kim loại khác nhau tiếp xúc với nhau trong dung dịch chất điện li",
                "option_b": "Một kim loại tiếp xúc với không khí khô",
                "option_c": "Kim loại tiếp xúc với nước cất tinh khiết",
                "option_d": "Kim loại bị đun nóng ở nhiệt độ cao",
                "correct": "A",
                "explanation": "Ăn mòn điện hóa xảy ra khi: (1) có hai điện cực (hai kim loại khác nhau hoặc kim loại và phi kim), (2) tiếp xúc trực tiếp với nhau, (3) cùng nhúng trong dung dịch chất điện li. Kim loại yếu hơn (cực âm) bị ăn mòn. Ví dụ: vỏ tàu thép (Fe) + kẽm (Zn) trong nước biển."
            },
            {
                "content": "Phương pháp điện phân dung dịch được dùng để điều chế kim loại nào sau đây?",
                "option_a": "Đồng (Cu) từ dung dịch CuSO4",
                "option_b": "Natri (Na) từ dung dịch NaCl",
                "option_c": "Nhôm (Al) từ dung dịch Al2(SO4)3",
                "option_d": "Kali (K) từ dung dịch KCl",
                "correct": "A",
                "explanation": "Kim loại hoạt động yếu (Cu, Ag, Au) có thể điều chế bằng điện phân dung dịch muối. Cu2+ + 2e → Cu. Các kim loại mạnh (Na, K, Al, Mg) không thể điều chế từ dung dịch vì nước bị điện phân thay - phải điện phân nóng chảy."
            },
            {
                "content": "Kim loại nào sau đây có độ dẫn điện tốt nhất?",
                "option_a": "Bạc (Ag)",
                "option_b": "Đồng (Cu)",
                "option_c": "Vàng (Au)",
                "option_d": "Nhôm (Al)",
                "correct": "A",
                "explanation": "Thứ tự dẫn điện giảm dần: Ag > Cu > Au > Al > Fe. Bạc dẫn điện tốt nhất nhưng đắt. Trong thực tế, đồng (Cu) được dùng nhiều nhất làm dây điện vì vừa dẫn điện tốt (đứng thứ 2) vừa rẻ hơn bạc và vàng."
            },
            {
                "content": "Phản ứng nhiệt nhôm (aluminothermy) được dùng để điều chế kim loại gì?",
                "option_a": "Các kim loại khó nóng chảy như Cr, Mn, Fe từ oxit của chúng",
                "option_b": "Nhôm từ Al2O3",
                "option_c": "Natri từ Na2O",
                "option_d": "Magie từ MgO",
                "correct": "A",
                "explanation": "Phản ứng nhiệt nhôm: Al khử oxit kim loại ở nhiệt độ cao. Ví dụ: Fe2O3 + 2Al → Al2O3 + 2Fe (phản ứng tỏa nhiệt mạnh). Dùng để hàn đường ray (hàn nhiệt nhôm) hoặc điều chế Cr, Mn từ oxit của chúng."
            },
        ]
    },
    {
        "topic": "Kim loại kiềm – Kim loại kiềm thổ – Nhôm",
        "questions": [
            {
                "content": "Kim loại kiềm (nhóm IA) phản ứng mạnh với nước tạo ra sản phẩm gì?",
                "option_a": "Dung dịch bazơ và khí H2",
                "option_b": "Oxit kim loại và nước",
                "option_c": "Muối và khí O2",
                "option_d": "Dung dịch axit và khí H2",
                "correct": "A",
                "explanation": "Kim loại kiềm (Na, K, Li...) phản ứng rất mạnh với nước: 2Na + 2H2O → 2NaOH + H2↑. Sản phẩm là dung dịch bazơ mạnh (NaOH) và khí hiđro. K phản ứng mạnh hơn Na, có thể bốc cháy. Vì vậy kim loại kiềm được bảo quản trong dầu hỏa."
            },
            {
                "content": "Canxi (Ca) thuộc nhóm kim loại kiềm thổ. Phản ứng của Ca với nước tạo ra sản phẩm gì?",
                "option_a": "Ca(OH)2 (vôi tôi) và H2",
                "option_b": "CaO và H2O",
                "option_c": "CaCO3 và H2",
                "option_d": "Ca(OH)2 và O2",
                "correct": "A",
                "explanation": "Ca + 2H2O → Ca(OH)2 + H2↑. Canxi phản ứng được với nước ở nhiệt độ thường (khác Mg chỉ phản ứng với nước nóng). Sản phẩm Ca(OH)2 (vôi tôi) ít tan, tạo dung dịch vẩn đục, dùng làm vữa xây dựng."
            },
            {
                "content": "Nhôm (Al) không tan trong dung dịch nào sau đây?",
                "option_a": "Dung dịch HNO3 đặc nguội",
                "option_b": "Dung dịch NaOH loãng",
                "option_c": "Dung dịch HCl loãng",
                "option_d": "Dung dịch H2SO4 loãng",
                "correct": "A",
                "explanation": "Nhôm bị thụ động hóa (passivation) trong HNO3 đặc nguội và H2SO4 đặc nguội: oxit Al2O3 bảo vệ bề mặt, ngăn axit tấn công. Tuy nhiên Al tan dễ dàng trong: HCl loãng, H2SO4 loãng, NaOH loãng. Đây là lý do dùng bình nhôm chứa HNO3 đặc."
            },
            {
                "content": "Nhôm oxit (Al2O3) có tính chất gì đặc biệt?",
                "option_a": "Lưỡng tính: vừa tác dụng với axit, vừa tác dụng với bazơ mạnh",
                "option_b": "Chỉ tác dụng với axit mạnh",
                "option_c": "Chỉ tác dụng với bazơ mạnh",
                "option_d": "Trơ hoàn toàn, không tác dụng với axit hay bazơ",
                "correct": "A",
                "explanation": "Al2O3 là oxit lưỡng tính: (1) Với axit: Al2O3 + 6HCl → 2AlCl3 + 3H2O, (2) Với bazơ: Al2O3 + 2NaOH → 2NaAlO2 + H2O. Tính lưỡng tính này do Al có độ âm điện trung bình. Corundum (Al2O3 tinh khiết) là đá quý, Ruby và Sapphire đều là Al2O3."
            },
            {
                "content": "Thạch cao sống (CaSO4·2H2O) khi nung ở 150-170°C tạo ra sản phẩm gì, ứng dụng trong ngành nào?",
                "option_a": "Thạch cao nung (CaSO4·0,5H2O) – dùng trong y tế bó bột và xây dựng",
                "option_b": "CaO và SO3 – dùng làm chất hút ẩm",
                "option_c": "CaSO4 khan – không có ứng dụng thực tế",
                "option_d": "Ca(OH)2 – dùng làm vôi tôi",
                "correct": "A",
                "explanation": "CaSO4·2H2O → CaSO4·0,5H2O + 1,5H2O (nung 150-170°C). Thạch cao nung (bột trắng) khi trộn với nước lại đông cứng, giãn nở nhẹ → dùng bó bột trong y tế, làm khuôn đúc, vật liệu xây dựng. Nung cao hơn (>400°C) tạo CaSO4 khan (thạch cao chết, không đông cứng được nữa)."
            },
        ]
    },
    {
        "topic": "Sắt và Hợp chất của Sắt",
        "questions": [
            {
                "content": "Sắt (Fe) có thể có những số oxi hóa phổ biến nào trong hợp chất?",
                "option_a": "+2 và +3",
                "option_b": "Chỉ +2",
                "option_c": "Chỉ +3",
                "option_d": "+1, +2, +3 và +4",
                "correct": "A",
                "explanation": "Sắt thể hiện 2 số oxi hóa phổ biến: Fe2+ (trong FeO, FeCl2, FeSO4...) và Fe3+ (trong Fe2O3, FeCl3, Fe2(SO4)3...). Fe2+ là chất khử (dễ mất thêm 1e → Fe3+), Fe3+ là chất oxi hóa (dễ nhận 1e → Fe2+)."
            },
            {
                "content": "Gang và thép đều là hợp kim của sắt với cacbon. Điểm khác biệt chính là gì?",
                "option_a": "Gang có hàm lượng C cao hơn (2-5%), thép có hàm lượng C thấp hơn (dưới 2%)",
                "option_b": "Gang có hàm lượng C thấp hơn, thép có hàm lượng C cao hơn",
                "option_c": "Gang chứa Al, thép chứa Cr",
                "option_d": "Gang và thép có cùng hàm lượng C nhưng khác nhau về nhiệt độ nóng chảy",
                "correct": "A",
                "explanation": "Gang: hợp kim Fe-C với hàm lượng C từ 2% đến 5%, cứng, giòn, dễ đúc. Thép: hợp kim Fe-C với hàm lượng C dưới 2%, cứng, đàn hồi, dễ gia công. Hàm lượng C cao → gang giòn; thấp → thép dẻo."
            },
            {
                "content": "Phương trình phản ứng nào đúng khi cho Fe tác dụng với dung dịch HCl loãng?",
                "option_a": "Fe + 2HCl → FeCl2 + H2↑",
                "option_b": "Fe + 3HCl → FeCl3 + 1.5H2↑",
                "option_c": "2Fe + 6HCl → 2FeCl3 + 3H2↑",
                "option_d": "Fe + HCl → FeClH",
                "correct": "A",
                "explanation": "Fe tác dụng với HCl loãng tạo muối sắt(II) FeCl2 và khí H2: Fe + 2HCl → FeCl2 + H2↑. Fe chỉ bị oxi hóa lên Fe2+ bởi axit không có tính oxi hóa mạnh (HCl, H2SO4 loãng). Với HNO3 hoặc H2SO4 đặc, Fe bị oxi hóa lên Fe3+."
            },
            {
                "content": "Sắt(III) oxit (Fe2O3) có màu gì và ứng dụng chính là gì?",
                "option_a": "Màu đỏ nâu, dùng làm chất màu đỏ và nguyên liệu sản xuất thép",
                "option_b": "Màu đen, dùng trong pin điện",
                "option_c": "Màu trắng, dùng làm sơn trắng",
                "option_d": "Màu xanh lam, dùng làm thuốc nhuộm",
                "correct": "A",
                "explanation": "Fe2O3 (sắt(III) oxit hay hematit) có màu đỏ nâu đặc trưng. Ứng dụng: làm chất màu đỏ (pigment), nguyên liệu sản xuất gang và thép trong lò cao, làm chất mài (corundum nhân tạo). Gỉ sắt cũng chứa Fe2O3·nH2O màu đỏ nâu."
            },
            {
                "content": "Dùng thuốc thử nào để phân biệt dung dịch FeCl2 và FeCl3?",
                "option_a": "Dung dịch NaOH: FeCl2 tạo kết tủa trắng xanh Fe(OH)2, FeCl3 tạo kết tủa nâu đỏ Fe(OH)3",
                "option_b": "Dung dịch HCl: hai dung dịch đều không có hiện tượng",
                "option_c": "Giấy quỳ tím: FeCl2 làm quỳ đỏ, FeCl3 làm quỳ xanh",
                "option_d": "Dung dịch NaCl: FeCl2 không phản ứng, FeCl3 tạo kết tủa",
                "correct": "A",
                "explanation": "NaOH là thuốc thử phân biệt tốt nhất: FeCl2 + 2NaOH → Fe(OH)2↓ (trắng xanh) + 2NaCl; FeCl3 + 3NaOH → Fe(OH)3↓ (nâu đỏ) + 3NaCl. Fe(OH)2 màu trắng xanh, để ngoài không khí từ từ chuyển thành Fe(OH)3 màu nâu đỏ."
            },
        ]
    },
    {
        "topic": "Hóa học và Môi trường",
        "questions": [
            {
                "content": "Khí CO2 là nguyên nhân chính gây ra hiện tượng nào trong môi trường?",
                "option_a": "Hiệu ứng nhà kính và biến đổi khí hậu toàn cầu",
                "option_b": "Mưa axit",
                "option_c": "Suy giảm tầng ozon",
                "option_d": "Ô nhiễm nguồn nước",
                "correct": "A",
                "explanation": "CO2 là khí nhà kính chính: hấp thụ bức xạ hồng ngoại từ Trái Đất và giữ nhiệt trong khí quyển, gây hiệu ứng nhà kính và nóng lên toàn cầu. Mưa axit do SO2, NOx; suy giảm ozon do CFC (freon); ô nhiễm nước do kim loại nặng và hóa chất."
            },
            {
                "content": "Mưa axit xảy ra do khí nào trong khí quyển kết hợp với nước mưa?",
                "option_a": "SO2 và NO2 (từ đốt nhiên liệu hóa thạch và hoạt động công nghiệp)",
                "option_b": "CO2 và CH4",
                "option_c": "O3 và H2O",
                "option_d": "CFC và NH3",
                "correct": "A",
                "explanation": "Mưa axit hình thành khi SO2 và NOx trong khí quyển phản ứng với hơi nước và oxi: SO2 + H2O + O2 → H2SO4; 4NO2 + 2H2O + O2 → 4HNO3. Mưa axit (pH < 5,6) phá hủy cây cối, công trình, axit hóa đất và nước."
            },
            {
                "content": "Hóa chất nào sau đây là nguyên nhân chính làm suy giảm tầng ozon (O3) trong tầng bình lưu?",
                "option_a": "CFC (chlorofluorocarbon – freon, R-12, R-22)",
                "option_b": "CO2 từ xe cộ",
                "option_c": "SO2 từ nhà máy điện",
                "option_d": "NOx từ nông nghiệp",
                "correct": "A",
                "explanation": "CFC (R-12: CCl2F2, R-22: CHClF2) dùng trong điều hòa nhiệt độ, tủ lạnh cũ. Khi lên tầng bình lưu, tia UV phân giải CFC thành Cl•. Một nguyên tử Cl• có thể phá hủy hàng trăm nghìn phân tử O3. Nghị định thư Montreal (1987) đã cấm sản xuất CFC."
            },
        ]
    },
]

def seed_hoa12():
    db = SessionLocal()
    total_added = 0

    print(f"\n📚 Seeding Hóa Lớp 12...")

    for topic_data in HOA12_DATA:
        topic_name = topic_data["topic"]

        existing = db.query(Topic).filter(
            Topic.subject == SUBJECT,
            Topic.grade == GRADE,
            Topic.name == topic_name
        ).first()

        if not existing:
            topic = Topic(subject=SUBJECT, grade=GRADE, name=topic_name)
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
        total_added += added
        print(f"  ✓ {topic_name}: +{added} câu hỏi")

    db.close()
    print(f"\n✅ DONE! Đã thêm {total_added} câu hỏi Hóa Lớp 12.")

if __name__ == "__main__":
    seed_hoa12()
