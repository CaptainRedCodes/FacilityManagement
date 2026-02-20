from datetime import date, datetime, time, timedelta, timezone
from typing import List, Optional, Tuple

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
            Attendance.employee_id == employee_id, Attendance.date == attendance_date
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
