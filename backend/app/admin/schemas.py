from pydantic import BaseModel
from typing import Optional

class DBConnectionRequest(BaseModel):
    db_type: str
    host: str
    port: int
    username: str
    password: str
    database: str = ""

class DBConnectionResponse(BaseModel):
    success: bool
    message: str

class UnblockUserRequest(BaseModel):
    user_id: int
