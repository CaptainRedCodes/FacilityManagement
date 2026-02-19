import random
from datetime import datetime, timedelta, timezone, time

from app.core.database import SessionLocal
from app.core.auth import hash_password
from app.models.user import User
from app.models.location import Location
from app.models.department import Department
from app.models.shift import ShiftConfig
from app.models.attendance import Attendance


# -----------------------------
# CONSTANT DATA
# -----------------------------

FIRST_NAMES = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","William","Elizabeth"]
LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez"]

COMPANY_NAMES = [
    "Tech Hub","Innovation Center","Business Park","Corporate Tower",
    "Enterprise Plaza","Solutions Hub","Global Office","Regional HQ",
    "City Campus","Metro Tower",
]

CITIES = [
    "New York","Los Angeles","Chicago","Houston","Phoenix",
    "Philadelphia","San Antonio","San Diego","Dallas","San Jose",
]

DEPARTMENTS = [
    "Engineering","Product","Design","Marketing","Sales",
    "Human Resources","Finance","Operations","Customer Support","IT",
]

SHIFT_CONFIGS = [
    ("Morning Shift", "08:00", "17:00"),
    ("Standard Day", "09:00", "18:00"),
]


# -----------------------------
# ADMIN
# -----------------------------

def seed_admin():
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.role == "Admin").first()
        if admin_exists:
            print("Admin already exists")
            return

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
        print("Admin created")
    finally:
        db.close()


# -----------------------------
# MAIN SEED
# -----------------------------

def seed_dummy_data():
    db = SessionLocal()
    try:
        if db.query(User).filter(User.role == "Employee").count() > 0:
            print("Dummy data already exists. Skipping.")
            return

        print("Seeding optimized dummy data...")

        locations = create_locations(db)
        departments = create_departments(db)
        shifts = create_shifts(db, locations)
        supervisors = create_supervisors(db, locations, departments)
        employees = create_employees(db, locations, departments, supervisors)
        create_attendance(db, employees, days=30)

        print("Seeding complete.")

    except Exception as e:
        db.rollback()
        print("Seeding failed:", e)
    finally:
        db.close()


# -----------------------------
# LOCATIONS
# -----------------------------

def create_locations(db):
    existing = {l.name: l for l in db.query(Location).all()}
    new_locations = []

    for name, city in zip(COMPANY_NAMES, CITIES):
        if name in existing:
            continue

        new_locations.append(
            Location(
                name=name,
                address=f"{random.randint(100,9999)} Main St",
                city=city,
                latitude=40.7128 + random.uniform(-0.5, 0.5),
                longitude=-74.0060 + random.uniform(-0.5, 0.5),
                allowed_radius_meters=150,
                is_active=True,
            )
        )

    db.bulk_save_objects(new_locations)
    db.commit()

    return db.query(Location).all()


# -----------------------------
# DEPARTMENTS
# -----------------------------

def create_departments(db):
    existing = {d.name: d for d in db.query(Department).all()}
    new_departments = []

    for name in DEPARTMENTS:
        if name in existing:
            continue

        new_departments.append(
            Department(
                name=name,
                description=f"{name} Department",
                is_active=True,
            )
        )

    db.bulk_save_objects(new_departments)
    db.commit()

    return db.query(Department).all()


# -----------------------------
# SHIFTS
# -----------------------------

def create_shifts(db, locations):
    existing = {s.location_id for s in db.query(ShiftConfig).all()}
    new_shifts = []

    for location in locations:
        if location.id in existing:
            continue

        shift_name, start, end = random.choice(SHIFT_CONFIGS)

        new_shifts.append(
            ShiftConfig(
                location_id=location.id,
                shift_name=shift_name,
                start_time=datetime.strptime(start,"%H:%M").time(),
                end_time=datetime.strptime(end,"%H:%M").time(),
                grace_period_minutes=15,
            )
        )

    db.bulk_save_objects(new_shifts)
    db.commit()

    return db.query(ShiftConfig).all()


# -----------------------------
# SUPERVISORS
# -----------------------------

def create_supervisors(db, locations, departments):
    existing_emails = {u.email for u in db.query(User.email).all()}
    supervisors = []

    for i in range(15):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        email = f"{first.lower()}.{last.lower()}{i}@worksight.com"

        if email in existing_emails:
            continue

        supervisors.append(
            User(
                name=f"{first} {last}",
                email=email,
                password_hash=hash_password("password123"),
                role="Supervisor",
                location_id=random.choice(locations).id,
                department_id=random.choice(departments).id,
                status="Active",
            )
        )

    db.bulk_save_objects(supervisors)
    db.commit()

    return db.query(User).filter(User.role=="Supervisor").all()


# -----------------------------
# EMPLOYEES
# -----------------------------

def create_employees(db, locations, departments, supervisors):
    existing_emails = {u.email for u in db.query(User.email).all()}
    employees = []

    for i in range(150):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        email = f"{first.lower()}.{last.lower()}{i}@worksight.com"

        if email in existing_emails:
            continue

        location = random.choice(locations)
        supervisor = random.choice(supervisors)

        employees.append(
            User(
                name=f"{first} {last}",
                email=email,
                password_hash=hash_password("password123"),
                role="Employee",
                location_id=location.id,
                department_id=random.choice(departments).id,
                supervisor_id=supervisor.id,
                status="Active",
            )
        )

    db.bulk_save_objects(employees)
    db.commit()

    return db.query(User).filter(User.role=="Employee").all()


# -----------------------------
# ATTENDANCE (HEAVY OPTIMIZED)
# -----------------------------

def create_attendance(db, employees, days=30):
    today = datetime.now(timezone.utc).date()

    locations = {l.id: l for l in db.query(Location).all()}
    shifts = {s.location_id: s for s in db.query(ShiftConfig).all()}

    existing = {
        (a.employee_id, a.date)
        for a in db.query(Attendance.employee_id, Attendance.date).all()
    }

    attendance_bulk = []

    for employee in employees:
        location = locations.get(employee.location_id)
        if not location:
            continue

        shift = shifts.get(location.id)
        shift_start = shift.start_time if shift else time(9, 0)

        for day_offset in range(days):
            date_val = today - timedelta(days=day_offset)

            if (employee.id, date_val) in existing:
                continue

            if random.random() < 0.15:
                continue

            base = datetime.combine(date_val, shift_start, tzinfo=timezone.utc)

            check_in = base + timedelta(minutes=random.randint(-10, 30))
            check_out = check_in + timedelta(hours=8)

            attendance_bulk.append(
                Attendance(
                    employee_id=employee.id,
                    location_id=location.id,
                    check_in_time=check_in,
                    check_out_time=check_out,
                    check_in_latitude=location.latitude,
                    check_in_longitude=location.longitude,
                    distance_from_location_meters=random.uniform(0,50),
                    is_late=False,
                    late_by_minutes=0,
                    status="checked_out",
                    date=date_val,
                )
            )

    db.bulk_save_objects(attendance_bulk)
    db.commit()

    print(f"Inserted {len(attendance_bulk)} attendance records.")
