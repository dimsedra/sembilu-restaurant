# T6 Staff Auth Architecture — Password Hashing, JWT & Single-Table Schema

The user completed the `/grill-with-docs` alignment session for T6 (Staff Auth) and mastered the core security concepts:

1. **Password Hashing:** Selected pure JS `bcryptjs` over native `argon2`/`node:crypto` for zero-friction cross-platform execution on Windows without native C++ compiler issues. Understands salting, work factors, and fast vs slow hashing algorithms.
2. **Token Transmission:** Selected stateless JWT in `Authorization: Bearer <token>` HTTP Headers over HTTP-Only Cookies or server sessions. Understands that HTTP is stateless and how Bearer headers pass identity on every request.
3. **JWT Mechanics:** Understood the 3 parts of a JWT (`Header.Payload.Signature`), Base64 encoding vs encryption, and how server-side `HMAC-SHA256` signatures prevent client-side token tampering.
4. **Database Schema:** Selected single `staff` table (`role: 'waiter'|'chef'|'manager'` + `branch_id` FK) over anti-pattern separate role tables or over-engineered 5-table RBAC. Columns map 1:1 with JWT payload claims `{ staff_id, role, branch_id }`.
5. **Secret Management:** Selected `process.env.JWT_SECRET` (with dev fallback) + `8h` shift expiration, adhering to 12-Factor App secret security.

**Implication:** Ready to implement T6 (Staff Auth) using TDD (red-green-refactor) via `/implement`.
