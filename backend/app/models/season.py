from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from ..core.database import Base


class Season(Base):
    """Saison cynégétique (septembre à février)"""
    __tablename__ = "seasons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    year_start = Column(Integer, unique=True, nullable=False)  # Ex: 2024 pour la saison 2024-2025
    start_date = Column(DateTime, nullable=False)  # 1er septembre
    end_date = Column(DateTime, nullable=False)  # 28/29 février
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Season {self.year_start}-{self.year_start + 1}>"

    @property
    def display_name(self):
        return f"{self.year_start}-{self.year_start + 1}"
