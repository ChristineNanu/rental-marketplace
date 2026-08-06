from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
import auth
from database import get_db, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Rental Marketplace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",  # RescueMePets already occupies 3000 in local dev
        # Add the production Vercel URL here once deployed.
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# ─── AUTH ────────────────────────────────────────────────────────────────────

@app.post("/register")
def register(user: schemas.UserCreate, request: Request, db: Session = Depends(get_db)):
    auth.rate_limit(request, "register", max_attempts=10, window_seconds=600)
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user = models.User(
        username=user.username,
        email=user.email,
        password=auth.get_password_hash(user.password),
        full_name=user.full_name or "",
        phone=user.phone,
    )
    db.add(db_user)
    db.commit()
    return {"message": "User registered successfully"}


@app.post("/login")
def login(user: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    auth.rate_limit(request, "login", max_attempts=8, window_seconds=900)
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Username not found. Please check your username or register.")
    if not auth.verify_password(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Incorrect password. Please try again.")
    tokens = auth.create_token_pair(db_user, db)
    return {
        "message": "Login successful",
        "user_id": db_user.id,
        "username": db_user.username,
        "is_admin": db_user.is_admin,
        "is_business": db_user.is_business,
        **tokens,
    }


@app.post("/auth/refresh", response_model=schemas.TokenPair)
def refresh(body: schemas.RefreshRequest, db: Session = Depends(get_db)):
    user = auth.verify_refresh_token(body.refresh_token, db)
    return auth.create_token_pair(user, db)


@app.post("/auth/logout")
def logout(body: schemas.RefreshRequest, db: Session = Depends(get_db)):
    auth.revoke_refresh_token(body.refresh_token, db)
    return {"message": "Logged out"}


@app.get("/me")
def me(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_admin": current_user.is_admin,
        "is_business": current_user.is_business,
        "phone_verified": current_user.phone_verified,
        "rating_as_owner": {"avg": current_user.rating_as_owner_avg, "count": current_user.rating_as_owner_count},
        "rating_as_renter": {"avg": current_user.rating_as_renter_avg, "count": current_user.rating_as_renter_count},
    }


# ─── AREAS & CATEGORIES (browse scaffolding for Phase 1) ────────────────────

@app.get("/areas", response_model=list[schemas.AreaOut])
def list_areas(db: Session = Depends(get_db)):
    return db.query(models.Area).all()


@app.get("/categories", response_model=list[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()
