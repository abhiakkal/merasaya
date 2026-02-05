from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.routes import router as auth_router
from app.admin.routes import router as admin_router

app = FastAPI(title="Merasaya API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Merasaya backend is running 🚀"}

app.include_router(auth_router)
app.include_router(admin_router)
