from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import database

Base = database.Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    password = Column(String)
    full_name = Column(String, default="")
    avatar = Column(String, default="")

    # No role enum — "owner" and "renter" are derived from Listing.owner_id /
    # Booking.renter_id, not stored here, since the same account is routinely
    # both. is_admin is the one genuinely exclusive permission.
    is_admin = Column(Boolean, default=False)
    is_business = Column(Boolean, default=False)

    phone_verified = Column(Boolean, default=False)
    id_verification_status = Column(String, default="none")  # none | pending | verified

    # Separate aggregates — "good owner, bad renter" is a real, distinct signal
    # about the same person and shouldn't be blended into one score.
    rating_as_owner_avg = Column(Float, default=0.0)
    rating_as_owner_count = Column(Integer, default=0)
    rating_as_renter_avg = Column(Float, default=0.0)
    rating_as_renter_count = Column(Integer, default=0)

    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    token_hash = Column(String, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True))
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User")


class Area(Base):
    __tablename__ = "areas"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    slug = Column(String, unique=True, index=True)
    city = Column(String, default="Nairobi")
    is_launch_area = Column(Boolean, default=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    slug = Column(String, unique=True, index=True)
    listing_type = Column(String)  # item | space
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)


class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = (
        Index("ix_listings_category_id", "category_id"),
        Index("ix_listings_area_id", "area_id"),
        Index("ix_listings_owner_id", "owner_id"),
        Index("ix_listings_status", "status"),
    )
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    area_id = Column(Integer, ForeignKey("areas.id"))
    title = Column(String, index=True)
    description = Column(Text, default="")
    price_per_day = Column(Float)
    deposit_amount = Column(Float, default=0.0)
    photos = Column(String, default="")  # comma-separated photo URLs
    status = Column(String, default="active")  # active | paused | deleted
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User")
    category = relationship("Category")
    area = relationship("Area")


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        Index("ix_bookings_listing_id", "listing_id"),
        Index("ix_bookings_renter_id", "renter_id"),
        Index("ix_bookings_status", "status"),
    )
    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), index=True)
    renter_id = Column(Integer, ForeignKey("users.id"), index=True)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    total_price = Column(Float)
    deposit_amount = Column(Float, default=0.0)
    # requested -> accepted|declined by owner; accepted -> cancelled|completed.
    # Payment/escrow status is deliberately separate from this lifecycle (Phase 2).
    status = Column(String, default="requested")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    listing = relationship("Listing")
    renter = relationship("User")
