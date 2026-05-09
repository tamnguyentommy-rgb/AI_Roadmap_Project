from sqlalchemy import Column, Integer, String, Float, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.db.base_class import Base

topic_prerequisites = Table(
    "topic_prerequisites",
    Base.metadata,
    Column("topic_id", Integer, ForeignKey("topics.id"), primary_key=True),
    Column("prerequisite_id", Integer, ForeignKey("topics.id"), primary_key=True)
)

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, index=True)
    grade = Column(Integer, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    importance_weight = Column(Float, default=1.0)

    prerequisites = relationship(
        "Topic",
        secondary=topic_prerequisites,
        primaryjoin=id == topic_prerequisites.c.topic_id,
        secondaryjoin=id == topic_prerequisites.c.prerequisite_id,
        backref="dependent_topics"
    )
    masteries = relationship("UserMastery", back_populates="topic")
    questions = relationship("Question", back_populates="topic")
