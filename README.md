# RentIt Nairobi 📦

A peer-to-peer rental marketplace for Nairobi — "Airbnb for stuff." List tools, camping gear, event equipment, spare rooms, and parking spots for short-term rent instead of buying what you'll use once. Built with React and FastAPI, reusing the M-Pesa/JWT-auth foundation proven in [RescueMePets](../RescueMePets), with M-Pesa deposit escrow, a two-way rating system, and platform monetization (commission, featured listings, business subscriptions) layered on top.

---

## What It Does

- **Renters** browse listings by area and category, request to rent for a date range, pay the rental fee + deposit in one M-Pesa STK Push, track booking status, and rate the owner once the rental is complete
- **Owners** list items or spaces (title, description, photos, price/day, deposit), manage incoming requests (accept/decline), mark rentals completed, then release the deposit back to the renter or claim it for damage/no-return, and rate the renter
- **Business owners** (hardware shops, repeat listers) subscribe to a Pro or Premium monthly plan for a badge and perks; any owner can pay to feature a listing for 7 days so it sorts to the top of Browse
- **Admins** see a platform revenue dashboard — commission earned, featured-listing revenue, and subscription revenue in one place

---

## Design System

Amber/slate palette — deliberately distinct from RescueMePets' teal/coral, its own brand energy for tools/hardware/marketplace. Inter typeface throughout.

| Class | Purpose |
|---|---|
| `.page-bg` | Full-page amber/white/slate gradient background |
| `.btn-primary` | Amber gradient button with hover lift + glow |
| `.card` | White card, shadow, hover lift — for clickable/interactive containers |
| `.card-static` | Same surface as `.card` without the hover lift — for info/stat panels that aren't clickable |
| `.input-field` | Styled input with amber focus ring |
| `.img-placeholder` | Soft gradient + icon fallback for listings with no photo |

Shared components worth knowing about: `ListingThumb` (single-photo thumbnail with graceful fallback, used in Browse/My Listings/My Bookings), `PhotoGallery` (main image + thumbnail strip on the listing detail page), `AuthLayout` (the branded split panel behind Login/Register), and `MpesaPaymentModal`/`SimplePaymentModal` (the STK-push → poll → confirm modal pattern, reused for bookings, featuring a listing, and business subscriptions).

---

## Features

### 🔐 Authentication
JWT auth with short-lived access tokens (30 min) + rotating, revocable refresh tokens (30 days, hashed at rest). Rate-limited login/register (in-memory sliding window). No role enum — the same account is routinely both an owner and a renter; `is_admin` is the one genuinely exclusive permission.

### 🔍 Browse & Listings
Filter by area (Kilimani is the seeded launch area — a deliberately narrow cold-start, per the original product plan) and category (Tools, Camping Gear, Event Equipment, Electronics, Spare Rooms, Parking Spots), or search by title. Featured listings sort first with a ★ badge. Each listing supports multiple photos (comma-separated URLs under the hood; the create-listing form gives you a proper add/remove photo picker with live thumbnails and a live preview card). Owners can pause, reactivate, or remove their own listings (soft delete).

### 📅 Bookings
Renter picks a date range on a listing → total price is computed server-side (days × price/day) → owner accepts or declines → renter pays → owner marks completed. Status transitions are enforced server-side (`requested → accepted/declined/cancelled`, `accepted → cancelled/completed`, and `completed` is blocked until `payment_status == "paid"`), with 403s for anyone who isn't a party to the booking and 403s for renter-only vs. owner-only actions.

### 💳 M-Pesa Payments & Deposit Escrow
Full Safaricom Daraja API integration (`backend/daraja.py`, copied from RescueMePets):
- One STK Push covers the rental fee + deposit together
- Frontend polls payment status every 5 seconds, with a manual "I already paid" fallback that completes the payment without a round trip — useful since local dev has no publicly reachable callback URL for Safaricom to hit
- On completion, the platform computes its commission (12% of the rental fee — the deposit is excluded since it's refundable, not revenue) and, if there's a deposit, marks it `held`
- Once the owner marks a booking `completed`, they either **release** the deposit back to the renter or **claim** it (with a required reason) for damage/no-return — both are real M-Pesa B2C payouts

### ⭐ Ratings
Renter and owner each rate the other once per completed booking (1–5 stars + comment), feeding separate `rating_as_owner` / `rating_as_renter` aggregates on the user — "good owner, bad renter" is a real, distinct signal about the same person and isn't blended into one score. Double-rating the same booking is rejected server-side.

### 💰 Monetization
- **Commission** — 12% of the rental fee on every paid booking, tracked per-payment
- **Featured listings** — KES 200 for 7 days at the top of Browse; renewing while time remains stacks the extension instead of resetting it
- **Business subscriptions** — Pro (KES 1,000/mo) and Premium (KES 2,500/mo), each a real M-Pesa charge that sets `is_business` and shows a badge on the owner's listings
- **Admin revenue dashboard** — commission + featured-listing + subscription revenue in one view, admin-only

---

## Tech Stack

### Frontend
- **React 18** with hooks, **React Router 6**
- **Tailwind CSS 3** with a custom `amber`/`slate` palette and `Inter` typeface
- Plain `fetch`-based API layer (`api.js`) with automatic access-token refresh-and-retry on a 401

### Backend
- **FastAPI** + **SQLAlchemy** (SQLite locally; swap `DATABASE_URL` for Postgres in production)
- **PyJWT** + **bcrypt** for auth
- **Safaricom Daraja API** (`daraja.py`) — STK Push, payment status polling, B2C payouts
- **Pydantic** for request/response validation

---

## Project Structure

```
rental-marketplace/
├── backend/
│   ├── main.py              # All FastAPI endpoints
│   ├── auth.py               # JWT issuance/verification, rate limiting, auth dependencies
│   ├── daraja.py              # M-Pesa Daraja API integration (STK Push, query, B2C)
│   ├── models.py             # SQLAlchemy models
│   ├── schemas.py            # Pydantic schemas
│   ├── database.py           # DB connection and session config
│   ├── seed_data.py          # Seeds areas, categories, and sample listings with photos
│   ├── .env                  # Secrets (not committed)
│   └── requirements.txt      # Python dependencies
├── src/
│   ├── components/
│   │   ├── AuthLayout.js           # Branded split-panel layout shared by Login/Register
│   │   ├── Login.js / Register.js  # Auth pages
│   │   ├── Nav.js                  # Top nav bar (brand + pill links + actions)
│   │   ├── Dashboard.js            # Personalized hero, quick actions, empty state
│   │   ├── Browse.js               # Listing grid — search, area/category filters, category chips
│   │   ├── ListingThumb.js         # Single-photo thumbnail with fallback placeholder
│   │   ├── PhotoGallery.js         # Main image + thumbnail strip (listing detail page)
│   │   ├── ListingDetail.js        # Gallery, owner info, booking request form
│   │   ├── CreateListing.js        # Listing form with photo picker + live preview
│   │   ├── MyListings.js           # Owner's listings, booking requests, deposit release/claim
│   │   ├── MyBookings.js           # Renter's bookings, payment, cancel, rate owner
│   │   ├── MpesaPaymentModal.js    # STK-push modal for booking payments (rental + deposit)
│   │   ├── SimplePaymentModal.js   # Generic STK-push modal (featuring, subscriptions)
│   │   ├── RatingModal.js          # 1–5 star + comment rating form
│   │   ├── Business.js             # Plan comparison + subscribe flow
│   │   └── AdminRevenue.js         # Platform revenue dashboard (admin-only)
│   ├── api.js                      # Authenticated fetch wrapper (token attach + refresh)
│   ├── App.js                      # Root component and routing
│   ├── constants.js                # API base URL config
│   └── index.js                    # React entry point
├── tailwind.config.js              # Custom amber/slate colors and shadows
└── package.json
```

---

## Database Schema

Only the columns most relevant to understanding the data model are listed; see `backend/models.py` for exact definitions.

### Users
| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary Key |
| username, email, phone | String | Unique |
| password | String | bcrypt hashed |
| is_admin, is_business | Boolean | |
| rating_as_owner_avg/count | Float/Integer | Separate from renter rating — same person, distinct signal |
| rating_as_renter_avg/count | Float/Integer | |
| deleted_at | DateTime | Soft delete |

### Listings
| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary Key |
| owner_id, category_id, area_id | Integer | Foreign Keys |
| title, description, price_per_day, deposit_amount | | |
| photos | String | Comma-separated photo URLs |
| status | String | active / paused / deleted |
| featured_until | DateTime | Listing sorts first in Browse while this is in the future |

### Bookings
| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary Key |
| listing_id, renter_id | Integer | Foreign Keys |
| start_date, end_date, total_price, deposit_amount | | |
| status | String | requested / accepted / declined / cancelled / completed |
| payment_status | String | unpaid / paid |
| deposit_status | String | none / held / released / claimed |
| deposit_claim_reason | Text | Set when the owner claims the deposit |

### Payments
| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary Key |
| purpose | String | booking / feature / subscription — dispatches completion handling |
| booking_id, listing_id, plan | | Only one set, matching `purpose` |
| rental_amount, deposit_amount, amount | Float | `amount` is what STK actually charges |
| platform_commission | Float | Computed on completion, booking payments only |
| status | String | pending / completed / failed |
| checkout_request_id, mpesa_receipt | String | M-Pesa references |

### Ratings
| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary Key |
| booking_id, rater_id, ratee_id | Integer | Foreign Keys |
| rated_role | String | "owner" or "renter" — which role the ratee is being scored for |
| score | Integer | 1–5 |
| comment | Text | |

Unique on `(booking_id, rated_role)` — one rating per direction per booking.

### BusinessSubscriptions
| Column | Type | Notes |
|---|---|---|
| id | Integer | Primary Key |
| user_id | Integer | Foreign Key, unique |
| plan | String | pro / premium |
| price_per_month | Float | |
| active | Boolean | |
| current_period_end | DateTime | Renewing while time remains stacks the extension |

### Areas / Categories
Seeded reference data — Nairobi estates (Kilimani marked `is_launch_area=True`) and item/space categories.

---

## API Endpoints

All endpoints requiring auth expect `Authorization: Bearer <access_token>`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register a new account |
| POST | `/login` | Authenticate — returns a token pair |
| POST | `/auth/refresh` | Exchange a refresh token for a new pair (rotates) |
| POST | `/auth/logout` | Revoke a refresh token |
| GET | `/me` | Current user's profile + rating aggregates |

### Areas & Categories
| Method | Endpoint | Description |
|---|---|---|
| GET | `/areas`, `/categories` | Browse scaffolding — seeded reference data |

### Listings
| Method | Endpoint | Description |
|---|---|---|
| GET | `/listings` | Browse — filter by `category_id`, `area_id`, `q`; featured-first sort |
| GET | `/listings/{id}` | Get one listing |
| POST | `/listings` | Create a listing |
| PATCH | `/listings/{id}` | Update a listing (owner only) |
| DELETE | `/listings/{id}` | Soft-delete a listing (owner only) |
| GET | `/my-listings` | Current user's listings |

### Bookings
| Method | Endpoint | Description |
|---|---|---|
| POST | `/listings/{id}/bookings` | Request to rent a listing for a date range |
| GET | `/my-bookings` | Current user's bookings (as renter) |
| GET | `/listings/{id}/bookings` | Booking requests on a listing (owner only) |
| PATCH | `/bookings/{id}` | Transition status — accept/decline/cancel/complete |

### Payments (M-Pesa)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/bookings/{id}/pay` | STK Push for rental fee + deposit |
| GET | `/payments/{id}/status` | Poll payment status |
| POST | `/pay/callback` | Safaricom webhook for STK Push confirmation |
| POST | `/payments/{id}/test-complete` | Manually complete a payment (dev-only) |

### Deposits
| Method | Endpoint | Description |
|---|---|---|
| POST | `/bookings/{id}/release-deposit` | B2C payout of the deposit back to the renter |
| POST | `/bookings/{id}/claim-deposit` | B2C payout of the deposit to the owner, with a reason |

### Ratings
| Method | Endpoint | Description |
|---|---|---|
| POST | `/bookings/{id}/rate` | Rate the other party on a completed booking |
| GET | `/bookings/{id}/ratings` | Ratings left on a booking |

### Monetization
| Method | Endpoint | Description |
|---|---|---|
| POST | `/listings/{id}/feature` | STK Push to feature a listing for 7 days |
| GET | `/business/subscription` | Current user's subscription status |
| POST | `/business/subscribe` | STK Push to subscribe to Pro/Premium |
| GET | `/admin/revenue` | Platform revenue summary (admin-only) |

---

## Installation & Setup

### Prerequisites
- Node.js v22+
- Python 3.9+
- npm, pip

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
# M-Pesa (Safaricom Daraja Portal: https://developer.safaricom.co.ke)
MPESA_CONSUMER_KEY=<your_consumer_key>
MPESA_CONSUMER_SECRET=<your_consumer_secret>
MPESA_SHORTCODE=174379
MPESA_PASSKEY=<your_passkey>
# Must be a well-formed HTTPS URL — Safaricom rejects the STK Push request outright
# if this isn't valid HTTPS, even though the callback itself only matters once you
# have a publicly reachable backend for Safaricom to call.
MPESA_CALLBACK_URL=https://<your-domain>/pay/callback
MPESA_ENV=sandbox

JWT_SECRET=<a long random string>

# Set to "production" to disable /payments/{id}/test-complete
ENV=development
```

Seed reference data and sample listings:

```bash
python seed_data.py
```

Run the server:

```bash
uvicorn main:app --reload --port 8001
```

Backend runs at `http://localhost:8001` — Swagger docs at `http://localhost:8001/docs`

### Frontend

```bash
npm install
npm start
```

Frontend runs at `http://localhost:3001` (port 3000 is reserved for RescueMePets in local dev — see `src/constants.js` / CORS config in `backend/main.py` if you need to change this).

---

## Roadmap

- ✅ **Phase 0 — Scaffolding & auth**: JWT auth, areas/categories browse scaffolding
- ✅ **Phase 1 — Listings & bookings**: full listing CRUD, browse/filter, booking request lifecycle
- ✅ **Phase 2 — Trust & payments**: M-Pesa STK Push, deposit hold/release/claim escrow, two-way ratings
- ✅ **Phase 3 — Monetization**: booking commission, featured listings, business subscriptions, admin revenue dashboard
- ✅ **Phase 4 — Visual polish**: photo galleries, branded auth/nav, responsive pass across all screens
- ⬜ **Not yet built**: admin dispute review for deposit claims (currently owner-self-serve), automated owner payout of rental-fee revenue, phone/ID verification flow (fields exist on `User`, no flow behind them yet)

---

## License

MIT License.
