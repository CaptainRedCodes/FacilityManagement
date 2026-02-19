from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.routers.users import require_admin, require_supervisor_or_admin
from app.models.user import User
from app.models.location import Location
from app.models.shift import ShiftConfig
from app.schemas.shift import ShiftConfigCreate, ShiftConfigUpdate, ShiftConfigResponse

router = APIRouter(prefix="/shifts", tags=["Shifts"])


@router.get("", response_model=List[ShiftConfigResponse])
def list_shifts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor_or_admin),
):
    """List all shift configurations (Admin/Supervisor)."""
    shifts = db.query(ShiftConfig).all()

    result = []
    for shift in shifts:
        location = db.query(Location).filter(Location.id == shift.location_id).first()
        result.append(
            ShiftConfigResponse(
                id=shift.id,
                location_id=shift.location_id,
                location_name=location.name if location else "Unknown",
                shift_name=shift.shift_name,
                start_time=shift.start_time,
                end_time=shift.end_time,
                grace_period_minutes=shift.grace_period_minutes,
                created_at=shift.created_at,
            )
        )

    return result


@router.get("/{shift_id}", response_model=ShiftConfigResponse)
def get_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor_or_admin),
):
    """Get a specific shift configuration (Admin/Supervisor)."""
    shift = db.query(ShiftConfig).filter(ShiftConfig.id == shift_id).first()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found",
        )

    location = db.query(Location).filter(Location.id == shift.location_id).first()

    return ShiftConfigResponse(
        id=shift.id,
        location_id=shift.location_id,
        location_name=location.name if location else "Unknown",
        shift_name=shift.shift_name,
        start_time=shift.start_time,
        end_time=shift.end_time,
        grace_period_minutes=shift.grace_period_minutes,
        created_at=shift.created_at,
    )


@router.post(
    "", response_model=ShiftConfigResponse, status_code=status.HTTP_201_CREATED
)
def create_shift(
    shift_data: ShiftConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Create a new shift configuration (Admin only)."""
    location = db.query(Location).filter(Location.id == shift_data.location_id).first()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location not found",
        )

    existing = (
        db.query(ShiftConfig)
        .filter(ShiftConfig.location_id == shift_data.location_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shift configuration already exists for this location. Use PUT to update.",
        )

    shift = ShiftConfig(
        location_id=shift_data.location_id,
        shift_name=shift_data.shift_name,
        start_time=shift_data.start_time,
        end_time=shift_data.end_time,
        grace_period_minutes=shift_data.grace_period_minutes,
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)

    return ShiftConfigResponse(
        id=shift.id,
        location_id=shift.location_id,
        location_name=location.name,
        shift_name=shift.shift_name,
        start_time=shift.start_time,
        end_time=shift.end_time,
        grace_period_minutes=shift.grace_period_minutes,
        created_at=shift.created_at,
    )


@router.put("/{shift_id}", response_model=ShiftConfigResponse)
def update_shift(
    shift_id: int,
    shift_data: ShiftConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update a shift configuration (Admin only)."""
    shift = db.query(ShiftConfig).filter(ShiftConfig.id == shift_id).first()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found",
        )

    update_data = shift_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shift, field, value)

    db.commit()
    db.refresh(shift)

    location = db.query(Location).filter(Location.id == shift.location_id).first()

    return ShiftConfigResponse(
        id=shift.id,
        location_id=shift.location_id,
        location_name=location.name if location else "Unknown",
        shift_name=shift.shift_name,
        start_time=shift.start_time,
        end_time=shift.end_time,
        grace_period_minutes=shift.grace_period_minutes,
        created_at=shift.created_at,
    )


@router.delete("/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Delete a shift configuration (Admin only)."""
    shift = db.query(ShiftConfig).filter(ShiftConfig.id == shift_id).first()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found",
        )

    db.delete(shift)
    db.commit()
    return None
