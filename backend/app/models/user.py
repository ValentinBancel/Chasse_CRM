from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from ..core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    CHASSEUR = "chasseur"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.CHASSEUR, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    cartridge_purchases = relationship("CartridgePurchase", back_populates="hunter", cascade="all, delete-orphan")
    cartridge_usages = relationship("CartridgeUsage", back_populates="hunter", cascade="all, delete-orphan")
    games = relationship("Game", back_populates="hunter", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.prenom} {self.nom} ({self.email})>"
