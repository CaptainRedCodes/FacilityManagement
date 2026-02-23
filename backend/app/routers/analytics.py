from typing import Optional
from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.core.database import get_db
from app.routers.users import require_admin, require_supervisor_or_admin
from app.models.user import User
from app.models.attendance import Attendance
from app.models.location import Location
from app.models.department import Department
from app.services import attendance as attendance_service

router = APIRouter(prefix="/attendance/analytics", tags=["Attendance Analytics"])


@router.get("/summary")
def get_attendance_summary(
    date: Optional[date] = Query(None),
    location_id: Optional[int] = Query(None),
    current_user: User = Depends(require_supervisor_or_admin),
    db: Session = Depends(get_db),
):
    """Get attendance summary stats."""
    today = datetime.now(timezone.utc).date()

    if not date:
        latest_date_with_data = (
            db.query(func.max(Attendance.date))
            .filter(Attendance.status.in_(["present", "checked_out"]))
            .scalar()
        )
        if latest_date_with_data:
            date = latest_date_with_data
        else:
            date = today

    attendance_service.ensure_daily_attendance(db)

    employees_query = db.query(User).filter(
        User.role == "Employee", User.status == "Active"
    )
    if current_user.role == "Supervisor" and current_user.location_id:
        employees_query = employees_query.filter(
            User.location_id == current_user.location_id
        )
    total_employees = employees_query.count()

    attendance_query = db.query(Attendance).filter(
        Attendance.date == date, Attendance.status.in_(["present", "checked_out"])
    )
    if current_user.role == "Supervisor" and current_user.location_id:
        attendance_query = attendance_query.filter(
            Attendance.location_id == current_user.location_id
        )
    if location_id:
        attendance_query = attendance_query.filter(
            Attendance.location_id == location_id
        )

    today_records = attendance_query.all()
    present_count = len(today_records)
    late_count = len([r for r in today_records if r.is_late])
    checked_out_count = len([r for r in today_records if r.status == "checked_out"])

    not_marked_query = db.query(Attendance).filter(
        Attendance.date == date, Attendance.status == "not_marked"
    )
    if current_user.role == "Supervisor" and current_user.location_id:
        not_marked_query = not_marked_query.filter(
            Attendance.location_id == current_user.location_id
        )
    not_marked_count = not_marked_query.count()

    absent_count = total_employees - present_count - not_marked_count
    if absent_count < 0:
        absent_count = 0

    supervisors_query = db.query(User).filter(User.role == "Supervisor")
    if current_user.role == "Supervisor" and current_user.location_id:
        supervisors_query = supervisors_query.filter(
            User.location_id == current_user.location_id
        )
    total_supervisors = supervisors_query.count()

    locations_count = db.query(Location).filter(Location.is_active == True).count()

    return {
        "total_employees": total_employees,
        "total_supervisors": total_supervisors,
        "total_locations": locations_count,
        "today_present": present_count,
        "today_absent": absent_count,
        "today_late": late_count,
        "today_checked_out": checked_out_count,
        "today_not_marked": not_marked_count,
    }


@router.get("/late-frequency")
def get_late_frequency(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    location_id: Optional[int] = Query(None),
    current_user: User = Depends(require_supervisor_or_admin),
    db: Session = Depends(get_db),
):
    """Get late arrival frequency per employee."""
    if not end_date:
        end_date = datetime.now(timezone.utc).date()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    attendance_service.ensure_daily_attendance(db)

    query = (
        db.query(
            Attendance.employee_id,
            User.name.label("employee_name"),
            func.count(Attendance.id).label("total_days"),
            func.sum(case((Attendance.is_late == True, 1), else_=0)).label("late_days"),
        )
        .join(User, Attendance.employee_id == User.id)
        .filter(
            Attendance.date >= start_date,
            Attendance.date <= end_date,
            User.status == "Active",
        )
    )

    if current_user.role == "Supervisor" and current_user.location_id:
        query = query.filter(Attendance.location_id == current_user.location_id)
    elif location_id:
        query = query.filter(Attendance.location_id == location_id)

    results = query.group_by(Attendance.employee_id, User.name).all()

    return [
        {
            "employee_id": r.employee_id,
            "employee_name": r.employee_name,
            "total_days": r.total_days,
            "late_days": r.late_days or 0,
            "late_percentage": round((r.late_days or 0) / r.total_days * 100, 1)
            if r.total_days > 0
            else 0,
        }
        for r in results
    ]


@router.get("/absent-trends")
def get_absent_trends(
    days: int = Query(7, ge=1, le=30),
    location_id: Optional[int] = Query(None),
    current_user: User = Depends(require_supervisor_or_admin),
    db: Session = Depends(get_db),
):
    """Get absent trends over last N days."""
    today = datetime.now(timezone.utc).date()

    latest_date_with_data = (
        db.query(func.max(Attendance.date))
        .filter(Attendance.status.in_(["present", "checked_out"]))
        .scalar()
    )

    if latest_date_with_data:
        end_date = latest_date_with_data
    else:
        end_date = today

    start_date = end_date - timedelta(days=days - 1)

    attendance_service.ensure_daily_attendance(db)

    employees_query = db.query(User).filter(
        User.role == "Employee", User.status == "Active"
    )
    if current_user.role == "Supervisor" and current_user.location_id:
        employees_query = employees_query.filter(
            User.location_id == current_user.location_id
        )
    total_employees = employees_query.count()

    trends = []
    for i in range(days):
        current_date = start_date + timedelta(days=i)

        base_filter = [
            Attendance.date == current_date,
            Attendance.status.in_(["present", "checked_out"]),
        ]

        if current_user.role == "Supervisor" and current_user.location_id:
            base_filter.append(Attendance.location_id == current_user.location_id)
        elif location_id:
            base_filter.append(Attendance.location_id == location_id)

        present_count = db.query(Attendance).filter(*base_filter).count()

        if current_date == today:
            not_marked_count = (
                db.query(Attendance)
                .filter(
                    Attendance.date == current_date, Attendance.status == "not_marked"
                )
                .count()
            )
            absent_count = total_employees - present_count - not_marked_count
            if absent_count < 0:
                absent_count = 0
        else:
            absent_count = total_employees - present_count

        trends.append(
            {
                "date": current_date.isoformat(),
                "present": present_count,
                "absent": absent_count,
            }
        )

    return trends


@router.get("/by-location")
def get_attendance_by_location(
    date: Optional[date] = Query(None),
    current_user: User = Depends(require_supervisor_or_admin),
    db: Session = Depends(get_db),
):
    """Get attendance breakdown by location."""
    today = datetime.now(timezone.utc).date()

    if not date:
        latest_date_with_data = (
            db.query(func.max(Attendance.date))
            .filter(Attendance.status.in_(["present", "checked_out"]))
            .scalar()
        )
        if latest_date_with_data:
            date = latest_date_with_data
        else:
            date = today

    attendance_service.ensure_daily_attendance(db)

    if current_user.role == "Supervisor" and current_user.location_id:
        locations = (
            db.query(Location)
            .filter(Location.id == current_user.location_id, Location.is_active == True)
            .all()
        )
    else:
        locations = db.query(Location).filter(Location.is_active == True).all()

    results = []

    for location in locations:
        total_employees = (
            db.query(User)
            .filter(
                User.role == "Employee",
                User.status == "Active",
                User.location_id == location.id,
            )
            .count()
        )

        present = (
            db.query(Attendance)
            .filter(
                Attendance.date == date,
                Attendance.location_id == location.id,
                Attendance.status.in_(["present", "checked_out"]),
            )
            .count()
        )

        late = (
            db.query(Attendance)
            .filter(
                Attendance.date == date,
                Attendance.location_id == location.id,
                Attendance.is_late == True,
            )
            .count()
        )

        results.append(
            {
                "location_id": location.id,
                "location_name": location.name,
                "total_employees": total_employees,
                "present": present,
                "absent": total_employees - present,
                "late": late,
                "attendance_rate": round(present / total_employees * 100, 1)
                if total_employees > 0
                else 0,
            }
        )

    return results


@router.get("/by-department")
def get_attendance_by_department(
    date: Optional[date] = Query(None),
    current_user: User = Depends(require_supervisor_or_admin),
    db: Session = Depends(get_db),
):
    """Get attendance breakdown by department."""
    today = datetime.now(timezone.utc).date()

    if not date:
        latest_date_with_data = (
            db.query(func.max(Attendance.date))
            .filter(Attendance.status.in_(["present", "checked_out"]))
            .scalar()
        )
        if latest_date_with_data:
            date = latest_date_with_data
        else:
            date = today

    attendance_service.ensure_daily_attendance(db)

    if current_user.role == "Supervisor" and current_user.location_id:
        departments = (
            db.query(Department)
            .join(User)
            .filter(
                Department.is_active == True,
                User.location_id == current_user.location_id,
            )
            .distinct()
            .all()
        )
    else:
        departments = db.query(Department).filter(Department.is_active == True).all()

    results = []

    for dept in departments:
        total_employees = (
            db.query(User)
            .filter(
                User.role == "Employee",
                User.status == "Active",
                User.department_id == dept.id,
            )
            .count()
        )

        present = (
            db.query(Attendance)
            .join(User)
            .filter(
                Attendance.date == date,
                User.department_id == dept.id,
                Attendance.status.in_(["present", "checked_out"]),
            )
            .count()
        )

        late = (
            db.query(Attendance)
            .join(User)
            .filter(
                Attendance.date == date,
                User.department_id == dept.id,
                Attendance.is_late == True,
            )
            .count()
        )

        results.append(
            {
                "department_id": dept.id,
                "department_name": dept.name,
                "total_employees": total_employees,
                "present": present,
                "absent": total_employees - present,
                "late": late,
                "attendance_rate": round(present / total_employees * 100, 1)
                if total_employees > 0
                else 0,
            }
        )

    return results
