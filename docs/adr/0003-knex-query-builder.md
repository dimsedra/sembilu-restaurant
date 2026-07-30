# ADR-0003: Knex as the database query builder

We chose **knex** (over Drizzle, raw `pg`, or Prisma) as the database access layer.

**Context:** The user has prior experience with Convex (a query builder-like API) and wanted a query builder — not raw SQL, not an ORM. Knexx was chosen over Drizzle because its chain methods (`.where().select().join()`) mirror SQL structure closely, making the SQL visible through the abstraction. Its built-in migration system also provides explicit schema versioning without additional tools.

**Considered options:** Drizzle (TypeScript-native but more magic), raw `pg` (too verbose for initial build), Prisma (hides SQL entirely, schema-first DSL).

**Consequence:** Queries will look like `knex('orders').where({ branch_id }).select('*')`. Migrations live in `migrations/` and are run via the knex CLI. The SQL being generated is always visible in the chain.
