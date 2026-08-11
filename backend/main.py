import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import case
from sqlalchemy.orm import Session, joinedload

import models
import schemas
import auth
from daraja import stk_push, query_stk_status, b2c_payout
from database import get_db, engine

models.Base.metadata.create_all(bind=engine)

# ─── STARTUP: seed admin account if none exists ───────────────────────────────
def _seed_admin():
    db = next(get_db())
    try:
        if not db.query(models.User).filter(models.User.is_admin == True).first():  # noqa: E712
            db.add(models.User(
                username="admin",
                email="admin@rentitnairobi.local",
                password=auth.get_password_hash("admin1234"),
                full_name="Admin",
                is_admin=True,
            ))
            db.commit()
            print("Admin account seeded: username=admin password=admin1234")
    finally:
        db.close()

_seed_admin()

# ─── MONETIZATION CONSTANTS ───────────────────────────────────────────────────
COMMISSION_RATE = 0.12  # platform's cut of the rental fee (not the deposit) on each booking
FEATURE_PRICE_KES = 200
FEATURE_DAYS = 7
PLAN_PRICES = {"pro": 1000, "premium": 2500}  # KES/month

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
    # SQLite stores DateTime(timezone=True) values as naive — bind a naive UTC
    # timestamp here so the comparison matches what's actually on disk.
    now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
    featured_rank = case(
        (models.Listing.featured_until > now_naive, 0),
        else_=1,
    )
    return query.order_by(featured_rank, models.Listing.created_at.desc()).all()


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

    # Check for overlapping accepted/requested bookings on the same listing
    overlap = db.query(models.Booking).filter(
        models.Booking.listing_id == listing.id,
        models.Booking.status.in_(["requested", "accepted"]),
        models.Booking.start_date < end_date,
        models.Booking.end_date > start_date,
    ).first()
    if overlap:
        raise HTTPException(status_code=409, detail="These dates overlap with an existing booking request")

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

    if new_status == "completed" and booking.payment_status != "paid":
        raise HTTPException(status_code=400, detail="Can't complete a booking that hasn't been paid for yet")

    booking.status = new_status
    db.commit()
    return _booking_query(db).filter(models.Booking.id == booking.id).first()


# ─── PAYMENTS (M-PESA) ────────────────────────────────────────────────────────

def require_dev_env():
    if os.getenv("ENV", "development") == "production":
        raise HTTPException(status_code=403, detail="This endpoint is disabled in production")


def _get_booking_for_user(booking_id: int, current_user: models.User, db: Session) -> models.Booking:
    booking = db.query(models.Booking).options(joinedload(models.Booking.listing)).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    is_owner = booking.listing.owner_id == current_user.id
    is_renter = booking.renter_id == current_user.id
    if not is_owner and not is_renter:
        raise HTTPException(status_code=403, detail="Not part of this booking")
    return booking


@app.post("/bookings/{booking_id}/pay")
def pay_for_booking(booking_id: int, body: schemas.PaymentRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.renter_id != current_user.id:
        raise HTTPException(status_code=403, detail="This booking doesn't belong to you")
    if booking.status != "accepted":
        raise HTTPException(status_code=400, detail="Booking must be accepted by the owner before paying")
    if booking.payment_status == "paid":
        raise HTTPException(status_code=400, detail="This booking is already paid")

    amount = int(round(booking.total_price + booking.deposit_amount))
    try:
        result = stk_push(
            phone=body.phone,
            amount=amount,
            account_ref=f"BOOKING-{booking.id}",
            description=f"Rental booking #{booking.id}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"M-PESA error: {str(e)}")

    if result.get("ResponseCode") != "0":
        raise HTTPException(status_code=400, detail=result.get("errorMessage", "STK Push failed"))

    payment = models.Payment(
        purpose="booking",
        booking_id=booking.id,
        user_id=current_user.id,
        phone=body.phone,
        rental_amount=booking.total_price,
        deposit_amount=booking.deposit_amount,
        amount=amount,
        checkout_request_id=result.get("CheckoutRequestID"),
        merchant_request_id=result.get("MerchantRequestID"),
        status="pending",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "message": "STK Push sent! Check your phone and enter your M-PESA PIN.",
        "checkout_request_id": result.get("CheckoutRequestID"),
        "payment_id": payment.id,
    }


def _extend_from(current_end: Optional[datetime], days: int) -> datetime:
    """Stack a renewal on top of remaining time rather than resetting the clock —
    paying for another 7 days of featuring while 3 are left should give 10, not 7."""
    now = datetime.now(timezone.utc)
    base = current_end
    if base and base.tzinfo is None:
        base = base.replace(tzinfo=timezone.utc)
    if not base or base < now:
        base = now
    return base + timedelta(days=days)


def _mark_payment_completed(payment: models.Payment, db: Session, mpesa_receipt: Optional[str] = None):
    payment.status = "completed"
    payment.mpesa_receipt = mpesa_receipt or payment.mpesa_receipt

    if payment.purpose == "booking":
        booking = payment.booking or db.query(models.Booking).filter(models.Booking.id == payment.booking_id).first()
        if booking:
            booking.payment_status = "paid"
            payment.platform_commission = round(payment.rental_amount * COMMISSION_RATE, 2)
            if booking.deposit_amount > 0:
                booking.deposit_status = "held"

    elif payment.purpose == "feature":
        listing = payment.listing or db.query(models.Listing).filter(models.Listing.id == payment.listing_id).first()
        if listing:
            listing.featured_until = _extend_from(listing.featured_until, FEATURE_DAYS)

    elif payment.purpose == "subscription":
        sub = db.query(models.BusinessSubscription).filter(models.BusinessSubscription.user_id == payment.user_id).first()
        if not sub:
            sub = models.BusinessSubscription(user_id=payment.user_id)
            db.add(sub)
        sub.plan = payment.plan
        sub.price_per_month = PLAN_PRICES.get(payment.plan, sub.price_per_month)
        sub.active = True
        sub.current_period_end = _extend_from(sub.current_period_end, 30)
        user = db.query(models.User).filter(models.User.id == payment.user_id).first()
        if user:
            user.is_business = True

    db.commit()


@app.get("/payments/{payment_id}/status", response_model=schemas.PaymentOut)
def check_payment_status(payment_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    payment = db.query(models.Payment).options(joinedload(models.Payment.booking)).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="This payment doesn't belong to you")

    if payment.status == "pending" and payment.checkout_request_id:
        try:
            result = query_stk_status(payment.checkout_request_id)
            if str(result.get("ResultCode", "")) == "0":
                _mark_payment_completed(payment, db, result.get("MpesaReceiptNumber"))
        except Exception as e:
            print(f"STK query error for payment {payment_id}: {e}")

    return payment


@app.post("/pay/callback")
async def mpesa_callback(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    try:
        stk_callback = body["Body"]["stkCallback"]
        checkout_request_id = stk_callback["CheckoutRequestID"]
        result_code = stk_callback["ResultCode"]

        payment = db.query(models.Payment).filter(
            models.Payment.checkout_request_id == checkout_request_id
        ).first()
        if not payment:
            return {"ResultCode": 0, "ResultDesc": "Accepted"}

        if result_code == 0:
            metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])
            receipt = next((i["Value"] for i in metadata if i["Name"] == "MpesaReceiptNumber"), None)
            _mark_payment_completed(payment, db, receipt)
        else:
            payment.status = "failed"
            db.commit()
    except Exception as e:
        print(f"M-PESA callback error: {e}")

    return {"ResultCode": 0, "ResultDesc": "Accepted"}


@app.post("/payments/{payment_id}/test-complete", response_model=schemas.PaymentOut)
def test_complete_payment(payment_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Marks a payment completed without a real M-PESA round trip. Local/dev only —
    there's no publicly reachable callback URL for Safaricom to hit in local dev."""
    require_dev_env()
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="This payment doesn't belong to you")
    _mark_payment_completed(payment, db, "TEST123456")
    return payment


# ─── DEPOSITS ────────────────────────────────────────────────────────────────

def _get_completed_booking_with_held_deposit(booking_id: int, current_user: models.User, db: Session) -> models.Booking:
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    _get_owned_listing(booking.listing_id, current_user, db)  # raises 403 if not the listing owner
    if booking.status != "completed":
        raise HTTPException(status_code=400, detail="Booking must be completed first")
    if booking.deposit_status != "held":
        raise HTTPException(status_code=400, detail=f"Deposit isn't held (status: {booking.deposit_status})")
    return booking


@app.post("/bookings/{booking_id}/release-deposit", response_model=schemas.BookingOut)
def release_deposit(booking_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    booking = _get_completed_booking_with_held_deposit(booking_id, current_user, db)

    payment = db.query(models.Payment).filter(models.Payment.booking_id == booking.id, models.Payment.status == "completed").first()
    if not payment:
        raise HTTPException(status_code=400, detail="No completed payment found for this booking")

    try:
        b2c_payout(
            phone=payment.phone,
            amount=int(round(booking.deposit_amount)),
            occasion=f"Deposit release booking {booking.id}",
            remarks="Deposit returned — item returned in good condition",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"M-PESA error: {str(e)}")

    booking.deposit_status = "released"
    db.commit()
    return _booking_query(db).filter(models.Booking.id == booking.id).first()


@app.post("/bookings/{booking_id}/claim-deposit", response_model=schemas.BookingOut)
def claim_deposit(booking_id: int, body: schemas.DepositClaimRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    booking = _get_completed_booking_with_held_deposit(booking_id, current_user, db)
    if not body.reason.strip():
        raise HTTPException(status_code=400, detail="A reason is required to claim a deposit")

    try:
        b2c_payout(
            phone=body.phone,
            amount=int(round(booking.deposit_amount)),
            occasion=f"Deposit claim booking {booking.id}",
            remarks=body.reason[:100],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"M-PESA error: {str(e)}")

    booking.deposit_status = "claimed"
    booking.deposit_claim_reason = body.reason
    db.commit()
    return _booking_query(db).filter(models.Booking.id == booking.id).first()


# ─── RATINGS ─────────────────────────────────────────────────────────────────

@app.post("/bookings/{booking_id}/rate", response_model=schemas.RatingOut)
def rate_booking(booking_id: int, body: schemas.RatingCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    booking = _get_booking_for_user(booking_id, current_user, db)
    if booking.status != "completed":
        raise HTTPException(status_code=400, detail="Can only rate completed bookings")

    is_renter = booking.renter_id == current_user.id
    rated_role = "owner" if is_renter else "renter"
    ratee_id = booking.listing.owner_id if is_renter else booking.renter_id

    if db.query(models.Rating).filter(models.Rating.booking_id == booking.id, models.Rating.rated_role == rated_role).first():
        raise HTTPException(status_code=400, detail="You already rated this booking")

    rating = models.Rating(
        booking_id=booking.id,
        rater_id=current_user.id,
        ratee_id=ratee_id,
        rated_role=rated_role,
        score=body.score,
        comment=body.comment or "",
    )
    db.add(rating)

    ratee = db.query(models.User).filter(models.User.id == ratee_id).first()
    avg_field = f"rating_as_{rated_role}_avg"
    count_field = f"rating_as_{rated_role}_count"
    prev_avg, prev_count = getattr(ratee, avg_field), getattr(ratee, count_field)
    new_count = prev_count + 1
    new_avg = (prev_avg * prev_count + body.score) / new_count
    setattr(ratee, avg_field, new_avg)
    setattr(ratee, count_field, new_count)

    db.commit()
    db.refresh(rating)
    return rating


@app.get("/bookings/{booking_id}/ratings", response_model=list[schemas.RatingOut])
def get_booking_ratings(booking_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    _get_booking_for_user(booking_id, current_user, db)
    return db.query(models.Rating).filter(models.Rating.booking_id == booking_id).all()


# ─── FEATURED LISTINGS ────────────────────────────────────────────────────────

@app.post("/listings/{listing_id}/feature")
def feature_listing(listing_id: int, body: schemas.PaymentRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    listing = _get_owned_listing(listing_id, current_user, db)

    try:
        result = stk_push(
            phone=body.phone,
            amount=FEATURE_PRICE_KES,
            account_ref=f"FEATURE-{listing.id}",
            description=f"Feature listing #{listing.id} for {FEATURE_DAYS} days",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"M-PESA error: {str(e)}")

    if result.get("ResponseCode") != "0":
        raise HTTPException(status_code=400, detail=result.get("errorMessage", "STK Push failed"))

    payment = models.Payment(
        purpose="feature",
        listing_id=listing.id,
        user_id=current_user.id,
        phone=body.phone,
        amount=FEATURE_PRICE_KES,
        checkout_request_id=result.get("CheckoutRequestID"),
        merchant_request_id=result.get("MerchantRequestID"),
        status="pending",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "message": "STK Push sent! Check your phone and enter your M-PESA PIN.",
        "checkout_request_id": result.get("CheckoutRequestID"),
        "payment_id": payment.id,
    }


# ─── BUSINESS SUBSCRIPTIONS ───────────────────────────────────────────────────

@app.get("/business/subscription", response_model=schemas.SubscriptionOut)
def get_subscription(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    sub = db.query(models.BusinessSubscription).filter(models.BusinessSubscription.user_id == current_user.id).first()
    if not sub:
        return schemas.SubscriptionOut(plan="free", price_per_month=0.0, active=False, current_period_end=None)
    return sub


@app.post("/business/subscribe")
def subscribe(body: schemas.SubscribeRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    price = PLAN_PRICES[body.plan]

    try:
        result = stk_push(
            phone=body.phone,
            amount=price,
            account_ref=f"SUBSCRIBE-{current_user.id}",
            description=f"{body.plan.title()} plan — monthly subscription",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"M-PESA error: {str(e)}")

    if result.get("ResponseCode") != "0":
        raise HTTPException(status_code=400, detail=result.get("errorMessage", "STK Push failed"))

    payment = models.Payment(
        purpose="subscription",
        plan=body.plan,
        user_id=current_user.id,
        phone=body.phone,
        amount=price,
        checkout_request_id=result.get("CheckoutRequestID"),
        merchant_request_id=result.get("MerchantRequestID"),
        status="pending",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "message": "STK Push sent! Check your phone and enter your M-PESA PIN.",
        "checkout_request_id": result.get("CheckoutRequestID"),
        "payment_id": payment.id,
    }


# ─── ADMIN REVENUE ─────────────────────────────────────────────────────────────

@app.get("/admin/revenue")
def admin_revenue(current_user: models.User = Depends(auth.require_admin), db: Session = Depends(get_db)):
    completed = db.query(models.Payment).filter(models.Payment.status == "completed")
    booking_payments = completed.filter(models.Payment.purpose == "booking").all()
    feature_payments = completed.filter(models.Payment.purpose == "feature").all()
    subscription_payments = completed.filter(models.Payment.purpose == "subscription").all()

    return {
        "commission_kes": sum(p.platform_commission for p in booking_payments),
        "commission_transaction_count": len(booking_payments),
        "gross_rental_kes": sum(p.rental_amount for p in booking_payments),
        "featured_listing_revenue_kes": sum(p.amount for p in feature_payments),
        "featured_listing_count": len(feature_payments),
        "subscription_revenue_kes": sum(p.amount for p in subscription_payments),
        "active_business_subscriptions": db.query(models.BusinessSubscription).filter(models.BusinessSubscription.active == True).count(),  # noqa: E712
        "total_platform_revenue_kes": (
            sum(p.platform_commission for p in booking_payments)
            + sum(p.amount for p in feature_payments)
            + sum(p.amount for p in subscription_payments)
        ),
    }
