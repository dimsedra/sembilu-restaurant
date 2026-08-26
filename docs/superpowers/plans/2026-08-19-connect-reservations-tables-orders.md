# Connect Reservations, Tables, and Orders Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the dining experience across reservations, dining tables, and live orders by distinguishing walk-in tables from reserved tables and ensuring only valid reservation holders can order from reserved tables during their booked time slots.

**Architecture:** 
- Add `table_number` and `time_end` columns to the PostgreSQL `reservations` table via a new Knex migration.
- Update public (`POST /api/reservations`) and staff (`POST /api/staff/reservations`) reservation endpoints to support table assignment and calculate end time windows with a buffer.
- Add validation logic to `POST /api/orders` that checks whether a table is walk-in (`is_walk_in: true`) or reserved (`is_walk_in: false`). For reserved tables, verify that the customer's phone matches an active reservation for that table and time slot (with buffer window).
- Verify with automated Vitest / Supertest test suites covering walk-in orders, matching reservation orders, and mismatched/expired reservation rejections.

**Tech Stack:** Node.js, Express, TypeScript, Knex.js, PostgreSQL, Vitest, Supertest.

**Spec / Reference:**
- Issue #12: `Connect reservation, tables, and orders flow (walk-in vs reserved)`
- [`CONTEXT.md`](file:///d:/Project%20Hub/sembilu-restaurant/CONTEXT.md)
- [`server/routes/orders.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/routes/orders.ts)
- [`server/routes/reservations.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/routes/reservations.ts)
- [`server/routes/staff-tables.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/routes/staff-tables.ts)

## Global Constraints

- Never break existing valid walk-in orders on walk-in tables (`is_walk_in: true`, tables 1-9).
- Reserved tables (`is_walk_in: false`, tables 10-12) strictly require a matching confirmed reservation.
- Default reservation time window: 2 hours if `time_end` is not specified.
- Buffer time: 15 minutes grace period before start time and after `time_end`.
- Error messages in Indonesian matching project conventions (e.g., `"Meja ini khusus untuk reservasi. Tidak ada reservasi aktif yang cocok dengan data Anda."`).
- Clean test output with zero console clutter.

---

### Task 1: Database Migration for `reservations` Table (`table_number`, `time_end`)

**Files:**
- Create: `server/migrations/20260819-add-table-and-time-end-to-reservations.ts`

**Interfaces:**
- Produces: `table_number` (integer, nullable) and `time_end` (time, nullable) columns on `reservations` table.

- [ ] **Step 1: Write migration file `server/migrations/20260819-add-table-and-time-end-to-reservations.ts`**

```typescript
import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("reservations", (table) => {
    table.integer("table_number").nullable()
    table.time("time_end").nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("reservations", (table) => {
    table.dropColumn("time_end")
    table.dropColumn("table_number")
  })
}
```

- [ ] **Step 2: Run migration**
Run: `npx tsx server/migrate.ts`
Expected: PASS ("Batch X run: 1 migrations").

- [ ] **Step 3: Commit**
```bash
git add server/migrations/20260819-add-table-and-time-end-to-reservations.ts
git commit -m "feat(db): add table_number and time_end to reservations table"
```

---

### Task 2: Update Reservation Creation Endpoints & Table Assignment

**Files:**
- Modify: `server/routes/reservations.ts`
- Modify: `server/routes/staff-reservations.ts`
- Modify: `server/routes/reservations.test.ts`
- Modify: `server/routes/staff-reservations.test.ts`

**Interfaces:**
- Consumes: `table_number`, `time_end` in request body.
- Produces: Reservation record with assigned `table_number` and calculated/provided `time_end`.

- [ ] **Step 1: Write failing tests in `server/routes/reservations.test.ts` and `server/routes/staff-reservations.test.ts`**

Add tests for:
1. `POST /api/reservations` calculates `time_end` (defaulting to +2 hours after `time`) and assigns an available reserved table (e.g. table 10, 11, or 12 for capacity).
2. `POST /api/reservations` accepts explicit `table_number` if valid and unbooked.
3. `POST /api/staff/reservations` accepts and saves `table_number` and `time_end`.

- [ ] **Step 2: Run tests to verify failure**
Run: `npx vitest run server/routes/reservations.test.ts server/routes/staff-reservations.test.ts`
Expected: FAIL (missing fields or table assignment).

- [ ] **Step 3: Implement table assignment & `time_end` calculation in reservation routes**

Helper function to calculate default end time (+2 hours):
```typescript
function calculateDefaultEndTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number)
  const endHours = (hours + 2) % 24
  return `${String(endHours).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}:00`
}
```

In `server/routes/reservations.ts` and `server/routes/staff-reservations.ts`:
- If `table_number` is provided:
  - Verify table exists in `tables` for that `branch_id`.
  - Verify no overlapping active reservation exists for that table and date.
- If `table_number` is not provided:
  - Find an available table with `is_walk_in: false` and `capacity >= party_size` without overlapping active reservations.
  - If found, assign it.
- Compute `time_end = time_end || calculateDefaultEndTime(time)`.
- Insert into `reservations` with `table_number` and `time_end`.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run server/routes/reservations.test.ts server/routes/staff-reservations.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add server/routes/reservations.ts server/routes/staff-reservations.ts server/routes/reservations.test.ts server/routes/staff-reservations.test.ts
git commit -m "feat(api): support table assignment and end time in reservations"
```

---

### Task 3: Order Flow Table Gatekeeper (Walk-in vs Reserved Table Validation)

**Files:**
- Modify: `server/routes/orders.ts`
- Modify: `server/routes/orders.test.ts`

**Interfaces:**
- Consumes: `branch_id`, `table_number`, `phone` from `POST /api/orders`.
- Validates:
  - If table is `is_walk_in === true` -> allow order.
  - If table is `is_walk_in === false` -> check active reservation matching customer phone in current time window (with 15 min buffer).
  - If table does not exist -> return 400 (`"Meja tidak ditemukan"`).
  - If table is reserved and no valid matching reservation -> return 403 (`"Meja ini khusus untuk reservasi. Tidak ada reservasi aktif yang cocok dengan data Anda."`).

- [ ] **Step 1: Write failing tests in `server/routes/orders.test.ts`**

Add tests covering:
1. Walk-in table (e.g. table 1): order succeeds for any phone number.
2. Reserved table (e.g. table 10) with matching active reservation for today within time slot: order succeeds.
3. Reserved table with mismatched phone number: returns 403 Forbidden.
4. Reserved table with no reservation for current date/time: returns 403 Forbidden.
5. Non-existent table number: returns 400 Bad Request.

- [ ] **Step 2: Run tests to verify failure**
Run: `npx vitest run server/routes/orders.test.ts`
Expected: FAIL (orders on reserved tables succeed without reservation check).

- [ ] **Step 3: Implement validation in `server/routes/orders.ts`**

```typescript
// Query table info
const table = await db("tables").where({ branch_id, table_number }).first()
if (!table) {
  res.status(400).json({ error: "Meja tidak ditemukan di cabang ini" })
  return
}

if (!table.is_walk_in) {
  // Reserved table check
  // Check if there is an active reservation for this table today with matching customer phone
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Query confirmed reservations for this table on this date
  const activeReservations = await db("reservations")
    .join("customers", "reservations.customer_id", "customers.id")
    .where({
      "reservations.branch_id": branch_id,
      "reservations.table_number": table_number,
      "reservations.status": "confirmed",
    })
    .whereRaw("DATE(reservations.date) = DATE(?)", [todayStr])
    .select("reservations.*", "customers.phone as customer_phone")

  // Check matching customer and time window (+/- 15 min buffer)
  const matchingRes = activeReservations.find((r) => {
    if (r.customer_phone !== phone) return false

    const [startH, startM] = String(r.time).split(":").map(Number)
    const startMin = startH * 60 + startM - 15 // 15 min early buffer

    let endMin = startMin + 120 + 30 // default 2 hours + 15 min late buffer
    if (r.time_end) {
      const [endH, endM] = String(r.time_end).split(":").map(Number)
      endMin = endH * 60 + endM + 15 // 15 min late buffer
    }

    return currentMinutes >= startMin && currentMinutes <= endMin
  })

  if (!matchingRes) {
    res.status(403).json({
      error: "Meja ini khusus untuk reservasi. Tidak ada reservasi aktif yang cocok dengan data Anda.",
    })
    return
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run server/routes/orders.test.ts`
Expected: PASS (all order tests pass).

- [ ] **Step 5: Commit**
```bash
git add server/routes/orders.ts server/routes/orders.test.ts
git commit -m "feat(api): enforce reservation validation for orders on reserved tables"
```

---

### Task 4: Full Suite Regression Verification

**Files:**
- Test all existing suites

- [ ] **Step 1: Run complete test suite**
Run: `npx vitest run`
Expected: PASS (all 11+ test files pass).

- [ ] **Step 2: Run build check**
Run: `npm run build`
Expected: PASS (clean bundle generation).

---

## Verification Plan

### Automated Tests
1. `npx vitest run server/routes/reservations.test.ts`
2. `npx vitest run server/routes/staff-reservations.test.ts`
3. `npx vitest run server/routes/orders.test.ts`
4. `npx vitest run` (Full project suite)
5. `npm run build` (TypeScript and build checks)

### Manual Verification
1. Place order on walk-in table (Table 1, Tegal branch) -> order successfully created.
2. Place order on reserved table (Table 10) without reservation -> blocked with 403 error.
3. Make reservation for Table 10 -> place order using matching phone number -> order successfully created.
