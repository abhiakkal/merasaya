from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.routes import router as auth_router
from app.admin.routes import router as admin_router
from app.db.session import engine, Base, SessionLocal
from app.users.models import User
from app.auth.service import hash_password

# Create database tables
Base.metadata.create_all(bind=engine)

# Create default admin user if not exists
try:
    db = SessionLocal()
    existing_admin = db.query(User).filter(User.email == "admin@admin.com").first()
    if not existing_admin:
        admin_user = User(
            email="admin@admin.com",
            hashed_password=hash_password("password123"),
            phone=None
        )
        db.add(admin_user)
        db.commit()
        print("✅ Default admin user created: admin@admin.com / password123")
    db.close()
except Exception as e:
    print(f"Error creating admin user: {e}")

app = FastAPI(title="Merasaya API")

# CORS middleware - MUST be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(admin_router)

@app.get("/")
def root():
    return {"message": "Merasaya API is running"}