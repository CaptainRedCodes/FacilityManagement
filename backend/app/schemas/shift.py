from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime, time


class ShiftConfigCreate(BaseModel):
    location_id: int
    shift_name: str = Field(..., min_length=1, max_length=100)
    start_time: time
    end_time: time
    grace_period_minutes: int = 15


class ShiftConfigUpdate(BaseModel):
    shift_name: Optional[str] = Field(None, min_length=1, max_length=100)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    grace_period_minutes: Optional[int] = Field(None, ge=0, le=60)


class ShiftConfigResponse(BaseModel):
    id: int
    location_id: int
    location_name: str
    shift_name: str
    start_time: time
    end_time: time
    grace_period_minutes: int
    created_at: datetime

    class Config:
        from_attributes = True
