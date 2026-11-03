from getpass import getpass

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import User, UserRole


def create_admin_account(email: str, password: str, session: Session) -> bool:
    normalized_email = str(TypeAdapter(EmailStr).validate_python(email)).strip().lower()
    if not 12 <= len(password) <= 128:
        raise ValueError("Password must be between 12 and 128 characters.")
    if session.scalar(select(User.id).where(User.email == normalized_email)) is not None:
        return False

    session.add(
        User(
            email=normalized_email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
        )
    )
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        return False
    return True


def main() -> int:
    email = input("Administrator email: ").strip()
    password = getpass("Administrator password (12+ characters): ")
    confirmation = getpass("Confirm password: ")
    if password != confirmation:
        print("Passwords do not match.")
        return 1

    try:
        with SessionLocal() as session:
            created = create_admin_account(email, password, session)
    except (ValidationError, ValueError) as error:
        print(error)
        return 1

    if not created:
        print("An account with that email already exists.")
        return 1
    print(f"Administrator account created for {email.strip().lower()}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())