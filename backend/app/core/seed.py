import random
from datetime import datetime, timedelta, date, time, timezone

from app.core.database import SessionLocal
from app.core.auth import hash_password
from app.models.user import User
from app.models.location import Location
from app.models.department import Department
from app.models.shift import ShiftConfig
from app.models.attendance import Attendance


FIRST_NAMES = [
    "James",
    "Mary",
    "John",
    "Patricia",
    "Robert",
    "Jennifer",
    "Michael",
    "Linda",
    "William",
    "Elizabeth",
    "David",
    "Barbara",
    "Richard",
    "Susan",
    "Joseph",
    "Jessica",
    "Thomas",
    "Sarah",
    "Charles",
    "Karen",
    "Christopher",
    "Lisa",
    "Daniel",
    "Nancy",
    "Matthew",
    "Betty",
    "Anthony",
    "Margaret",
    "Mark",
    "Sandra",
    "Donald",
    "Ashley",
    "Steven",
    "Kimberly",
    "Paul",
    "Emily",
    "Andrew",
    "Donna",
    "Joshua",
    "Michelle",
    "Kenneth",
    "Dorothy",
    "Kevin",
    "Carol",
    "Brian",
    "Amanda",
    "George",
    "Melissa",
    "Edward",
    "Deborah",
    "Ronald",
    "Stephanie",
    "Timothy",
    "Rebecca",
    "Jason",
    "Sharon",
    "Jeffrey",
    "Laura",
    "Ryan",
    "Cynthia",
    "Jacob",
    "Kathleen",
    "Gary",
    "Amy",
    "Nicholas",
    "Angela",
    "Eric",
    "Shirley",
    "Jonathan",
    "Anna",
    "Stephen",
    "Brenda",
    "Larry",
    "Pamela",
    "Justin",
    "Emma",
    "Scott",
    "Nicole",
    "Brandon",
    "Helen",
    "Benjamin",
    "Samantha",
    "Samuel",
    "Katherine",
    "Raymond",
    "Christine",
    "Gregory",
    "Debra",
    "Frank",
    "Rachel",
    "Catherine",
    "Patrick",
    "Carolyn",
    "Jack",
    "Janet",
]

LAST_NAMES = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson",
    "White",
    "Harris",
    "Sanchez",
    "Clark",
    "Ramirez",
    "Lewis",
    "Robinson",
    "Walker",
    "Young",
    "Allen",
    "King",
    "Wright",
    "Scott",
    "Torres",
    "Nguyen",
    "Hill",
    "Flores",
    "Green",
    "Adams",
    "Nelson",
    "Baker",
    "Hall",
    "Rivera",
    "Campbell",
    "Mitchell",
    "Carter",
    "Roberts",
    "Gomez",
    "Phillips",
    "Evans",
    "Turner",
    "Diaz",
    "Parker",
    "Cruz",
    "Edwards",
    "Collins",
    "Reyes",
    "Stewart",
    "Morris",
    "Morales",
    "Murphy",
    "Cook",
    "Rogers",
    "Gutierrez",
    "Ortiz",
    "Morgan",
    "Cooper",
    "Peterson",
    "Bailey",
    "Reed",
    "Kelly",
    "Howard",
    "Ramos",
    "Kim",
    "Cox",
    "Ward",
    "Richardson",
]

COMPANY_NAMES = [
    "Tech Hub",
    "Innovation Center",
    "Business Park",
    "Corporate Tower",
    "Enterprise Plaza",
    "Solutions Hub",
    "Global Office",
    "Regional HQ",
    "City Campus",
    "Metro Tower",
]

CITIES = [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "Philadelphia",
    "San Antonio",
    "San Diego",
    "Dallas",
    "San Jose",
    "Austin",
    "Jacksonville",
    "Fort Worth",
    "Columbus",
    "Charlotte",
    "Seattle",
    "Denver",
    "Boston",
    "Nashville",
    "Portland",
]

DEPARTMENTS = [
    "Engineering",
    "Product",
    "Design",
    "Marketing",
    "Sales",
    "Human Resources",
    "Finance",
    "Operations",
    "Customer Support",
    "Legal",
    "Research",
    "Quality Assurance",
    "IT",
    "Security",
    "Administration",
]

SHIFT_CONFIGS = [
    ("Morning Shift", "08:00", "17:00"),
    ("Afternoon Shift", "12:00", "21:00"),
    ("Night Shift", "20:00", "05:00"),
    ("Standard Day", "09:00", "18:00"),
    ("Flex Shift", "07:00", "16:00"),
]


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


def seed_dummy_data():
    """Seed dummy data if database is empty. Only runs once."""
    db = SessionLocal()
    try:
        existing_employees = db.query(User).filter(User.role == "Employee").count()
        if existing_employees > 0:
            print(
                f"Dummy data already exists ({existing_employees} employees), skipping seed."
            )
            return

        print("Seeding dummy data...")

        locations = _create_locations(db)
        departments = _create_departments(db)
        shifts = _create_shifts(db, locations)
        supervisors = _create_supervisors(db, locations, departments)
        employees = _create_employees(db, locations, departments, supervisors)
        _create_attendance_records(db, employees, days=30)

        print("Dummy data seeding completed!")
        print(f"  - Locations: {len(locations)}")
        print(f"  - Departments: {len(departments)}")
        print(f"  - Shifts: {len(shifts)}")
        print(f"  - Supervisors: {len(supervisors)}")
        print(f"  - Employees: {len(employees)}")
        print(f"  - Admin: admin@worksight.com / password123")

    except Exception as e:
        print(f"Error seeding dummy data: {e}")
        db.rollback()
    finally:
        db.close()


def _create_locations(db: SessionLocal):
    locations = []
    for name, city in zip(COMPANY_NAMES[:10], CITIES[:10]):
        existing = db.query(Location).filter(Location.name == name).first()
        if existing:
            locations.append(existing)
            continue

        location = Location(
            name=name,
            address=f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Maple', 'Pine', 'Cedar', 'Elm'])} {random.choice(['St', 'Ave', 'Blvd', 'Rd'])}",
            city=city,
            latitude=40.7128 + random.uniform(-0.5, 0.5),
            longitude=-74.0060 + random.uniform(-0.5, 0.5),
            allowed_radius_meters=random.choice([100, 150, 200, 250]),
            is_active=True,
        )
        db.add(location)
        locations.append(location)

    db.commit()
    for loc in locations:
        db.refresh(loc)
    return locations


def _create_departments(db: SessionLocal):
    departments = []
    for name in DEPARTMENTS:
        existing = db.query(Department).filter(Department.name == name).first()
        if existing:
            departments.append(existing)
            continue

        department = Department(
            name=name,
            description=f"Department focused on {name.lower()} activities",
            is_active=True,
        )
        db.add(department)
        departments.append(department)

    db.commit()
    for dept in departments:
        db.refresh(dept)
    return departments


def _create_shifts(db: SessionLocal, locations: list[Location]):
    shifts = []
    for location in locations:
        existing = (
            db.query(ShiftConfig).filter(ShiftConfig.location_id == location.id).first()
        )
        if existing:
            shifts.append(existing)
            continue

        shift_name, start, end = random.choice(SHIFT_CONFIGS)
        start_time = datetime.strptime(start, "%H:%M").time()
        end_time = datetime.strptime(end, "%H:%M").time()

        shift = ShiftConfig(
            location_id=location.id,
            shift_name=shift_name,
            start_time=start_time,
            end_time=end_time,
            grace_period_minutes=random.choice([10, 15, 20, 30]),
        )
        db.add(shift)
        shifts.append(shift)

    db.commit()
    for shift in shifts:
        db.refresh(shift)
    return shifts


def _create_supervisors(
    db: SessionLocal, locations: list[Location], departments: list[Department]
):
    supervisors = []
    num_supervisors = min(len(locations) * 2, 20)

    for i in range(num_supervisors):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        email = f"{first.lower()}.{last.lower()}{i}@worksight.com"

        existing = db.query(User).filter(User.email == email).first()
        if existing:
            supervisors.append(existing)
            continue

        supervisor = User(
            name=f"{first} {last}",
            email=email,
            password_hash=hash_password("password123"),
            role="Supervisor",
            location_id=random.choice(locations).id,
            department_id=random.choice(departments).id,
            status="Active",
        )
        db.add(supervisor)
        supervisors.append(supervisor)

    db.commit()
    for sup in supervisors:
        db.refresh(sup)
    return supervisors


def _create_employees(
    db: SessionLocal,
    locations: list[Location],
    departments: list[Department],
    supervisors: list[User],
):
    employees = []
    num_employees = 150

    for i in range(num_employees):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        email = f"{first.lower()}.{last.lower()}{i}@worksight.com"

        existing = db.query(User).filter(User.email == email).first()
        if existing:
            employees.append(existing)
            continue

        location = random.choice(locations)
        supervisor = random.choice(
            [s for s in supervisors if s.location_id == location.id] or supervisors
        )

        employee = User(
            name=f"{first} {last}",
            email=email,
            password_hash=hash_password("password123"),
            role="Employee",
            location_id=location.id,
            department_id=random.choice(departments).id,
            supervisor_id=supervisor.id if supervisor else None,
            status="Active",
        )
        db.add(employee)
        employees.append(employee)

    db.commit()
    for emp in employees:
        db.refresh(emp)
    return employees


def _create_attendance_records(db: SessionLocal, employees: list[User], days: int = 30):
    created_count = 0
    today = datetime.now(timezone.utc).date()

    for employee in employees:
        location = (
            db.query(Location).filter(Location.id == employee.location_id).first()
        )
        if not location:
            continue

        lat = location.latitude or 40.7128
        lng = location.longitude or -74.0060

        for day_offset in range(days):
            attendance_date = today - timedelta(days=day_offset)

            existing = (
                db.query(Attendance)
                .filter(
                    Attendance.employee_id == employee.id,
                    Attendance.date == attendance_date,
                )
                .first()
            )

            if existing:
                continue

            if random.random() < 0.15:
                continue

            shift = (
                db.query(ShiftConfig)
                .filter(ShiftConfig.location_id == location.id)
                .first()
            )
            if not shift:
                shift_start = time(9, 0)
            else:
                shift_start = shift.start_time

            base_check_in = datetime.combine(
                attendance_date, shift_start, tzinfo=timezone.utc
            )

            is_late = random.random() < 0.15
            late_minutes = random.randint(1, 60) if is_late else 0

            check_in = base_check_in + timedelta(
                minutes=late_minutes + random.randint(-10, 30)
            )

            if random.random() < 0.7:
                shift_duration = timedelta(hours=8, minutes=random.randint(-30, 60))
                check_out = check_in + shift_duration
                status = "checked_out"
            else:
                check_out = None
                status = "present"

            attendance = Attendance(
                employee_id=employee.id,
                location_id=location.id,
                check_in_time=check_in,
                check_out_time=check_out,
                check_in_latitude=lat + random.uniform(-0.001, 0.001),
                check_in_longitude=lng + random.uniform(-0.001, 0.001),
                distance_from_location_meters=random.uniform(0, 50),
                is_late=is_late,
                late_by_minutes=late_minutes,
                status=status,
                date=attendance_date,
            )
            db.add(attendance)
            created_count += 1

    db.commit()
    print(f"Created {created_count} attendance records")
