from typing import List, Optional
from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.routers.users import (
    get_current_user,
    require_admin,
    require_supervisor_or_admin,
)
from app.models.user import User
from app.models.location import Location
from app.models.attendance import Attendance
from app.schemas.attendance import (
    CheckInRequest,
    CheckInResponse,
    CheckOutResponse,
    AttendanceResponse,
    AttendanceListResponse,
)
from app.services import attendance as attendance_service

router = APIRouter(prefix="/attendance", tags=["Attendance"])


def get_current_employee(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure current user is an employee (not restricted to Employee role, but any authenticated user)."""
    if current_user.role == "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin users cannot check in/out",
        )
    return current_user


@router.post("/checkin", response_model=CheckInResponse)
def check_in(
    check_in_data: CheckInRequest,
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    """Employee check-in with GPS validation."""
    if not current_user.location_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not assigned to any work location. Please contact your administrator.",
        )

    today = datetime.now(timezone.utc).date()

    if attendance_service.check_already_checked_in(current_user.id, today, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already checked in today",
        )

    location = (
        db.query(Location).filter(Location.id == current_user.location_id).first()
    )
    if not location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your assigned location not found",
        )

    is_valid, distance = attendance_service.validate_location(
        check_in_data.latitude,
        check_in_data.longitude,
        location,
        db,
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You are not at your assigned work location. You are {int(distance)}m away. Must be within {location.allowed_radius_meters}m.",
        )

    now = datetime.now(timezone.utc)
    shift_config = attendance_service.get_shift_config(location.id, db)

    is_late = False
    late_by_minutes = 0
    if shift_config:
        is_late, late_by_minutes = attendance_service.calculate_late(
            now,
            shift_config.start_time,
            shift_config.grace_period_minutes,
        )

    attendance = Attendance(
        employee_id=current_user.id,
        location_id=location.id,
        check_in_time=now,
        check_in_latitude=check_in_data.latitude,
        check_in_longitude=check_in_data.longitude,
        distance_from_location_meters=distance,
        is_late=is_late,
        late_by_minutes=late_by_minutes,
        status="present",
        date=today,
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    if is_late:
        message = f"Checked in late by {late_by_minutes} minutes"
    else:
        message = "Checked in successfully"

    return CheckInResponse(
        id=attendance.id,
        employee_id=attendance.employee_id,
        employee_name=current_user.name,
        location_id=attendance.location_id,
        location_name=location.name,
        check_in_time=attendance.check_in_time,
        check_out_time=attendance.check_out_time,
        is_late=attendance.is_late,
        late_by_minutes=attendance.late_by_minutes,
        status=attendance.status,
        date=attendance.date,
        distance_from_location_meters=attendance.distance_from_location_meters,
        message=message,
    )


@router.post("/checkout", response_model=CheckOutResponse)
def check_out(
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    """Employee check-out."""
    today = datetime.now(timezone.utc).date()

    attendance = attendance_service.get_todays_attendance(current_user.id, db)
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have not checked in yet",
        )

    if attendance.status == "checked_out":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already checked out",
        )

    now = datetime.now(timezone.utc)
    attendance.check_out_time = now
    attendance.status = "checked_out"
    db.commit()
    db.refresh(attendance)

    location = db.query(Location).filter(Location.id == attendance.location_id).first()

    return CheckOutResponse(
        id=attendance.id,
        employee_id=attendance.employee_id,
        employee_name=current_user.name,
        location_id=attendance.location_id,
        location_name=location.name if location else "Unknown",
        check_in_time=attendance.check_in_time,
        check_out_time=attendance.check_out_time,
        is_late=attendance.is_late,
        late_by_minutes=attendance.late_by_minutes,
        status=attendance.status,
        date=attendance.date,
        distance_from_location_meters=attendance.distance_from_location_meters,
    )


@router.get("/today", response_model=Optional[AttendanceResponse])
def get_today_attendance(
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    """Get today's attendance for current employee."""
    attendance = attendance_service.get_todays_attendance(current_user.id, db)
    if not attendance:
        return None

    location = db.query(Location).filter(Location.id == attendance.location_id).first()

    return AttendanceResponse(
        id=attendance.id,
        employee_id=attendance.employee_id,
        employee_name=current_user.name,
        location_id=attendance.location_id,
        location_name=location.name if location else "Unknown",
        check_in_time=attendance.check_in_time,
        check_out_time=attendance.check_out_time,
        is_late=attendance.is_late,
        late_by_minutes=attendance.late_by_minutes,
        status=attendance.status,
        date=attendance.date,
        distance_from_location_meters=attendance.distance_from_location_meters,
    )


@router.get("/history", response_model=List[AttendanceResponse])
def get_attendance_history(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    """Get attendance history for current employee."""
    if not end_date:
        end_date = datetime.now(timezone.utc).date()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    records = (
        db.query(Attendance)
        .options(joinedload(Attendance.employee), joinedload(Attendance.location))
        .filter(
            Attendance.employee_id == current_user.id,
            Attendance.date >= start_date,
            Attendance.date <= end_date,
        )
        .order_by(Attendance.date.desc())
        .all()
    )

    result = []
    for attendance in records:
        result.append(
            AttendanceResponse(
                id=attendance.id,
                employee_id=attendance.employee_id,
                employee_name=attendance.employee.name
                if attendance.employee
                else current_user.name,
                location_id=attendance.location_id,
                location_name=attendance.location.name
                if attendance.location
                else "Unknown",
                check_in_time=attendance.check_in_time,
                check_out_time=attendance.check_out_time,
                is_late=attendance.is_late,
                late_by_minutes=attendance.late_by_minutes,
                status=attendance.status,
                date=attendance.date,
                distance_from_location_meters=attendance.distance_from_location_meters,
            )
        )

    return result


@router.get("/all", response_model=AttendanceListResponse)
def get_all_attendance(
    date: Optional[date] = Query(None),
    location_id: Optional[int] = Query(None),
    department_id: Optional[int] = Query(None),
    employee_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    current_user: User = Depends(require_supervisor_or_admin),
    db: Session = Depends(get_db),
):
    """Get all attendance records (Admin/Supervisor only)."""
    query = db.query(Attendance).options(
        joinedload(Attendance.employee), joinedload(Attendance.location)
    )

    if current_user.role == "Supervisor":
        if not current_user.location_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supervisor must have a location assigned",
            )
        query = query.filter(Attendance.location_id == current_user.location_id)

    if date:
        query = query.filter(Attendance.date == date)
    if location_id:
        query = query.filter(Attendance.location_id == location_id)
    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)
    if department_id:
        query = query.join(User).filter(User.department_id == department_id)

    total = query.count()
    records = (
        query.order_by(Attendance.date.desc(), Attendance.check_in_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for attendance in records:
        items.append(
            AttendanceResponse(
                id=attendance.id,
                employee_id=attendance.employee_id,
                employee_name=attendance.employee.name
                if attendance.employee
                else "Unknown",
                location_id=attendance.location_id,
                location_name=attendance.location.name
                if attendance.location
                else "Unknown",
                check_in_time=attendance.check_in_time,
                check_out_time=attendance.check_out_time,
                is_late=attendance.is_late,
                late_by_minutes=attendance.late_by_minutes,
                status=attendance.status,
                date=attendance.date,
                distance_from_location_meters=attendance.distance_from_location_meters,
            )
        )

    return AttendanceListResponse(
        items=items, total=total, page=page, page_size=page_size
    )


@router.get("/export")
def export_attendance(
    format: str = Query("excel", enum=["excel", "pdf"]),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    location_id: Optional[int] = Query(None),
    department_id: Optional[int] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Export attendance records to Excel or PDF."""
    if not end_date:
        end_date = datetime.now(timezone.utc).date()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    query = db.query(Attendance).options(
        joinedload(Attendance.employee), joinedload(Attendance.location)
    )

    if location_id:
        query = query.filter(Attendance.location_id == location_id)
    if department_id:
        query = query.join(User).filter(User.department_id == department_id)

    records = (
        query.filter(
            Attendance.date >= start_date,
            Attendance.date <= end_date,
        )
        .order_by(Attendance.date.desc(), Attendance.check_in_time.desc())
        .all()
    )

    if format == "excel":
        return export_to_excel(records, start_date, end_date)
    else:
        return export_to_pdf(records, start_date, end_date)


def export_to_excel(records: List[Attendance], start_date: date, end_date: date):
    try:
        import xlsxwriter
        from io import BytesIO
        from fastapi.responses import StreamingResponse

        output = BytesIO()
        workbook = xlsxwriter.Workbook(output, {"in_memory": True})
        worksheet = workbook.add_worksheet()

        headers = [
            "Date",
            "Employee",
            "Location",
            "Check In",
            "Check Out",
            "Status",
            "Late (mins)",
        ]
        for col, header in enumerate(headers):
            worksheet.write(0, col, header)

        for row, record in enumerate(records, start=1):
            worksheet.write(row, 0, str(record.date))
            worksheet.write(
                row, 1, record.employee.name if record.employee else "Unknown"
            )
            worksheet.write(
                row, 2, record.location.name if record.location else "Unknown"
            )
            worksheet.write(
                row,
                3,
                record.check_in_time.strftime("%H:%M:%S")
                if record.check_in_time
                else "",
            )
            worksheet.write(
                row,
                4,
                record.check_out_time.strftime("%H:%M:%S")
                if record.check_out_time
                else "",
            )
            worksheet.write(row, 5, record.status)
            worksheet.write(row, 6, record.late_by_minutes if record.is_late else 0)

        workbook.close()
        output.seek(0)

        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=attendance_{start_date}_{end_date}.xlsx"
            },
        )
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="xlsxwriter not installed. Run: pip install xlsxwriter",
        )


def export_to_pdf(records: List[Attendance], start_date: date, end_date: date):
    try:
        from io import BytesIO
        from fastapi.responses import StreamingResponse
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter, landscape
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        elements = []
        styles = getSampleStyleSheet()

        elements.append(
            styles["Title"].__call__(f"Attendance Report: {start_date} to {end_date}")
        )

        data = [
            [
                "Date",
                "Employee",
                "Location",
                "Check In",
                "Check Out",
                "Status",
                "Late (mins)",
            ]
        ]
        for record in records:
            data.append(
                [
                    str(record.date),
                    record.employee.name if record.employee else "Unknown",
                    record.location.name if record.location else "Unknown",
                    record.check_in_time.strftime("%H:%M")
                    if record.check_in_time
                    else "-",
                    record.check_out_time.strftime("%H:%M")
                    if record.check_out_time
                    else "-",
                    record.status,
                    str(record.late_by_minutes) if record.is_late else "0",
                ]
            )

        table = Table(data)
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )
        elements.append(table)
        doc.build(elements)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=attendance_{start_date}_{end_date}.pdf"
            },
        )
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="reportlab not installed. Run: pip install reportlab",
        )
