from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class CartridgeTypeBase(BaseModel):
    charge_type: str  # Normal, Super, Magnum
    pellet_size: str  # 2, 3, 4, 5, 6, 6.5, 7, 7.5, 8
    brand: str = Field(..., min_length=1, max_length=100)


class CartridgeTypeCreate(CartridgeTypeBase):
    pass


class CartridgeTypeResponse(CartridgeTypeBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class CartridgePurchaseBase(BaseModel):
    cartridge_type_id: UUID
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    purchase_date: datetime


class CartridgePurchaseCreate(CartridgePurchaseBase):
    hunter_id: UUID


class CartridgePurchaseResponse(CartridgePurchaseBase):
    id: UUID
    hunter_id: UUID
    created_at: datetime
    total_price: float
    cartridge_type: CartridgeTypeResponse

    class Config:
        from_attributes = True


class CartridgeUsageBase(BaseModel):
    cartridge_type_id: UUID
    quantity: int = Field(..., gt=0)
    usage_date: datetime


class CartridgeUsageCreate(CartridgeUsageBase):
    hunter_id: UUID
    game_id: Optional[UUID] = None  # None pour tir raté


class CartridgeUsageResponse(CartridgeUsageBase):
    id: UUID
    hunter_id: UUID
    game_id: Optional[UUID]
    created_at: datetime
    cartridge_type: CartridgeTypeResponse

    class Config:
        from_attributes = True


class CartridgeStockResponse(BaseModel):
    """Stock actuel d'un type de cartouche pour un chasseur"""
    cartridge_type: CartridgeTypeResponse
    hunter_id: UUID
    total_purchased: int
    total_used: int
    current_stock: int
    is_low_stock: bool  # True si < 20 cartouches

    class Config:
        from_attributes = True


class CartridgeTransferCreate(BaseModel):
    """Transfert de cartouches entre chasseurs"""
    from_hunter_id: UUID
    to_hunter_id: UUID
    cartridge_type_id: UUID
    quantity: int = Field(..., gt=0)
    transfer_date: datetime
    note: Optional[str] = Field(None, max_length=255)
