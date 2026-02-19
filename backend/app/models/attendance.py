from datetime import datetime, date, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    Float,
    ForeignKey,
    Boolean,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    check_in_time = Column(DateTime(timezone=True), nullable=False)
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    check_in_latitude = Column(Float, nullable=False)
    check_in_longitude = Column(Float, nullable=False)
    distance_from_location_meters = Column(Float, nullable=True)
    is_late = Column(Boolean, default=False, nullable=False)
    late_by_minutes = Column(Integer, default=0, nullable=False)
    status = Column(String(20), default="present", nullable=False)
    date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    employee = relationship("User", foreign_keys=[employee_id])
    location = relationship("Location")
