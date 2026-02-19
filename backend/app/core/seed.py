from app.core.database import SessionLocal
from app.core.auth import hash_password
from app.models.user import User


def seed_admin():
    """Seed default admin user if not exists."""
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.role == "Admin").first()
        if not admin_exists:
            from app.core.config import settings

            admin = User(
                name=settings.DEFAULT_ADMIN_NAME,
                email=settings.DEFAULT_ADMIN_EMAIL,
                password_hash=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
                role="Admin",
                status="Active",
            )
            db.add(admin)
            db.commit()
            print(f"Default admin created: {settings.DEFAULT_ADMIN_EMAIL}")
        else:
            print("Admin already exists, skipping seed.")
    finally:
        db.close()
