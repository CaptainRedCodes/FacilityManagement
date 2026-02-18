from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.waitlist import Waitlist
from app.schemas.waitlist import WaitlistCreate, WaitlistResponse

router = APIRouter(prefix="/api/v1/waitlist", tags=["waitlist"])


@router.post("", response_model=WaitlistResponse, status_code=status.HTTP_201_CREATED)
async def join_waitlist(waitlist_data: WaitlistCreate, db: Session = Depends(get_db)):
    """
    Join the waitlist by providing an email address.
    """
    existing = db.query(Waitlist).filter(Waitlist.email == waitlist_data.email).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered on waitlist",
        )

    waitlist_entry = Waitlist(email=waitlist_data.email, name=waitlist_data.name)

    db.add(waitlist_entry)
    db.commit()
    db.refresh(waitlist_entry)

    return waitlist_entry


@router.get("/count")
async def get_waitlist_count(db: Session = Depends(get_db)):
    """
    Get total number of waitlist subscribers.
    """
    count = db.query(Waitlist).count()
    return {"count": count}
