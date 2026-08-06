from pydantic import BaseModel
from typing import Optional
from datetime import datetime


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
    created_at: datetime
    renter: RenterOut
    listing: ListingOut

    class Config:
        from_attributes = True
