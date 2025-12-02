from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


class SeasonBase(BaseModel):
    year_start: int = Field(..., ge=2000, le=2100)


class SeasonCreate(SeasonBase):
    start_date: datetime
    end_date: datetime


class SeasonResponse(SeasonBase):
    id: UUID
    start_date: datetime
    end_date: datetime
    display_name: str
    created_at: datetime

    class Config:
        from_attributes = True
