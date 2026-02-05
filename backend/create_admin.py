from app.db.session import SessionLocal, engine, Base
from app.users.models import User
from app.auth.service import hash_password

# Create all tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Tables created!")

db = SessionLocal()

# Check if user already exists
existing_user = db.query(User).filter(User.email == "admin@admin.com").first()
if existing_user:
    print("Admin user already exists!")
else:
    user = User(
        email="admin@admin.com",
        hashed_password=hash_password("password123"),
        phone=None
    )
    db.add(user)
    db.commit()
    print("Admin user created successfully!")
    print("Email: admin@admin.com")
    print("Password: password123")

db.close()