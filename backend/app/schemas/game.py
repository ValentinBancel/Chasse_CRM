from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class GameSpeciesBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class GameSpeciesCreate(GameSpeciesBase):
    pass


class GameSpeciesResponse(GameSpeciesBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class GameCartridgeCreate(BaseModel):
    cartridge_type_id: UUID
    quantity: int = Field(..., gt=0)


class GameCartridgeResponse(BaseModel):
    id: UUID
    cartridge_type_id: UUID
    quantity: int
    cartridge_type: "CartridgeTypeResponse"

    class Config:
        from_attributes = True


class GameBase(BaseModel):
    species_id: UUID
    kill_date: datetime
    weight: Optional[float] = Field(None, gt=0)
    sex: Optional[str] = None  # Mâle ou Femelle
    location: Optional[str] = Field(None, max_length=255)


class GameCreate(GameBase):
    hunter_id: UUID
    cartridges: List[GameCartridgeCreate] = []


class GameUpdate(BaseModel):
    species_id: Optional[UUID] = None
    kill_date: Optional[datetime] = None
    weight: Optional[float] = Field(None, gt=0)
    sex: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    cartridges: Optional[List[GameCartridgeCreate]] = None


class GameResponse(GameBase):
    id: UUID
    hunter_id: UUID
    created_at: datetime
    species: GameSpeciesResponse
    game_cartridges: List[GameCartridgeResponse]

    class Config:
        from_attributes = True


# Import nécessaire pour la résolution des références circulaires
from .cartridge import CartridgeTypeResponse
GameCartridgeResponse.model_rebuild()
