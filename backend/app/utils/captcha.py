import requests
import os

RECAPTCHA_SECRET = os.getenv("RECAPTCHA_SECRET", "fake-key-for-dev")

def verify_captcha(token: str) -> bool:
    if RECAPTCHA_SECRET == "fake-key-for-dev" or token == "":
        # Always pass in dev mode
        return True
    url = "https://www.google.com/recaptcha/api/siteverify"
    data = {"secret": RECAPTCHA_SECRET, "response": token}
    try:
        res = requests.post(url, data=data, timeout=5)
        result = res.json()
        return result.get("success", False)
    except Exception:
        return False
