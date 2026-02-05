from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine
from app.admin.schemas import DBConnectionRequest, DBConnectionResponse, UnblockUserRequest
from app.db.session import SessionLocal
from app.users.models import User

router = APIRouter(prefix="/admin", tags=["admin"])

# ----------- CONNECT / TEST DATABASE -------------
@router.post("/test-db", response_model=DBConnectionResponse)
def test_database_connection(payload: DBConnectionRequest):
    """Tries to connect to another database to test credentials."""
    try:
        if payload.db_type.lower() == "sqlite":
            engine = create_engine(f"sqlite:///{payload.database}")
        elif payload.db_type.lower() == "postgresql":
            engine = create_engine(
                f"postgresql://{payload.username}:{payload.password}@{payload.host}:{payload.port}/{payload.database}"
            )
        elif payload.db_type.lower() == "mysql":
            engine = create_engine(
                f"mysql+pymysql://{payload.username}:{payload.password}@{payload.host}:{payload.port}/{payload.database}"
            )
        else:
            return {"success": False, "message": "Unsupported DB type"}

        conn = engine.connect()
        conn.close()
        return {"success": True, "message": "Connection successful ✅"}
    except Exception as e:
        return {"success": False, "message": f"Connection failed: {e}"}


# ----------- USER MANAGEMENT -------------
@router.get("/users")
def list_users():
    db = SessionLocal()
    users = db.query(User).all()
    data = [{"id": u.id, "email": u.email, "is_active": u.is_active, "failed_attempts": u.failed_attempts} for u in users]
    return {"users": data}

@router.post("/users/unblock")
def unblock_user(payload: UnblockUserRequest):
    db = SessionLocal()
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    user.failed_attempts = 0
    db.commit()
    return {"message": f"User {user.email} unblocked"}
