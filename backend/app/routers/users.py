import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import (
    verify_password,
    create_access_token,
    get_token_payload,
    hash_password,
)
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    TokenResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """Get the current authenticated user from the JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not authorization or not authorization.startswith("Bearer "):
        raise credentials_exception

    token = authorization.replace("Bearer ", "")
    payload = get_token_payload(token)

    if payload is None:
        raise credentials_exception

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if user.status == "Inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role."""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


def require_supervisor_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require supervisor or admin role."""
    if current_user.role not in ["Admin", "Supervisor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supervisor or Admin privileges required",
        )
    return current_user


def require_supervisor(current_user: User = Depends(get_current_user)) -> User:
    """Require supervisor role."""
    if current_user.role != "Supervisor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supervisor privileges required",
        )
    return current_user


@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login endpoint - returns JWT token."""
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status == "Inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    role_value = user.role if isinstance(user.role, str) else user.role.value
    access_token = create_access_token(data={"sub": str(user.id), "role": role_value})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse.model_validate(current_user)


users_router = APIRouter(prefix="/users", tags=["Users"])


@users_router.get("", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List users based on role:
    - Admin: all users
    - Supervisor: users in same location (required)
    - Employee: only own profile (handled by /me endpoint)
    """
    if current_user.role == "Admin":
        return db.query(User).all()
    elif current_user.role == "Supervisor":
        if not current_user.location_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supervisor must have a location assigned",
            )
        return db.query(User).filter(User.location_id == current_user.location_id).all()
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employees can only view their own profile",
        )


@users_router.get("/supervisors", response_model=List[UserResponse])
def list_supervisors(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List all supervisors (Admin only)."""
    return db.query(User).filter(User.role == "Supervisor").all()


@users_router.get("/employees", response_model=List[UserResponse])
def list_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor_or_admin),
):
    """List employees based on role."""
    if current_user.role == "Admin":
        return db.query(User).filter(User.role == "Employee").all()
    else:
        if not current_user.location_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supervisor must have a location assigned",
            )
        return (
            db.query(User)
            .filter(
                User.role == "Employee", User.location_id == current_user.location_id
            )
            .all()
        )


@users_router.get("/me/employees", response_model=List[UserResponse])
def get_my_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor),
):
    """Get employees under current supervisor."""
    return db.query(User).filter(User.supervisor_id == current_user.id).all()


@users_router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific user by ID."""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if current_user.role == "Employee":
        if current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can only view their own profile",
            )
    elif current_user.role == "Supervisor":
        if not current_user.location_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supervisor must have a location assigned",
            )
        if user.location_id != current_user.location_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this user",
            )

    return UserResponse.model_validate(user)


@users_router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new user based on role permissions."""
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    target_role = (
        user_data.role.value if hasattr(user_data.role, "value") else user_data.role
    )

    if current_user.role == "Admin":
        if target_role == "Admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin cannot create another Admin",
            )
    elif current_user.role == "Supervisor":
        if target_role in ["Admin", "Supervisor"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supervisors can only create Employees",
            )
        if not current_user.location_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supervisor must have a location assigned",
            )
        if user_data.location_id and user_data.location_id != current_user.location_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee must be in the same location as supervisor",
            )
        user_data.location_id = current_user.location_id
        user_data.supervisor_id = current_user.id
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employees cannot create users",
        )

    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=target_role,
        location_id=user_data.location_id,
        department_id=user_data.department_id,
        supervisor_id=user_data.supervisor_id,
        status="Active",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)


@users_router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a user based on role permissions."""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if current_user.role == "Employee":
        if current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can only update their own profile",
            )
    elif current_user.role == "Supervisor":
        if user.role == "Admin" or user.role == "Supervisor":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supervisors cannot update Admin or Supervisor accounts",
            )
        if user.location_id != current_user.location_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this user",
            )

    if user_data.email and user_data.email != user.email:
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    update_data = user_data.model_dump(exclude_unset=True)
    password = update_data.pop("password", None)
    if password:
        user.password_hash = hash_password(password)

    for field, value in update_data.items():
        if field == "role" and hasattr(value, "value"):
            value = value.value
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)


@users_router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deactivate a user based on role permissions."""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if current_user.role == "Employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employees cannot deactivate users",
        )
    elif current_user.role == "Supervisor":
        if user.role == "Admin" or user.role == "Supervisor":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supervisors cannot deactivate Admin or Supervisor accounts",
            )
        if user.location_id != current_user.location_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to deactivate this user",
            )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    user.status = "Inactive"
    db.commit()

    return None
