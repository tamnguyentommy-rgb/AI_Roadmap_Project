from sqlalchemy.orm import declarative_base

# Cái Base này giống như Giấy khai sinh. Mọi bảng trong DB đều phải kế thừa từ đây.
Base = declarative_base()
