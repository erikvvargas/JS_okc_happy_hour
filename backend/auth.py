import os
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, Header

ALGORITHM = "HS256"

def _secret():
    s = os.getenv("JWT_SECRET")
    if not s:
        raise RuntimeError("Missing JWT_SECRET env var")
    return s

def create_token() -> str:
    exp_min = int(os.getenv("JWT_EXPIRES_MINUTES", "1440"))
    payload = {
        "sub": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=exp_min),
    }
    return jwt.encode(payload, _secret(), algorithm=ALGORITHM)

def require_admin(authorization: str = Header(default="")):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(token, _secret(), algorithms=[ALGORITHM])
        if payload.get("sub") != "admin":
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    return True
