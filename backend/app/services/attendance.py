from datetime import date, datetime, time, timedelta, timezone
from typing import List, Optional, Tuple
import random

from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.location import Location
from app.models.shift import ShiftConfig
from app.models.user import User
from app.services.geo import is_within_radius


def check_already_checked_in(
    employee_id: int, attendance_date: date, db: Session
) -> bool:
    """Check if employee has already checked in today."""
    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee_id,
            Attendance.date == attendance_date,
            Attendance.status.in_(["present", "checked_out"]),
        )
        .first()
    )
    return attendance is not None


def check_already_checked_out(
    employee_id: int, attendance_date: date, db: Session
) -> bool:
    """Check if employee has already checked out today."""
    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee_id,
            Attendance.date == attendance_date,
            Attendance.status == "checked_out",
        )
        .first()
    )
    return attendance is not None


def calculate_late(
    check_in_time: datetime, shift_start: Optional[time], grace_period_minutes: int
) -> Tuple[bool, int]:
    """
    Calculate if employee is late and by how many minutes.

    Args:
        check_in_time: The actual check-in time
        shift_start: The scheduled shift start time (None if no shift configured)
        grace_period_minutes: Grace period in minutes

    Returns:
        Tuple of (is_late, late_by_minutes)
    """
    if shift_start is None:
        return False, 0

    check_in_time_only = check_in_time.time()
    shift_start_with_grace = (
        datetime.combine(date.today(), shift_start)
        + timedelta(minutes=grace_period_minutes)
    ).time()

    if check_in_time_only > shift_start_with_grace:
        check_in_datetime = datetime.combine(date.today(), check_in_time_only)
        shift_end_datetime = datetime.combine(date.today(), shift_start)
        late_minutes = int(
            (check_in_datetime - shift_end_datetime).total_seconds() / 60
        )
        return True, late_minutes

    return False, 0


def get_todays_attendance(employee_id: int, db: Session) -> Optional[Attendance]:
    """Get today's attendance record for an employee."""
    today = datetime.now(timezone.utc).date()
    return (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee_id, Attendance.date == today)
        .first()
    )


def get_attendance_history(
    employee_id: int, start_date: date, end_date: date, db: Session
) -> List[Attendance]:
    """Get attendance history for an employee within a date range."""
    return (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee_id,
            Attendance.date >= start_date,
            Attendance.date <= end_date,
        )
        .order_by(Attendance.date.desc())
        .all()
    )


def validate_location(
    employee_lat: float, employee_lon: float, location: Location, db: Session
) -> Tuple[bool, float]:
    """
    Validate if employee is at the assigned location.

    If location has no lat/lng set, skip validation and allow check-in.
    If location has lat/lng, validate using geo service.

    Args:
        employee_lat: Employee's latitude
        employee_lon: Employee's longitude
        location: The location to validate against
        db: Database session

    Returns:
        Tuple of (is_valid, distance_meters)
    """
    if location.latitude is None or location.longitude is None:
        return True, 0.0

    is_within, distance = is_within_radius(
        employee_lat,
        employee_lon,
        location.latitude,
        location.longitude,
        location.allowed_radius_meters,
    )

    return is_within, distance


def get_shift_config(location_id: int, db: Session) -> Optional[ShiftConfig]:
    """Get shift configuration for a location."""
    return db.query(ShiftConfig).filter(ShiftConfig.location_id == location_id).first()


def ensure_daily_attendance(db: Session) -> None:
    """Create attendance records for all active employees if not exists for today."""
    today = date.today()

    existing_ids = {
        a.employee_id
        for a in db.query(Attendance).filter(Attendance.date == today).all()
    }

    employees = (
        db.query(User).filter(User.role == "Employee", User.status == "Active").all()
    )

    new_records = []
    for employee in employees:
        if employee.id in existing_ids:
            continue
        if not employee.location_id:
            continue

        new_records.append(
            Attendance(
                employee_id=employee.id,
                location_id=employee.location_id,
                check_in_time=None,
                check_out_time=None,
                check_in_latitude=0.0,
                check_in_longitude=0.0,
                distance_from_location_meters=None,
                is_late=False,
                late_by_minutes=0,
                status="not_marked",
                date=today,
            )
        )

    if new_records:
        db.bulk_save_objects(new_records)
        db.commit()
        print(f"Created {len(new_records)} attendance records for {today}")


def generate_fake_attendance(db: Session, target_date: Optional[date] = None) -> dict:
    """Randomly mark employees as present (50-90% attendance rate). Only runs once per day."""
    if target_date is None:
        target_date = date.today()

    already_generated = (
        db.query(Attendance)
        .filter(
            Attendance.date == target_date,
            Attendance.status.in_(["present", "checked_out", "absent"]),
        )
        .count()
        > 0
    )

    if already_generated:
        present_count = (
            db.query(Attendance)
            .filter(
                Attendance.date == target_date,
                Attendance.status.in_(["present", "checked_out"]),
            )
            .count()
        )
        return {
            "status": "already_generated",
            "present_count": present_count,
            "message": "Fake attendance already generated for today",
        }

    not_marked_records = (
        db.query(Attendance)
        .filter(Attendance.date == target_date, Attendance.status == "not_marked")
        .all()
    )

    if not not_marked_records:
        return {"status": "no_records", "message": "No not_marked records found"}

    attendance_rate = random.randint(50, 90)
    total_employees = len(not_marked_records)
    present_count = int(total_employees * attendance_rate / 100)

    present_employees = random.sample(not_marked_records, present_count)

    now = datetime.now(timezone.utc)
    for record in present_employees:
        record.status = "present"
        record.check_in_time = now - timedelta(minutes=random.randint(0, 120))
        record.is_late = random.choice([True, False])
        if record.is_late:
            record.late_by_minutes = random.randint(1, 30)

    db.commit()

    return {
        "status": "success",
        "total_employees": total_employees,
        "present_count": present_count,
        "attendance_rate": attendance_rate,
    }


def mark_absent_employees(db: Session, target_date: Optional[date] = None) -> dict:
    """Mark not_marked employees as absent for a specific date (or today)."""
    if target_date is None:
        target_date = date.today()

    not_marked_records = (
        db.query(Attendance)
        .filter(Attendance.date == target_date, Attendance.status == "not_marked")
        .all()
    )

    if not not_marked_records:
        return {
            "status": "no_records",
            "message": "No not_marked records found",
            "absent_count": 0,
        }

    absent_count = 0
    for record in not_marked_records:
        record.status = "absent"
        absent_count += 1

    db.commit()

    return {
        "status": "success",
        "absent_count": absent_count,
        "date": target_date.isoformat(),
    }


def auto_mark_absent_after_hours(db: Session) -> dict:
    """Automatically mark employees as absent if not checked in by end of day (6 PM local time)."""
    from datetime import time

    current_time = datetime.now().time()  # Use local time instead of UTC
    office_end_time = time(18, 0)  # 6 PM local time

    if current_time < office_end_time:
        return {"status": "skipped", "message": "Office hours not over yet"}

    today = date.today()

    return mark_absent_employees(db, today)
