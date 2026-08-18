# Order Tracking Backend & Order Creation Broadcast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the customer order tracking endpoint (`GET /api/orders/:id/track`) and broadcast the `order_created` WebSocket event when new orders are placed via `POST /api/orders`.

**Architecture:**
- [`server/routes/orders.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/routes/orders.ts) gains the new `GET /:id/track` route, returning joined customer, branch, order, and detailed item data (dish names, prices, sambal names, heat levels).
- `POST /api/orders` triggers `broadcastOrderUpdate()` from [`server/websocket.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/websocket.ts) with `event: "order_created"`.
- Vitest test suite in [`server/routes/orders.test.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/routes/orders.test.ts) covers the tracking route and broadcast invocation.

**Tech Stack:** Node.js, Express, Knex.js, PostgreSQL, `ws`, Vitest, Supertest.

**Spec / Reference:**
- Issue #7: `T5 — Order Tracking + WebSocket`
- [`CONTEXT.md`](file:///d:/Project%20Hub/sembilu-restaurant/CONTEXT.md)
- [`docs/superpowers/plans/2026-08-18-websocket-real-time-order-tracking.md`](file:///d:/Project%20Hub/sembilu-restaurant/docs/superpowers/plans/2026-08-18-websocket-real-time-order-tracking.md)

## Global Constraints

- Keep things simple and minimal (YAGNI).
- Human-friendly, structured JSON responses.
- Clear error handling (404 for non-existent orders, 400 for invalid requests).
- Comprehensive test coverage with clean logs.

---

### Task 1: Trigger `order_created` WebSocket Broadcast on Order Placement

**Files:**
- Modify: `server/routes/orders.ts:50-54`
- Modify: `server/routes/orders.test.ts`

**Interfaces:**
- Consumes: `broadcastOrderUpdate` from `../websocket`

- [ ] **Step 1: Write failing test verifying `POST /api/orders` calls `broadcastOrderUpdate` with `order_created`**

```typescript
it("broadcasts order_created event via WebSocket when order is created", async () => {
  const broadcastSpy = vi.spyOn(websocket, "broadcastOrderUpdate")
  const res = await request(app).post("/api/orders").send({
    name: "Budi",
    phone: "0813-9999-9999",
    branch_id: 1,
    table_number: 4,
    items: [{ dish_id: 1, quantity: 2 }],
  })
  expect(res.status).toBe(201)
  expect(broadcastSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      event: "order_created",
      orderId: res.body.order.id,
      status: "pending",
    })
  )
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run server/routes/orders.test.ts`
Expected: FAIL (broadcast not yet triggered from `server/routes/orders.ts`).

- [ ] **Step 3: Implement broadcast in `server/routes/orders.ts`**
Import `broadcastOrderUpdate` and call it right after saving `order` and `order_items`:
```typescript
broadcastOrderUpdate({
  event: "order_created",
  orderId: order.id,
  status: order.status || "pending",
  items: savedItems,
})
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run server/routes/orders.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add server/routes/orders.ts server/routes/orders.test.ts
git commit -m "feat(orders): broadcast order_created WebSocket event on order placement"
```

---

### Task 2: Implement `GET /api/orders/:id/track` Endpoint

**Files:**
- Modify: `server/routes/orders.ts`
- Modify: `server/routes/orders.test.ts`

**Interfaces:**
- Produces: `GET /api/orders/:id/track` -> `{ order, customer: { name, phone }, branch: { id, name }, items: [...] }`

- [ ] **Step 1: Write failing tests for `GET /api/orders/:id/track`**

```typescript
describe("GET /api/orders/:id/track", () => {
  it("returns detailed tracking information including joined dish and sambal info", async () => {
    const create = await request(app).post("/api/orders").send({
      name: "Sari",
      phone: "0813-8888-8888",
      branch_id: 1,
      table_number: 7,
      items: [{ dish_id: 1, quantity: 2, sambal_id: 1, notes: "Extra pedas" }],
    })
    const orderId = create.body.order.id

    const res = await request(app).get(`/api/orders/${orderId}/track`)
    expect(res.status).toBe(200)
    expect(res.body.order.id).toBe(orderId)
    expect(res.body.order.table_number).toBe(7)
    expect(res.body.customer.name).toBe("Sari")
    expect(res.body.branch.id).toBe(1)
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0]).toHaveProperty("dish_name")
    expect(res.body.items[0]).toHaveProperty("dish_price")
    expect(res.body.items[0]).toHaveProperty("sambal_name")
    expect(res.body.items[0].notes).toBe("Extra pedas")
  })

  it("returns 404 for non-existent order id", async () => {
    const res = await request(app).get("/api/orders/99999/track")
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/tidak ditemukan/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run server/routes/orders.test.ts`
Expected: FAIL (404 / route not implemented).

- [ ] **Step 3: Implement `GET /:id/track` in `server/routes/orders.ts`**
Fetch order, branch, customer, and join `order_items` with `dishes` and `sambals`:
```typescript
router.get("/:id/track", async (req, res) => {
  const orderId = Number(req.params.id)
  const order = await db("orders").where({ id: orderId }).first()
  if (!order) {
    res.status(404).json({ error: "Pesanan tidak ditemukan" })
    return
  }

  const customer = await db("customers").where({ id: order.customer_id }).select("name", "phone").first()
  const branch = await db("branches").where({ id: order.branch_id }).select("id", "name", "city").first()

  const items = await db("order_items")
    .join("dishes", "order_items.dish_id", "dishes.id")
    .leftJoin("sambals", "order_items.sambal_id", "sambals.id")
    .where("order_items.order_id", orderId)
    .select(
      "order_items.id",
      "order_items.order_id",
      "order_items.dish_id",
      "order_items.quantity",
      "order_items.status",
      "order_items.notes",
      "order_items.sambal_extra",
      "dishes.name as dish_name",
      "dishes.price as dish_price",
      "sambals.name as sambal_name",
      "sambals.heat_level as sambal_heat_level"
    )

  res.json({
    order,
    customer,
    branch,
    items,
  })
})
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run server/routes/orders.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add server/routes/orders.ts server/routes/orders.test.ts
git commit -m "feat(orders): add GET /api/orders/:id/track with joined dish and sambal details"
```

---

## Verification Plan

### Automated Tests
1. `npx vitest run server/routes/orders.test.ts`
2. Full suite run: `npx vitest run`

### Manual Verification
1. Place order via `POST /api/orders` and check WebSocket event.
2. Call `GET /api/orders/:id/track` with Postman/cURL to inspect JSON response structure.
