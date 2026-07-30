# ADR-0005: Kitchen Display System (KDS) and Staff Order Management

Strict state-machine item transitions (`pending` -> `cooking` -> `done`), automatic branch-scoping per JWT token with manager override, and automatic parent order status propagation.

**Context:** Staff members (waiters, chefs, managers) need real-time order management capabilities (`GET /api/staff/orders`, `PATCH /api/staff/orders/:id/items/:itemId`, `PATCH /api/staff/orders/:id`). Kitchen operations require high data reliability, strict status transitions, and zero cross-branch data leaks.

**Considered options:**
1. **Item Status State Machine:** Strict forward state transitions (`pending` -> `cooking` -> `done`) vs Permissive free-form overrides. Chosen strict state machine to prevent accidental status regression in busy kitchens.
2. **Branch Scoping & Permissions:** JWT-driven automatic branch lock for `waiter` and `chef` roles (with `403 Forbidden` on cross-branch access) vs Manager query override (`?branch_id=X`). Chosen automatic JWT lock with manager override to align with ADR-0004.
3. **Parent Order Status Propagation:** Automatic status propagation (first item cooking -> parent order `cooking`; all items done -> parent order `done`) vs Manual independent order status updates. Chosen automatic status propagation to eliminate double-clicking for kitchen staff.

**Consequence:** Staff interact with `GET /api/staff/orders` and `PATCH` endpoints. The server enforces branch boundaries based on `req.staff.branch_id`, validates item status state transitions, and automatically updates the parent order's status when item statuses advance.
