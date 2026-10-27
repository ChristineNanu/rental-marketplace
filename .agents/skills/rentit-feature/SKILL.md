---
name: rentit-feature
description: Plan and implement a RentIt Nairobi product feature that crosses React, FastAPI, and persisted marketplace data.
---

# RentIt feature development

Use this skill for end-to-end product changes in this repository. First trace the existing user flow and API contract, then make the smallest complete change across the layers it actually needs.

## Project map

- React 18 and React Router 6 frontend: `src/App.tsx`, `src/components/`, `src/api.js`, and `src/constants.js`.
- FastAPI backend: routes in `backend/main.py`; SQLAlchemy tables in `backend/models.py`; Pydantic request/response models in `backend/schemas.py`; auth helpers in `backend/auth.py`; database setup in `backend/database.py`.
- Product and setup overview: `README.md`.

## Working conventions

- Trace a similar screen, route, model, and response before adding a new pattern.
- For signed-in API requests, use `apiFetch` so bearer-token refresh behavior stays consistent. Public reads may use `fetch` as nearby components do.
- Validate request data with Pydantic schemas and enforce permissions and business rules in the backend. Never rely on frontend checks for ownership, booking state, price, or admin access.
- Keep server-calculated values authoritative, especially rental totals, deposits, commission, and payment state.
- Reuse existing shared UI components and the amber/slate Tailwind design system where appropriate.
- If a change adds persisted fields or tables, account for existing SQLite databases: startup `create_all` creates missing tables but does not migrate existing tables. The repo has no established migration tool, so surface a safe migration plan rather than assuming the change will apply automatically.
- Update the README when a user-visible workflow, setup step, or documented product behavior materially changes.

Keep the change within the requested scope. Ask before changing prices, payment semantics, account permissions, or other product rules that the request does not specify.
