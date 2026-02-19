import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    SUPERVISOR = "Supervisor"
    EMPLOYEE = "Employee"


class UserStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=UserRole.EMPLOYEE.value)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    supervisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), nullable=False, default=UserStatus.ACTIVE.value)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    location = relationship("Location", back_populates="users")
    department = relationship("Department", back_populates="users")
    attendance = relationship(
        "Attendance", back_populates="employee", foreign_keys="Attendance.employee_id"
    )
    supervisor = relationship("User", remote_side=[id], back_populates="employees")
    employees = relationship("User", back_populates="supervisor")
