from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class WaitlistBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class WaitlistCreate(WaitlistBase):
    pass


class WaitlistResponse(WaitlistBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
