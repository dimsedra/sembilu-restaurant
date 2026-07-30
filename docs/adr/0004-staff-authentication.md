# ADR-0004: Staff authentication and role-based branch scoping

Stateless JWT authentication using pure JavaScript `bcryptjs` for password hashing and single-table role storage (`staff` table with `role` and `branch_id` columns).

**Context:** Staff members (waiters, chefs, managers) need secure access to internal operation routes (`/api/staff/*`). Requests must be authenticated, role-verified, and branch-scoped so staff at one branch cannot manipulate data at another branch.

**Considered options:**
1. **Password Hashing:** `bcryptjs` vs `crypto.scrypt` vs `argon2`. Chosen `bcryptjs` for zero-friction cross-platform execution on Windows without native C++ compilation issues.
2. **Token Transmission:** Stateless `Authorization: Bearer <token>` HTTP Header vs HTTP-Only Cookie vs Server Sessions. Chosen Bearer Header for REST API standard compliance, zero DB lookup overhead per request, and straightforward testing with Supertest.
3. **Database Schema:** Single `staff` table with `role` and `branch_id` vs separate role tables vs 5-table Enterprise RBAC. Chosen single `staff` table because staff roles are static (`waiter`, `chef`, `manager`), and columns map 1:1 with JWT payload claims `{ staff_id, role, branch_id }`.

**Consequence:** Staff log in via `POST /api/staff/login` receiving a 8-hour signed JWT. Protected staff routes check `req.headers.authorization`, verify the signature, and attach `req.staff` (`{ staff_id, role, branch_id }`) for downstream route handlers.
