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

# A handful of sample listings in the launch area (Kilimani) so Browse isn't empty
# on a fresh checkout. Owned by a demo account created on the fly if it doesn't exist.
demo = db.query(models.User).filter(models.User.username == "demo_owner").first()
if not demo:
    demo = models.User(
        username="demo_owner",
        email="demo_owner@example.com",
        password="$2b$12$KIXQ8s8u1o3n8b7l0m0k0.notarealhashjustseeddata000000",
        full_name="Demo Owner",
    )
    db.add(demo)
    db.commit()
    db.refresh(demo)

kilimani = db.query(models.Area).filter(models.Area.slug == "kilimani").first()
by_slug = {c.slug: c for c in db.query(models.Category).all()}

SAMPLE_LISTINGS = [
    {"title": "Bosch Cordless Drill", "category": "tools", "price_per_day": 300, "deposit_amount": 1500,
     "description": "18V cordless drill with two batteries and a full bit set."},
    {"title": "4-Person Camping Tent", "category": "camping-gear", "price_per_day": 500, "deposit_amount": 2000,
     "description": "Waterproof dome tent, easy 10-minute setup, sleeps 4."},
    {"title": "JBL PA Speaker + Mixer", "category": "event-equipment", "price_per_day": 2500, "deposit_amount": 8000,
     "description": "Portable PA system good for small events up to 100 guests."},
    {"title": "Spare Room Near Yaya Centre", "category": "spare-rooms", "price_per_day": 1800, "deposit_amount": 0,
     "description": "Furnished ensuite spare room, short stays welcome."},
]

if not db.query(models.Listing).first() and demo and kilimani:
    for item in SAMPLE_LISTINGS:
        category = by_slug.get(item["category"])
        if not category:
            continue
        db.add(models.Listing(
            owner_id=demo.id,
            category_id=category.id,
            area_id=kilimani.id,
            title=item["title"],
            description=item["description"],
            price_per_day=item["price_per_day"],
            deposit_amount=item["deposit_amount"],
        ))
    db.commit()

print(f"Seeded {db.query(models.Area).count()} areas, {db.query(models.Category).count()} categories, "
      f"{db.query(models.Listing).count()} listings.")
db.close()
