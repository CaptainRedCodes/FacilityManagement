from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class LocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    allowed_radius_meters: int = 150


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    allowed_radius_meters: Optional[int] = Field(None, ge=10, le=1000)
    is_active: Optional[bool] = None


class LocationResponse(LocationBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
