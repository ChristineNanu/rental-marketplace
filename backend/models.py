from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
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
