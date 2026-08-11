import os
import secrets
import hashlib
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session

import models
from database import get_db

load_dotenv()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 30

_env = os.getenv("ENV", "development")
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    if _env == "production":
        raise RuntimeError("JWT_SECRET must be set in production")
    JWT_SECRET = "dev-only-insecure-secret-change-me"
    print("WARNING: JWT_SECRET not set — using an insecure dev default. Set JWT_SECRET in backend/.env.")


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


# In-memory sliding-window rate limiter. Deliberately simple (no Redis) since this
# runs as a single server process — resets on restart, which is fine for its purpose
# (slowing down brute-force login/registration attempts, not perfect abuse tracking).
_rate_limit_hits: dict[str, list[float]] = defaultdict(list)


def rate_limit(request: Request, key_prefix: str, max_attempts: int, window_seconds: int):
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "unknown")
    key = f"{key_prefix}:{ip}"
    now = time.time()
    hits = _rate_limit_hits[key]
    hits[:] = [t for t in hits if now - t < window_seconds]
    if len(hits) >= max_attempts:
        raise HTTPException(status_code=429, detail="Too many attempts. Please wait a few minutes and try again.")
    hits.append(now)


def rate_limit_reset(request: Request, key_prefix: str):
    """Clear the rate-limit counter for this IP on successful auth — so switching
    accounts doesn't burn through the window from previous failed attempts."""
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "unknown")
    _rate_limit_hits[f"{key_prefix}:{ip}"].clear()


def create_access_token(user: models.User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "username": user.username,
        "is_admin": user.is_admin,
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def create_refresh_token(user: models.User, db: Session) -> str:
    raw = secrets.token_urlsafe(48)
    db.add(models.RefreshToken(
        user_id=user.id,
        token_hash=_hash_token(raw),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    ))
    db.commit()
    return raw


def create_token_pair(user: models.User, db: Session) -> dict:
    return {
        "access_token": create_access_token(user),
        "refresh_token": create_refresh_token(user, db),
        "token_type": "bearer",
    }


def verify_refresh_token(raw_token: str, db: Session) -> models.User:
    """Validate + rotate a refresh token (single-use). Returns the owning user."""
    record = db.query(models.RefreshToken).filter(
        models.RefreshToken.token_hash == _hash_token(raw_token)
    ).first()
    now = datetime.now(timezone.utc)
    # SQLite round-trips DateTime(timezone=True) as naive — normalize before comparing.
    expires_at = record.expires_at if record else None
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not record or record.revoked_at is not None or expires_at < now:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user = db.query(models.User).filter(models.User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    record.revoked_at = now
    db.commit()
    return user


def revoke_refresh_token(raw_token: str, db: Session):
    record = db.query(models.RefreshToken).filter(
        models.RefreshToken.token_hash == _hash_token(raw_token)
    ).first()
    if record and record.revoked_at is None:
        record.revoked_at = datetime.now(timezone.utc)
        db.commit()


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return payload


def _user_from_raw_token(token: str, db: Session) -> models.User:
    payload = decode_access_token(token)
    user = db.query(models.User).filter(models.User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> models.User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return _user_from_raw_token(authorization[len("Bearer "):], db)


def get_current_user_optional(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[models.User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return _user_from_raw_token(authorization[len("Bearer "):], db)
    except HTTPException:
        return None


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def user_from_ws_token(token: Optional[str], db: Session) -> Optional[models.User]:
    """Validate a token passed as a WebSocket query param — browsers can't set
    custom headers on a ws:// handshake, so the access token travels as ?token=."""
    if not token:
        return None
    try:
        return _user_from_raw_token(token, db)
    except HTTPException:
        return None
