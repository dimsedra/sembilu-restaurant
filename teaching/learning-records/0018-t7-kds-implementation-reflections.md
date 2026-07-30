# Learning Record 0018: T7 KDS Implementation & Code Review Reflections

**Date:** 2026-07-31
**Topic:** Kitchen Display System (KDS) API, Date Filtering, Cross-Branch Security (403), Order Status Scoping

## Context & Key Insights

1. **Today's Date Filtering (`CURRENT_DATE`)**:
   - `GET /api/staff/orders` requires `.whereRaw("DATE(orders.created_at) = CURRENT_DATE")` to prevent historical orders from cluttering the active kitchen display screen.

2. **Failing Fast on Cross-Branch Access (403 Forbidden)**:
   - Non-manager staff attempting to pass `?branch_id=X` for another branch must receive an explicit HTTP `403 Forbidden` error rather than a silent fallback.

3. **Domain Boundary Separation (Items vs Orders)**:
   - Dish item status is strictly `pending` ➔ `cooking` ➔ `done`.
   - Table order status updates via `PATCH /api/staff/orders/:id` are restricted strictly to `served` and `paid`.

## Applied Artifacts
- Lesson: [`teaching/lessons/0022-t7-kds-code-review-and-solutions.html`](file:///d:/Project%20Hub/sembilu-restaurant/teaching/lessons/0022-t7-kds-code-review-and-solutions.html)
- Router: [`server/routes/staff-orders.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/routes/staff-orders.ts)
- Test Suite: [`server/routes/staff-orders.test.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/routes/staff-orders.test.ts)
