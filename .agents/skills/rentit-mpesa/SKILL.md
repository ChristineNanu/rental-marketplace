---
name: rentit-mpesa
description: Change or troubleshoot RentIt Nairobi M-Pesa payments, callbacks, payment polling, deposits, or payment-related monetization.
---

# RentIt M-Pesa and payment flows

Use this skill for changes involving Safaricom Daraja, booking payments, deposits, featured listings, or business subscriptions.

## Where the flow lives

- Provider requests: `backend/daraja.py`.
- Payment, callback, and payout routes and completion logic: `backend/main.py`.
- Payment records and booking payment/deposit states: `backend/models.py` and `backend/schemas.py`.
- Booking payment UI: `src/components/MpesaPaymentModal.js`.
- Feature/subscription payment UI: `src/components/SimplePaymentModal.js` and `src/components/Business.js`.

## Invariants to preserve

- A booking must be accepted before the renter can pay. The backend calculates the charge from rental total plus deposit.
- Payment records start pending. Only confirmed provider status or the explicitly development-only test-complete path may mark them complete.
- On booking payment completion, the booking becomes paid, the 12% commission applies to rental fees only, and a nonzero deposit becomes held.
- Deposit release or claim is owner-only and requires a completed booking with a held deposit. Release pays the renter; claim pays the owner and records a reason.
- Feature payments extend an existing feature period by seven days. Subscription payments extend the period by 30 days and set the user's business flag.
- Callback payloads are not trusted by themselves; preserve the existing provider confirmation before changing payment state.

Do not silently change amounts, commission, eligibility, status transitions, payout destination, or refund behavior. Never make live STK-push or B2C calls during development or verification; use mocks or the configured sandbox. Do not expose credentials or payment data in logs or frontend errors.
