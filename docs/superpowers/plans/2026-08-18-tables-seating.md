# T9 — Tables & Seating Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the physical table management subsystem allowing staff to track and update table occupancy states (`free`, `occupied`, `reserved`) per branch.

**Architecture:**
- Create PostgreSQL `tables` table migration with `branch_id`, `table_number`, `capacity`, `status`, and `is_walk_in` fields, seeded with realistic tables for Sembilu branches.
- Implement `server/routes/staff-tables.ts` providing `GET /api/staff/tables` and `PATCH /api/staff/tables/:id` with JWT authentication and strict branch scoping.
- Mount router in `server/index.ts` and verify with comprehensive Supertest test suite.

**Tech Stack:** Node.js, Express, TypeScript, Knex.js, PostgreSQL, Vitest, Supertest.

**Spec / Reference:**
- Issue #10: `T9 — Tables + Seating`
- [`CONTEXT.md`](file:///d:/Project%20Hub/sembilu-restaurant/CONTEXT.md)
- [`server/routes/staff.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/routes/staff.ts)

## Global Constraints

- Enforce JWT staff authentication (`requireStaffAuth`).
- Scoped strictly to the staff member's `branch_id` (managers can query across branches).
- Valid table statuses: `"free"`, `"occupied"`, `"reserved"`.
- Table numbers unique per branch (`unique(["branch_id", "table_number"])`).
- Clean, descriptive tests with zero console clutter.

---

### Task 1: Database Migration for `tables` Table & Seeds

**Files:**
- Create: `server/migrations/20260818-create-tables.ts`

**Interfaces:**
- Produces: `tables` table schema in PostgreSQL

- [ ] **Step 1: Write migration file `server/migrations/20260818-create-tables.ts`**
```typescript
import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("tables", (table) => {
    table.increments("id")
    table.integer("branch_id").references("id").inTable("branches").notNullable().onDelete("CASCADE")
    table.integer("table_number").notNullable()
    table.integer("capacity").notNullable().defaultTo(4)
    table.string("status").notNullable().defaultTo("free") // "free" | "occupied" | "reserved"
    table.boolean("is_walk_in").notNullable().defaultTo(true)
    table.unique(["branch_id", "table_number"])
    table.timestamps(true, true)
  })

  // Seed tables for Tegal (branch 1), Slawi (branch 2), Jakarta (branch 4)
  const branches = [1, 2, 4]
  const tableRows: any[] = []

  for (const branchId of branches) {
    for (let t = 1; t <= 12; t++) {
      let capacity = 4
      if (t <= 4) capacity = 2
      else if (t >= 11) capacity = 8
      else if (t >= 9) capacity = 6

      tableRows.push({
        branch_id: branchId,
        table_number: t,
        capacity,
        status: "free",
        is_walk_in: t <= 9, // Tables 1-9 walk-in, 10-12 reserved
      })
    }
  }

  await knex("tables").insert(tableRows)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("tables")
}
```

- [ ] **Step 2: Run migration**
Run: `npx tsx server/migrate.ts`
Expected: PASS ("Batch X run: 1 migrations").

- [ ] **Step 3: Commit**
```bash
git add server/migrations/20260818-create-tables.ts
git commit -m "feat(db): add tables schema and seed data for branches"
```

---

### Task 2: Implement Staff Tables API & Tests

**Files:**
- Create: `server/routes/staff-tables.ts`
- Create: `server/routes/staff-tables.test.ts`
- Modify: `server/index.ts`

**Interfaces:**
- Consumes: `requireStaffAuth`, `AuthenticatedRequest` from `./staff`
- Produces: `GET /api/staff/tables`, `PATCH /api/staff/tables/:id`

- [ ] **Step 1: Write failing tests in `server/routes/staff-tables.test.ts`**
Cover:
- 401 when no token is provided.
- 403 when non-manager queries a different branch.
- 200 `GET /api/staff/tables` returns tables list ordered by `table_number`.
- 200 `PATCH /api/staff/tables/:id` updates status (`free` -> `occupied` -> `free`).
- 400 `PATCH /api/staff/tables/:id` with invalid status (`{ status: "sleeping" }`).
- 404 `PATCH /api/staff/tables/99999` for non-existent table.

- [ ] **Step 2: Run tests to verify failure**
Run: `npx vitest run server/routes/staff-tables.test.ts`
Expected: FAIL (Cannot find module / 404).

- [ ] **Step 3: Implement `server/routes/staff-tables.ts` and mount in `server/index.ts`**
```typescript
import { Router, Response } from "express"
import { db } from "../db"
import { requireStaffAuth, AuthenticatedRequest } from "./staff"

const router = Router()
const ALLOWED_TABLE_STATUSES = ["free", "occupied", "reserved"] as const

router.get("/", requireStaffAuth, async (req: AuthenticatedRequest, res: Response) => {
  const staff = req.staff!
  if (req.query.branch_id && staff.role !== "manager" && Number(req.query.branch_id) !== staff.branch_id) {
    res.status(403).json({ error: "Forbidden: Cannot access tables for another branch." })
    return
  }

  const branchId = staff.role === "manager" && req.query.branch_id ? Number(req.query.branch_id) : staff.branch_id
  const tables = await db("tables").where({ branch_id: branchId }).orderBy("table_number", "asc")
  res.json(tables)
})

router.patch("/:id", requireStaffAuth, async (req: AuthenticatedRequest, res: Response) => {
  const staff = req.staff!
  const tableId = Number(req.params.id)
  const { status } = req.body

  if (!ALLOWED_TABLE_STATUSES.includes(status)) {
    res.status(400).json({ error: `Invalid status. Allowed values: ${ALLOWED_TABLE_STATUSES.join(", ")}` })
    return
  }

  const table = await db("tables").where({ id: tableId }).first()
  if (!table) {
    res.status(404).json({ error: "Table not found" })
    return
  }

  if (staff.role !== "manager" && table.branch_id !== staff.branch_id) {
    res.status(403).json({ error: "Forbidden: Cannot modify table for another branch." })
    return
  }

  const [updated] = await db("tables")
    .where({ id: tableId })
    .update({ status, updated_at: new Date() })
    .returning("*")

  res.json(updated)
})

export default router
```

Mount in `server/index.ts`:
```typescript
import staffTablesRouter from "./routes/staff-tables"
app.use("/api/staff/tables", staffTablesRouter)
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run server/routes/staff-tables.test.ts`
Expected: PASS (all tests pass).

- [ ] **Step 5: Run full project test suite**
Run: `npx vitest run`
Expected: PASS (all test files pass).

- [ ] **Step 6: Commit**
```bash
git add server/routes/staff-tables.ts server/routes/staff-tables.test.ts server/index.ts
git commit -m "feat(api): implement staff tables list and status update endpoints"
```

---

## Verification Plan

### Automated Tests
1. `npx vitest run server/routes/staff-tables.test.ts`
2. `npx vitest run` (entire project test suite)
3. `npm run build` (production singlefile bundle)

### Manual Verification
1. Login as staff member at Tegal branch via `POST /api/staff/login`.
2. Fetch tables via `GET /api/staff/tables` and inspect tables 1–12 with their capacities.
3. Update table 4 to `occupied` via `PATCH /api/staff/tables/:id`.
