# Learning Record 0016: T6 Staff Auth Implementation & Refactoring Reflections

**Date:** 2026-07-30
**Topic:** Staff Authentication (T6), Knex Seeds vs Migrations, 12-Factor JWT Secrets, Runtime Type Guards

## Context & Key Insights

1. **Password Hashing with `bcryptjs`**:
   - `bcrypt.hash(password, 10)` generates a 60-character salted hash.
   - `bcrypt.compare(password, hash)` securely verifies password validity without ever decrypting or storing plain text passwords.

2. **Stateless JWT Authorization**:
   - `POST /api/staff/login` signs a stateless token containing `{ staff_id, role, branch_id }` with an 8-hour shift expiration (`expiresIn: "8h"`).
   - Protected Express middleware (`requireStaffAuth`) verifies `Authorization: Bearer <token>`, eliminating database lookup overhead on every staff API call.

3. **DDL vs DML Database Separation**:
   - Migration files (`migrations/*.ts`) must remain pure **DDL (Data Definition Language)** (e.g. `createTable`, `dropTable`).
   - Static test/demo data inserts belong in dedicated Knex seeds (`seeds/01_staff.ts`) to avoid foreign key dependency crashes during clean database setup.

4. **Runtime Type Validation vs TypeScript Type Assertions**:
   - `as StaffPayload` type assertions tell TypeScript to trust data blindly without checking runtime shapes.
   - `isValidStaffPayload(decoded)` implements explicit runtime type checking (positive integer IDs, role literals in `VALID_STAFF_ROLES`), guaranteeing true end-to-end security.

## Applied Artifacts
- Lesson: [`teaching/lessons/0020-t6-staff-auth-implementation-and-refactor.html`](file:///d:/Project%20Hub/sembilu-restaurant/teaching/lessons/0020-t6-staff-auth-implementation-and-refactor.html)
- Migration: [`server/migrations/20260730-create-staff.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/migrations/20260730-create-staff.ts)
- Seeds: [`server/seeds/01_staff.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/seeds/01_staff.ts)
- Routes & Middleware: [`server/routes/staff.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/routes/staff.ts)
