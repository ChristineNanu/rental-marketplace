---
name: rentit-api
description: Add or modify RentIt Nairobi FastAPI routes, Pydantic schemas, SQLAlchemy models, authentication, or database behavior.
---

# RentIt API and data work

Use this skill for backend changes under `backend/`.

## Project conventions

- Routes and application setup live in `backend/main.py`; models in `models.py`; request/response validation in `schemas.py`; JWT and rate limiting in `auth.py`; engine/session setup in `database.py`.
- The app uses FastAPI, SQLAlchemy, and Pydantic. Local SQLite is the default; `DATABASE_URL` selects another database.
- Return typed response models for established endpoints. Use `HTTPException` for expected client errors. Registered exception handlers return `JSONResponse`, not plain dictionaries.
- Protected routes should use `auth.get_current_user` or `auth.require_admin`, then check record-level ownership in the route/helper. A user can be both renter and owner; only admin is an exclusive role.
- Validate inputs in Pydantic schemas and repeat critical state/ownership checks in the backend. Compute prices and enforce status transitions on the server.
- Commit related database state together. Preserve response shapes used by the frontend.
- The project currently calls SQLAlchemy `create_all` at startup and has no migration framework. `create_all` does not add columns to existing tables; include a safe migration or compatibility plan for schema changes.
- Avoid logging secrets, passwords, tokens, full payment payloads, or personal payment details.

Check existing routes and schemas before adding a parallel endpoint or a new data representation. Keep external integrations isolated behind their existing helper modules.
