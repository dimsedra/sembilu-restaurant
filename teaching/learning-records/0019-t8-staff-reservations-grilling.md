# Learning Record 0019: T8 Staff Reservations View & Guest Check-In Shaping

**Date:** 2026-08-03
**Topic:** Host Stand Reservation View, Customer SQL Join, VIP Visit Count Tracking, Guest Check-In Status Lifecycle, Phone Reservation Upsert

## Context & Key Insights

1. **Host Timeline & Customer Join**:
   - `GET /api/staff/reservations` defaults to `date = CURRENT_DATE` (today) sorted by `time ASC`.
   - Performs a SQL `JOIN` on `customers` to expose `name`, `phone`, and `visit_count` (enabling host VIP guest recognition).
   - Allows optional `?date=YYYY-MM-DD` query override for upcoming shift planning.

2. **Guest Check-In Lifecycle (ADR-0006)**:
   - `PATCH /api/staff/reservations/:id/status` updates reservation status between `confirmed`, `completed` (check-in/seated), and `cancelled` (cancellation/no-show).
   - Branch-isolated via `requireStaffAuth` (`403 Forbidden` for unauthorized cross-branch edits).

3. **Phone Reservation Creation**:
   - `POST /api/staff/reservations` allows staff to take phone bookings.
   - Automatically checks phone number in `customers` table: increments `visit_count` if returning guest, or inserts a new customer if first visit.

## Applied Artifacts
- ADR: [`docs/adr/0006-staff-reservations-management.md`](file:///d:/Project%20Hub/sembilu-restaurant/docs/adr/0006-staff-reservations-management.md)
- Domain Glossary: [`CONTEXT.md`](file:///d:/Project%20Hub/sembilu-restaurant/CONTEXT.md#staff-reservations--guest-check-in)
- Lesson: [`teaching/lessons/0023-t8-staff-reservations-view.html`](file:///d:/Project%20Hub/sembilu-restaurant/teaching/lessons/0023-t8-staff-reservations-view.html)
