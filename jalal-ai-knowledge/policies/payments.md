# Payments Policy

**Source:** `src/lib/infoPages.ts` (terms, faqs) | **Verified:** partial

## Accepted methods

- **Cash on delivery (COD)** — available for confirmed standard orders in supported areas
- **Bank transfer** — for confirmed orders
- **Online card payments** — planned for a later phase (not yet live)

## Payment status (orders)

Live order payment status comes from the order database (`PENDING`, etc.) — not from this document.

## Custom / quotation orders

Require confirmation before dispatch. COD may not apply until order is confirmed.

## Assistant rule

Never collect or store payment card details. For payment failures, see `support/payment-failure.md`.
