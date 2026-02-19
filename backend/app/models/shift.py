from datetime import datetime, time, timezone
from sqlalchemy import Column, Integer, String, DateTime, Time, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class ShiftConfig(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(
        Integer, ForeignKey("locations.id"), unique=True, nullable=False
    )
    shift_name = Column(String(100), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    grace_period_minutes = Column(Integer, default=15, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    location = relationship("Location", back_populates="shifts")
