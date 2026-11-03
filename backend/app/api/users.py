from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models import User, UserRole
from app.schemas.user import (
    AdminCreateUserRequest,
    UpdateUserRequest,
    UserListResponse,
    UserResponse,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=UserListResponse)
def list_users(
    q: str | None = Query(default=None, max_length=320),
    role: UserRole | None = None,
    is_active: bool | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    session: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> UserListResponse:
    filters = []
    if q:
        filters.append(User.email.ilike(f"%{q.strip()}%"))
    if role is not None:
        filters.append(User.role == role)
    if is_active is not None:
        filters.append(User.is_active.is_(is_active))

    total = session.scalar(select(func.count(User.id)).where(*filters)) or 0
    users = session.scalars(
        select(User).where(*filters).order_by(User.id).offset(skip).limit(limit)
    ).all()
    return UserListResponse(items=users, total=total, skip=skip, limit=limit)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminCreateUserRequest,
    session: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> User:
    email = str(payload.email).strip().lower()
    if session.scalar(select(User.id).where(User.email == email)) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = User(
        email=email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered") from None
    session.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    session: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> User:
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UpdateUserRequest,
    session: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> User:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No fields to update")
    if "email" in updates:
        if updates["email"] is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Email cannot be null")
        updates["email"] = str(updates["email"]).strip().lower()

    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == admin.id and (
        updates.get("is_active") is False or updates.get("role") == UserRole.USER
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate or demote yourself")
    if "email" in updates:
        duplicate = session.scalar(
            select(User.id).where(User.email == updates["email"], User.id != user_id)
        )
        if duplicate is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    for field, value in updates.items():
        setattr(user, field, value)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered") from None
    session.refresh(user)
    return user


@router.delete("/{user_id}", response_model=UserResponse)
def deactivate_user(
    user_id: int,
    session: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> User:
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate yourself")
    user.is_active = False
    session.commit()
    session.refresh(user)
    return user