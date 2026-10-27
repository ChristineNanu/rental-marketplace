---
name: rentit-frontend
description: Build or change RentIt Nairobi React screens, components, forms, and responsive styling.
---

# RentIt frontend work

Use this skill for frontend-only work in `src/`.

## App conventions

- The app uses React 18, React Router 6, and Create React App. The root router is `src/App.tsx`; most existing screens and utilities are JavaScript.
- Styling is primarily Tailwind CSS, with shared classes and animations in `src/index.css`. The brand uses amber, slate, white, and the Inter font.
- Reuse components such as `Nav`, `AuthLayout`, `ListingThumb`, `PhotoGallery`, `BookingChat`, `MessageBell`, and the payment/rating modals where they fit.
- Keep layouts responsive and preserve existing navigation and logged-in/logged-out behavior.

## Data and states

- Use `apiFetch` from `src/api.js` for authenticated requests; it attaches access tokens and performs a refresh-and-retry on 401. Use the existing public `fetch` pattern only for endpoints that are public.
- Read the API base from `src/constants.js`; it defaults to `http://localhost:8001` and can be overridden with `REACT_APP_API_BASE_URL`.
- Handle loading, empty, success, and error states. Use `getErrorMessage` from `src/utils/validation.js` for API errors; FastAPI validation errors can be arrays of objects and must not be rendered directly as React children.
- Keep payment, booking, and permission decisions on the server. The UI may guide the user but must not claim an operation succeeded until the API confirms it.

Prefer a focused component change over broad visual rewrites. Follow neighboring component patterns unless the requested behavior calls for a new one.
