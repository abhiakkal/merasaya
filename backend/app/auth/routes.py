from fastapi import APIRouter, HTTPException, Query
from jose import jwt, JWTError
from datetime import datetime
import pyotp
import secrets
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import traceback

from app.auth.schemas import LoginRequest, LoginResponse
from app.auth.service import verify_password, create_access_token, hash_password
from app.db.session import SessionLocal
from app.users.models import User
from app.utils.email_sender import send_email
from app.utils.sms_sender import send_sms
from app.utils.captcha import verify_captcha

SECRET_KEY = "change_this_to_real_secret"
ALGORITHM = "HS256"

# Store CAPTCHA and 2FA codes temporarily (in production use Redis)
captcha_store = {}

router = APIRouter(prefix="/auth", tags=["auth"])

# ------------------- CAPTCHA -------------------
@router.get("/captcha")
def get_captcha():
    """Generate a simple CAPTCHA image."""
    try:
        # Generate random 6-digit code
        code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        token = secrets.token_urlsafe(16)
        
        # Store it temporarily
        captcha_store[token] = code
        
        # Create image
        img = Image.new('RGB', (200, 80), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        
        # Draw the code
        try:
            font = ImageFont.truetype("arial.ttf", 40)
        except:
            font = ImageFont.load_default()
        
        draw.text((20, 20), code, fill=(0, 0, 0), font=font)
        
        # Add some noise lines
        for _ in range(5):
            x1 = secrets.randbelow(200)
            y1 = secrets.randbelow(80)
            x2 = secrets.randbelow(200)
            y2 = secrets.randbelow(80)
            draw.line([(x1, y1), (x2, y2)], fill=(200, 200, 200), width=2)
        
        # Convert to base64
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return {"image": img_str, "token": token}
    except Exception as e:
        print(f"CAPTCHA Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ------------------- LOGIN -------------------
@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, captcha_token: str = Query(default="")):
    """Standard login with CAPTCHA + failed login protection."""
    try:
        print(f"\n=== LOGIN ATTEMPT ===")
        print(f"Email: {payload.email}")
        
        db = SessionLocal()
        user = db.query(User).filter(User.email == payload.email).first()

        if not user:
            print(f"User not found: {payload.email}")
            raise HTTPException(status_code=400, detail="Invalid credentials")

        # Check if account is disabled
        if not user.is_active:
            print(f"Account disabled: {payload.email}")
            raise HTTPException(status_code=403, detail="Account disabled")

        # Password check
        print(f"Verifying password...")
        if not verify_password(payload.password, user.hashed_password):
            user.failed_attempts += 1
            db.commit()
            print(f"Invalid password. Failed attempts: {user.failed_attempts}")
            if user.failed_attempts >= 5:
                user.is_active = False
                db.commit()
                raise HTTPException(status_code=403, detail="Account disabled after 5 failed attempts")
            raise HTTPException(status_code=400, detail="Invalid credentials")

        # Correct password - reset failed attempts
        user.failed_attempts = 0
        db.commit()
        print(f"Password verified successfully!")

        # Generate 2FA code
        totp_secret = pyotp.random_base32()
        code = pyotp.TOTP(totp_secret).now()
        
        # Store the code temporarily for verification
        captcha_store[f"2fa_{user.email}"] = code
        
        print(f"\n🔐 2FA CODE FOR {user.email}: {code}")
        print(f"(Copy this code from the terminal)\n")
        
        if user.phone:
            send_sms(user.phone, f"Your Merasaya 2FA code: {code}")
        else:
            send_email(user.email, "Merasaya 2FA Code", f"Your login code is {code}")

        db.close()
        print("===================\n")
        return {"access_token": "", "token_type": "2fa_pending"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ------------------- VERIFY 2FA -------------------
@router.post("/verify-2fa", response_model=LoginResponse)
def verify_2fa(email: str = Query(...), code: str = Query(...)):
    """Verifies a 6‑digit code that was sent to email or phone."""
    try:
        print(f"\n=== 2FA VERIFICATION ===")
        print(f"Email: {email}")
        print(f"Code received: {code}")
        print(f"Code length: {len(code.strip())}")
        
        if len(code.strip()) != 6:
            print(f"Invalid code length: {len(code.strip())}")
            raise HTTPException(status_code=400, detail="Invalid verification code format")
        
        # Check stored code
        stored_code = captcha_store.get(f"2fa_{email}")
        print(f"Stored code: {stored_code}")
        print(f"Codes match: {stored_code == code}")
        
        if not stored_code:
            print("❌ No stored code found!")
            raise HTTPException(status_code=400, detail="No verification code found. Please login again.")
        
        if stored_code != code:
            print(f"❌ Code mismatch! Stored: {stored_code}, Received: {code}")
            raise HTTPException(status_code=400, detail="Invalid verification code")
        
        # Clean up
        del captcha_store[f"2fa_{email}"]
        print("✅ Code verified successfully!")
        
        # Get user info
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        token = create_access_token({"sub": email})
        print(f"Token created: {token[:30]}...")
        db.close()
        
        response_data = {
            "access_token": token, 
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "is_admin": user.email.endswith("@admin.com")
            }
        }
        print(f"Returning user data: {response_data['user']}")
        print("========================\n")
        
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"2FA error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ------------------- PASSWORD RESET -------------------
@router.post("/request-password-reset")
def request_password_reset(email: str = Query(...)):
    """Send password reset link via email."""
    try:
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        token = create_access_token({"sub": user.email}, expires_minutes=15)
        reset_link = f"http://localhost:3000/reset?token={token}"
        send_email(user.email, "Reset your Merasaya password",
                   f"Click the link to reset: {reset_link}")
        db.close()
        return {"message": "Password reset email sent"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Password reset error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset-password")
def reset_password(token: str = Query(...), new_password: str = Query(...)):
    """Accepts reset token and sets new password."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    try:
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.hashed_password = hash_password(new_password)
        db.commit()
        db.close()
        return {"message": "Password reset successful"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Reset password error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))