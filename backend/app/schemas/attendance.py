from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime, date


class CheckInRequest(BaseModel):
    latitude: float = Field(..., description="Employee's current latitude")
    longitude: float = Field(..., description="Employee's current longitude")


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    location_id: int
    location_name: str
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    is_late: bool
    late_by_minutes: int
    status: str
    date: date
    distance_from_location_meters: Optional[float] = None

    class Config:
        from_attributes = True


class CheckInResponse(AttendanceResponse):
    message: str
    distance_from_location_meters: float


class CheckOutResponse(AttendanceResponse):
    pass


class AttendanceListResponse(BaseModel):
    items: list[AttendanceResponse]
    total: int
    page: int
    page_size: int
