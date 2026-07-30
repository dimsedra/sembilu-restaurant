# Learning Record 0017: T7 Staff Order Management & KDS Shaping

**Date:** 2026-07-31
**Topic:** Kitchen Display System (KDS), Strict Item State Machine, Branch Scoping, Parent Status Auto-Syncing

## Context & Key Insights

1. **Strict Item State Machine**:
   - Items move strictly forward: `pending` ➔ `cooking` ➔ `done`.
   - Invalid jumps (e.g. `done` ➔ `pending`) are blocked at the API boundary with HTTP `400 Bad Request`.

2. **Multi-Branch Isolation (ADR-0005)**:
   - `GET /api/staff/orders` automatically scopes queries to `req.staff.branch_id` for waiters and chefs.
   - Cross-branch edit attempts by non-managers return HTTP `403 Forbidden`.
   - Managers retain oversight capability via `?branch_id=X` query params.

3. **Parent Order Auto-Propagation**:
   - First dish moving to `cooking` automatically updates parent `orders.status` to `cooking`.
   - Final dish moving to `done` automatically updates parent `orders.status` to `done` (signaling table food is ready for delivery).

## Applied Artifacts
- ADR: [`docs/adr/0005-staff-order-management-and-kds.md`](file:///d:/Project%20Hub/sembilu-restaurant/docs/adr/0005-staff-order-management-and-kds.md)
- Domain Glossary: [`CONTEXT.md`](file:///d:/Project%20Hub/sembilu-restaurant/CONTEXT.md#kitchen-display-system-kds--staff-order-management)
- Lesson: [`teaching/lessons/0021-t7-kds-and-staff-order-management.html`](file:///d:/Project%20Hub/sembilu-restaurant/teaching/lessons/0021-t7-kds-and-staff-order-management.html)
