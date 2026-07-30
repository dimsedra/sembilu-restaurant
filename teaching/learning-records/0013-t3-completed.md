# T3 completed — POST endpoint + find-or-create pattern understood

The user learned the POST pattern: browser sends data, server validates and writes to database. Key concepts: "find or create" (check by phone, then insert or update), one-to-many relationship (customer → reservations), referential integrity (FK ordering when deleting), and the importance of explicit ID mapping over array position. A real bug was found and fixed during code review (branch_id from indexOf).

**Implication:** Ready for T4 (Orders API) which uses the same POST pattern but with more complex validation (multi-item orders, branch-dish cross-validation).
