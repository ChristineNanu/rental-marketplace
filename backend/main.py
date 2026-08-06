from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload

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


# ─── LISTINGS ────────────────────────────────────────────────────────────────

def _listing_query(db: Session):
    return db.query(models.Listing).options(
        joinedload(models.Listing.owner),
        joinedload(models.Listing.category),
        joinedload(models.Listing.area),
    )


@app.get("/listings", response_model=list[schemas.ListingOut])
def browse_listings(
    category_id: Optional[int] = None,
    area_id: Optional[int] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = _listing_query(db).filter(models.Listing.status == "active")
    if category_id is not None:
        query = query.filter(models.Listing.category_id == category_id)
    if area_id is not None:
        query = query.filter(models.Listing.area_id == area_id)
    if q:
        query = query.filter(models.Listing.title.ilike(f"%{q}%"))
    return query.order_by(models.Listing.created_at.desc()).all()


@app.get("/my-listings", response_model=list[schemas.ListingOut])
def my_listings(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return _listing_query(db).filter(
        models.Listing.owner_id == current_user.id,
        models.Listing.status != "deleted",
    ).order_by(models.Listing.created_at.desc()).all()


@app.get("/listings/{listing_id}", response_model=schemas.ListingOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = _listing_query(db).filter(models.Listing.id == listing_id).first()
    if not listing or listing.status == "deleted":
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@app.post("/listings", response_model=schemas.ListingOut)
def create_listing(body: schemas.ListingCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if not db.query(models.Category).filter(models.Category.id == body.category_id).first():
        raise HTTPException(status_code=400, detail="Invalid category")
    if not db.query(models.Area).filter(models.Area.id == body.area_id).first():
        raise HTTPException(status_code=400, detail="Invalid area")
    listing = models.Listing(owner_id=current_user.id, **body.model_dump())
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return _listing_query(db).filter(models.Listing.id == listing.id).first()


def _get_owned_listing(listing_id: int, current_user: models.User, db: Session) -> models.Listing:
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing or listing.status == "deleted":
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")
    return listing


@app.patch("/listings/{listing_id}", response_model=schemas.ListingOut)
def update_listing(listing_id: int, body: schemas.ListingUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    listing = _get_owned_listing(listing_id, current_user, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(listing, field, value)
    db.commit()
    return _listing_query(db).filter(models.Listing.id == listing.id).first()


@app.delete("/listings/{listing_id}")
def delete_listing(listing_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    listing = _get_owned_listing(listing_id, current_user, db)
    listing.status = "deleted"
    listing.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Listing removed"}


# ─── BOOKINGS ────────────────────────────────────────────────────────────────

def _booking_query(db: Session):
    return db.query(models.Booking).options(
        joinedload(models.Booking.renter),
        joinedload(models.Booking.listing).joinedload(models.Listing.owner),
        joinedload(models.Booking.listing).joinedload(models.Listing.category),
        joinedload(models.Booking.listing).joinedload(models.Listing.area),
    )


@app.post("/listings/{listing_id}/bookings", response_model=schemas.BookingOut)
def request_booking(listing_id: int, body: schemas.BookingCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing or listing.status != "active":
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You can't book your own listing")

    start_date, end_date = body.start_date, body.end_date
    if start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)
    if end_date.tzinfo is None:
        end_date = end_date.replace(tzinfo=timezone.utc)
    if end_date <= start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")
    if start_date < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Start date can't be in the past")

    days = max(1, (end_date - start_date).days)
    booking = models.Booking(
        listing_id=listing.id,
        renter_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        total_price=days * listing.price_per_day,
        deposit_amount=listing.deposit_amount,
        status="requested",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return _booking_query(db).filter(models.Booking.id == booking.id).first()


@app.get("/my-bookings", response_model=list[schemas.BookingOut])
def my_bookings(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return _booking_query(db).filter(
        models.Booking.renter_id == current_user.id
    ).order_by(models.Booking.created_at.desc()).all()


@app.get("/listings/{listing_id}/bookings", response_model=list[schemas.BookingOut])
def listing_bookings(listing_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    _get_owned_listing(listing_id, current_user, db)
    return _booking_query(db).filter(
        models.Booking.listing_id == listing_id
    ).order_by(models.Booking.created_at.desc()).all()


_ALLOWED_TRANSITIONS = {
    "requested": {"accepted", "declined", "cancelled"},
    "accepted": {"cancelled", "completed"},
}


@app.patch("/bookings/{booking_id}", response_model=schemas.BookingOut)
def update_booking_status(booking_id: int, body: schemas.BookingStatusUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    booking = db.query(models.Booking).options(joinedload(models.Booking.listing)).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    is_owner = booking.listing.owner_id == current_user.id
    is_renter = booking.renter_id == current_user.id
    if not is_owner and not is_renter:
        raise HTTPException(status_code=403, detail="Not part of this booking")

    new_status = body.status
    if new_status not in _ALLOWED_TRANSITIONS.get(booking.status, set()):
        raise HTTPException(status_code=400, detail=f"Can't move booking from {booking.status} to {new_status}")

    # Only the owner accepts/declines a request; either side can cancel; owner marks completed.
    if new_status in {"accepted", "declined", "completed"} and not is_owner:
        raise HTTPException(status_code=403, detail="Only the listing owner can do that")

    booking.status = new_status
    db.commit()
    return _booking_query(db).filter(models.Booking.id == booking.id).first()
