from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from ..core.database import Base


class GameSex(str, enum.Enum):
    MALE = "Mâle"
    FEMALE = "Femelle"


class GameSpecies(Base):
    """Espèces de gibier"""
    __tablename__ = "game_species"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    games = relationship("Game", back_populates="species", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<GameSpecies {self.name}>"


class Game(Base):
    """Gibier tué"""
    __tablename__ = "games"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hunter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    species_id = Column(UUID(as_uuid=True), ForeignKey("game_species.id"), nullable=False)
    kill_date = Column(DateTime, nullable=False)
    weight = Column(Float, nullable=True)  # En kg
    sex = Column(SQLEnum(GameSex), nullable=True)
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    hunter = relationship("User", back_populates="games")
    species = relationship("GameSpecies", back_populates="games")
    game_cartridges = relationship("GameCartridge", back_populates="game", cascade="all, delete-orphan")
    cartridge_usages = relationship("CartridgeUsage", back_populates="game", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Game {self.species.name} by {self.hunter.prenom}>"


class GameCartridge(Base):
    """Relation many-to-many entre gibier et cartouches utilisées"""
    __tablename__ = "game_cartridges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.id"), nullable=False)
    cartridge_type_id = Column(UUID(as_uuid=True), ForeignKey("cartridge_types.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    game = relationship("Game", back_populates="game_cartridges")
    cartridge_type = relationship("CartridgeType", back_populates="game_cartridges")

    def __repr__(self):
        return f"<GameCartridge {self.quantity}x for Game {self.game_id}>"
