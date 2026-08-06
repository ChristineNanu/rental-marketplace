from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


def _normalize_kenyan_phone(v: str) -> str:
    phone = v.strip().replace('+', '').replace(' ', '')
    if phone.startswith('0'):
        phone = '254' + phone[1:]
    if not phone.startswith('254'):
        phone = '254' + phone
    if len(phone) != 12:
        raise ValueError('Invalid phone number. Use format: 0712345678 or 254712345678')
    return phone


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = ""
    phone: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AreaOut(BaseModel):
    id: int
    name: str
    slug: str
    city: str
    is_launch_area: bool

    class Config:
        from_attributes = True


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    listing_type: str
    parent_id: Optional[int] = None

    class Config:
        from_attributes = True


# ─── LISTINGS ────────────────────────────────────────────────────────────────

class ListingCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category_id: int
    area_id: int
    price_per_day: float
    deposit_amount: Optional[float] = 0.0
    photos: Optional[str] = ""  # comma-separated URLs


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    area_id: Optional[int] = None
    price_per_day: Optional[float] = None
    deposit_amount: Optional[float] = None
    photos: Optional[str] = None
    status: Optional[str] = None  # active | paused


class OwnerOut(BaseModel):
    id: int
    username: str
    full_name: str
    is_business: bool
    rating_as_owner_avg: float
    rating_as_owner_count: int

    class Config:
        from_attributes = True


class ListingOut(BaseModel):
    id: int
    owner_id: int
    category_id: int
    area_id: int
    title: str
    description: str
    price_per_day: float
    deposit_amount: float
    photos: str
    status: str
    is_featured: bool
    created_at: datetime
    owner: OwnerOut
    category: CategoryOut
    area: AreaOut

    class Config:
        from_attributes = True


# ─── BOOKINGS ────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    start_date: datetime
    end_date: datetime


class BookingStatusUpdate(BaseModel):
    status: str  # accepted | declined | cancelled | completed


class RenterOut(BaseModel):
    id: int
    username: str
    full_name: str
    rating_as_renter_avg: float
    rating_as_renter_count: int

    class Config:
        from_attributes = True


class BookingOut(BaseModel):
    id: int
    listing_id: int
    renter_id: int
    start_date: datetime
    end_date: datetime
    total_price: float
    deposit_amount: float
    status: str
    payment_status: str
    deposit_status: str
    created_at: datetime
    renter: RenterOut
    listing: ListingOut

    class Config:
        from_attributes = True


# ─── PAYMENTS (M-PESA) ────────────────────────────────────────────────────────

class PaymentRequest(BaseModel):
    phone: str

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        return _normalize_kenyan_phone(v)


class DepositClaimRequest(BaseModel):
    phone: str
    reason: str

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        return _normalize_kenyan_phone(v)


class PaymentOut(BaseModel):
    id: int
    purpose: str
    booking_id: Optional[int] = None
    listing_id: Optional[int] = None
    plan: Optional[str] = None
    phone: str
    rental_amount: float
    deposit_amount: float
    amount: float
    platform_commission: float
    status: str
    mpesa_receipt: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── MONETIZATION (featured listings + business tier) ────────────────────────

class SubscribeRequest(BaseModel):
    phone: str
    plan: str  # pro | premium

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        return _normalize_kenyan_phone(v)

    @field_validator('plan')
    @classmethod
    def validate_plan(cls, v):
        if v not in ("pro", "premium"):
            raise ValueError('Plan must be "pro" or "premium"')
        return v


class SubscriptionOut(BaseModel):
    plan: str
    price_per_month: float
    active: bool
    current_period_end: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── RATINGS ─────────────────────────────────────────────────────────────────

class RatingCreate(BaseModel):
    score: int
    comment: Optional[str] = ""

    @field_validator('score')
    @classmethod
    def validate_score(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Score must be between 1 and 5')
        return v


class RatingOut(BaseModel):
    id: int
    booking_id: int
    rater_id: int
    ratee_id: int
    rated_role: str
    score: int
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True
