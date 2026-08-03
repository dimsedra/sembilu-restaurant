# ADR-0006: Staff Reservations View and Guest Check-In Management

Today's date default query filter (`date = CURRENT_DATE`) with `?date=YYYY-MM-DD` query override, customer SQL join for VIP visit count tracking, direct enum status updates (`confirmed` -> `completed` / `cancelled`), and phone reservation creation with customer upsert.

**Context:** Floor staff (hosts, waiters, managers) need dedicated staff endpoints (`GET /api/staff/reservations`, `PATCH /api/staff/reservations/:id/status`, `POST /api/staff/reservations`) to manage incoming bookings, greet returning guests, process check-ins, and record phone reservations.

**Considered options:**
1. **Date Scoping & Customer Data:** Default today's date query (`CURRENT_DATE`) + `?date=YYYY-MM-DD` query override + SQL JOIN on `customers` vs Unfiltered all-time list. Chosen today's date default with customer JOIN to give hosts a clean, actionable daily timeline and guest visit history.
2. **Reservation Status Lifecycle:** Direct alignment with existing database enum (`confirmed`, `cancelled`, `completed`) via `PATCH /api/staff/reservations/:id/status` vs Running a database migration to alter PostgreSQL enum to `seated`/`no_show`. Chosen direct enum alignment to avoid database migration overhead.
3. **Staff Reservation Creation:** `POST /api/staff/reservations` with automatic branch assignment (`req.staff.branch_id`) and customer phone upsert vs Customer-only website booking. Chosen staff creation endpoint to allow hosts to record phone bookings directly from the staff portal.

**Consequence:** Staff endpoints are protected by `requireStaffAuth`. Waiters and hosts are branch-locked (`req.staff.branch_id`), while managers can query other branches via `?branch_id=X`.
