from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

from app.models.user import UserRole, UserStatus


class LocationName(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class DepartmentName(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class SupervisorName(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE
    location_id: Optional[int] = None
    department_id: Optional[int] = None


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    role: UserRole = UserRole.EMPLOYEE
    location_id: Optional[int] = None
    department_id: Optional[int] = None
    supervisor_id: Optional[int] = None


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    location_id: Optional[int] = None
    department_id: Optional[int] = None
    supervisor_id: Optional[int] = None
    status: Optional[UserStatus] = None
    password: Optional[str] = Field(None, min_length=6, max_length=100)


class UserResponse(UserBase):
    id: int
    supervisor_id: Optional[int] = None
    status: UserStatus
    created_at: datetime
    updated_at: datetime
    location: Optional[LocationName] = None
    department: Optional[DepartmentName] = None
    supervisor: Optional[SupervisorName] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
