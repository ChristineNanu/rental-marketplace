"""One-off seed script for Areas and Categories. Run with: python seed_data.py"""
import models
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

AREAS = [
    # Kilimani marked as the launch area — start narrow (per the cold-start
    # strategy in the plan) rather than seeding every estate as "live" on day one.
    {"name": "Kilimani", "slug": "kilimani", "is_launch_area": True},
    {"name": "Westlands", "slug": "westlands", "is_launch_area": False},
    {"name": "Lavington", "slug": "lavington", "is_launch_area": False},
    {"name": "Karen", "slug": "karen", "is_launch_area": False},
    {"name": "Kileleshwa", "slug": "kileleshwa", "is_launch_area": False},
    {"name": "South B", "slug": "south-b", "is_launch_area": False},
]

CATEGORIES = [
    {"name": "Tools", "slug": "tools", "listing_type": "item"},
    {"name": "Camping Gear", "slug": "camping-gear", "listing_type": "item"},
    {"name": "Event Equipment", "slug": "event-equipment", "listing_type": "item"},
    {"name": "Electronics", "slug": "electronics", "listing_type": "item"},
    {"name": "Spare Rooms", "slug": "spare-rooms", "listing_type": "space"},
    {"name": "Parking Spots", "slug": "parking-spots", "listing_type": "space"},
]

for a in AREAS:
    if not db.query(models.Area).filter(models.Area.slug == a["slug"]).first():
        db.add(models.Area(city="Nairobi", **a))

for c in CATEGORIES:
    if not db.query(models.Category).filter(models.Category.slug == c["slug"]).first():
        db.add(models.Category(**c))

db.commit()
print(f"Seeded {db.query(models.Area).count()} areas, {db.query(models.Category).count()} categories.")
db.close()
