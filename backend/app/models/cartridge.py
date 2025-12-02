from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from ..core.database import Base


class ChargeType(str, enum.Enum):
    NORMAL = "Normal"
    SUPER = "Super"
    MAGNUM = "Magnum"


class PelletSize(str, enum.Enum):
    SIZE_2 = "2"
    SIZE_3 = "3"
    SIZE_4 = "4"
    SIZE_5 = "5"
    SIZE_6 = "6"
    SIZE_6_5 = "6.5"
    SIZE_7 = "7"
    SIZE_7_5 = "7.5"
    SIZE_8 = "8"


class CartridgeType(Base):
    """Type de cartouche unique (charge + plomb + marque)"""
    __tablename__ = "cartridge_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    charge_type = Column(SQLEnum(ChargeType), nullable=False)
    pellet_size = Column(SQLEnum(PelletSize), nullable=False)
    brand = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Contrainte d'unicité sur la combinaison charge + plomb + marque
    __table_args__ = (
        UniqueConstraint('charge_type', 'pellet_size', 'brand', name='uq_cartridge_type'),
    )

    # Relations
    purchases = relationship("CartridgePurchase", back_populates="cartridge_type", cascade="all, delete-orphan")
    usages = relationship("CartridgeUsage", back_populates="cartridge_type", cascade="all, delete-orphan")
    game_cartridges = relationship("GameCartridge", back_populates="cartridge_type", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<CartridgeType {self.brand} {self.charge_type} {self.pellet_size}>"


class CartridgePurchase(Base):
    """Achat de cartouches"""
    __tablename__ = "cartridge_purchases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hunter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    cartridge_type_id = Column(UUID(as_uuid=True), ForeignKey("cartridge_types.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    purchase_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    hunter = relationship("User", back_populates="cartridge_purchases")
    cartridge_type = relationship("CartridgeType", back_populates="purchases")

    @property
    def total_price(self):
        return self.quantity * self.unit_price

    def __repr__(self):
        return f"<CartridgePurchase {self.quantity}x {self.cartridge_type}>"


class CartridgeUsage(Base):
    """Utilisation de cartouches (tirs ratés ou liés à un gibier)"""
    __tablename__ = "cartridge_usages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hunter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    cartridge_type_id = Column(UUID(as_uuid=True), ForeignKey("cartridge_types.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    usage_date = Column(DateTime, nullable=False)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.id"), nullable=True)  # Nullable pour tirs ratés
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    hunter = relationship("User", back_populates="cartridge_usages")
    cartridge_type = relationship("CartridgeType", back_populates="usages")
    game = relationship("Game", back_populates="cartridge_usages")

    def __repr__(self):
        return f"<CartridgeUsage {self.quantity}x {self.cartridge_type}>"
