---
name: rentit-debug
description: Investigate and fix bugs that cross the RentIt Nairobi browser, API, database, authentication, or payment layers.
---

# RentIt debugging

Use this skill when a user reports a runtime error, blank screen, failed request, inconsistent state, or a backend startup problem.

## Trace the failure

- Locate the first useful browser console error and inspect the failing Network request: URL, method, status, request body, and response body.
- For API failures, trace the matching frontend call through `src/api.js` or the component's `fetch`, into the FastAPI route, schema, auth dependency, and database/provider helper.
- Check the Uvicorn traceback for 5xx responses. A browser CORS message can be a side effect of a backend exception; confirm the response and server error before changing CORS settings.
- FastAPI/Pydantic validation errors may have `detail` as an array of objects. Use `getErrorMessage` before displaying these in React; never render raw error objects.
- For database issues, distinguish a missing table, an existing schema needing migration, and duplicate model metadata/index definitions. Do not delete a user's local database to make a symptom disappear.
- For payment issues, inspect payment/booking states and provider response paths without triggering real charges or payouts.

Make the smallest fix that addresses the demonstrated cause, then report how to reproduce the fix and any remaining uncertainty. Do not ask for secrets, access tokens, full payment credentials, or unredacted personal data.
