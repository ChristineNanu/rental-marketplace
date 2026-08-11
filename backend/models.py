from datetime import datetime, timezone

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
    featured_until = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User")
    category = relationship("Category")
    area = relationship("Area")

    @property
    def is_featured(self) -> bool:
        if not self.featured_until:
            return False
        # SQLite round-trips DateTime(timezone=True) as naive — normalize before comparing.
        until = self.featured_until if self.featured_until.tzinfo else self.featured_until.replace(tzinfo=timezone.utc)
        return until > datetime.now(timezone.utc)


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
    status = Column(String, default="requested")
    # unpaid -> paid, set from the STK push callback/test-complete. accepted -> completed
    # requires paid, so the owner can't mark a rental done that was never charged.
    payment_status = Column(String, default="unpaid")
    # none (no deposit on this listing) -> held (paid in) -> released (back to renter)
    #   | claimed (paid out to owner for damage/no-return).
    deposit_status = Column(String, default="none")
    deposit_claim_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    listing = relationship("Listing")
    renter = relationship("User")


class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payments_booking_id", "booking_id"),
        Index("ix_payments_listing_id", "listing_id"),
        Index("ix_payments_checkout_request_id", "checkout_request_id"),
    )
    id = Column(Integer, primary_key=True, index=True)
    # What this payment is for — dispatches how completion is handled (see
    # _mark_payment_completed in main.py). Only one of booking_id/listing_id is set,
    # matching purpose.
    purpose = Column(String, default="booking")  # booking | feature | subscription
    booking_id = Column(Integer, ForeignKey("bookings.id"), index=True, nullable=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), index=True, nullable=True)  # for purpose="feature"
    plan = Column(String, nullable=True)  # for purpose="subscription": "pro" | "premium"
    user_id = Column(Integer, ForeignKey("users.id"))  # whoever paid
    phone = Column(String)
    rental_amount = Column(Float, default=0.0)
    deposit_amount = Column(Float, default=0.0)
    amount = Column(Float)  # what STK actually charges
    # Platform's cut of rental_amount, computed on completion — booking payments only.
    platform_commission = Column(Float, default=0.0)
    checkout_request_id = Column(String, nullable=True)
    merchant_request_id = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending | completed | failed
    mpesa_receipt = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    booking = relationship("Booking")
    listing = relationship("Listing")
    user = relationship("User")


class BusinessSubscription(Base):
    __tablename__ = "business_subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    plan = Column(String, default="pro")  # pro | premium
    price_per_month = Column(Float, default=0.0)
    active = Column(Boolean, default=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")


class BookingMessage(Base):
    __tablename__ = "booking_messages"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    body = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    booking = relationship("Booking")
    sender = relationship("User", foreign_keys=[sender_id])


class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (
        Index("ix_ratings_booking_role", "booking_id", "rated_role", unique=True),
    )
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), index=True)
    rater_id = Column(Integer, ForeignKey("users.id"))
    ratee_id = Column(Integer, ForeignKey("users.id"))
    rated_role = Column(String)  # "owner" | "renter" — which role the ratee is being scored for
    score = Column(Integer)  # 1-5
    comment = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    booking = relationship("Booking")
    rater = relationship("User", foreign_keys=[rater_id])
    ratee = relationship("User", foreign_keys=[ratee_id])
