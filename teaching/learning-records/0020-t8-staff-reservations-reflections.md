# Learning Record 0020: T8 Staff Reservations Implementation & Refactor Reflections

**Date:** 2026-08-03
**Topic:** Host Stand Reservations API, Unified Branch Security Helper, PostgreSQL `CURRENT_DATE`, Customer Phone Upsert

## Context & Key Insights

1. **Unified Security Helper (`resolveBranchAccess`)**:
   - Centralized manager branch override and non-manager branch lock logic into one helper.
   - Consistently returns HTTP `403 Forbidden` for any unauthorized cross-branch attempt across `GET`, `PATCH`, and `POST`.

2. **Database Local Date Scoping (`CURRENT_DATE`)**:
   - Switched default date filtering from Node.js `.toISOString()` to PostgreSQL `CURRENT_DATE` to prevent timezone mismatches in UTC+7 during early morning hours.

3. **Host Stand Customer VIP Recognition**:
   - Joined `customers` data (`name`, `phone`, `visit_count`) on reservation queries to enable hosts to greet returning VIP guests.

## Applied Artifacts
- Lesson: [`teaching/lessons/0024-t8-staff-reservations-refactor-reflections.html`](file:///d:/Project%20Hub/sembilu-restaurant/teaching/lessons/0024-t8-staff-reservations-refactor-reflections.html)
- Router: [`server/routes/staff-reservations.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/routes/staff-reservations.ts)
- Test Suite: [`server/routes/staff-reservations.test.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/routes/staff-reservations.test.ts)
