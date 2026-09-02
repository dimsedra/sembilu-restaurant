# Order Lifecycle Flow-Integrity Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperbaiki 4 temuan integritas alur (Issue #22 & PR #21 review): mencegah regresi status pesanan terminal (`served`/`paid`), membatasi tombol konfirmasi pengantaran hanya saat masakan siap diambil (`isReadyForPickup`), mengamankan inisialisasi WebSocket agar menunggu login staf, dan menyelaraskan daftar cabang frontend dengan katalog database.

**Architecture:** Menerapkan defensive guards pada kalkulasi derived state backend (`server/routes/staff-orders.ts`), mengondisikan tombol aksi UI pada state kesiapan item (`WaiterOrderCard.tsx`), menyematkan token check & onerror handling pada lifecycle WebSocket (`WaiterOrdersPage.tsx`), serta memperbarui konstanta `BRANCHES` dan `KDS_BRANCHES` (`[Tegal, Slawi, Semarang, Jakarta]`).

**Tech Stack:** Express 5, TypeScript, Knex.js, React 19, Vitest, Testing Library.

**Spec:** GitHub Issue #22, GitHub PR #21 Review (`pullrequestreview-5085546119`).

## Global Constraints

- Backend runtime: Express 5 + Node.js 20+ dengan TypeScript (`tsx`).
- Database: PostgreSQL dengan query builder Knex.js.
- Frontend: React 19 SPA dengan Tailwind CSS v4.
- Zero regressions across existing 18 test suites (134 tests).

---

### Task 1: Guard Parent Order Status Against Terminal Regressions

**Files:**
- Modify: `server/routes/staff-orders.ts:135-160`
- Test: `server/routes/staff-orders.test.ts`

**Interfaces:**
- Consumes: `AuthenticatedRequest` with JWT token.
- Produces: `PATCH /api/staff/orders/:id/items/:itemId` that does not downgrade orders already in `served` or `paid` status back to `done`.

- [ ] **Step 1: Write the failing test for terminal status preservation**

Tambahkan test case pada `server/routes/staff-orders.test.ts`:
```typescript
it("does not regress parent order status from served to done when updating a line item", async () => {
  // Setup order that is already marked served
  const [order] = await db("orders").insert({
    branch_id: 1,
    table_number: 7,
    status: "served",
  }).returning("*")

  const [item1] = await db("order_items").insert({
    order_id: order.id,
    dish_id: 1,
    quantity: 1,
    status: "done",
  }).returning("*")

  const [item2] = await db("order_items").insert({
    order_id: order.id,
    dish_id: 2,
    quantity: 1,
    status: "done",
  }).returning("*")

  // Waiter marks item1 as served
  const res = await request(app)
    .patch(`/api/staff/orders/${order.id}/items/${item1.id}`)
    .set("Authorization", `Bearer ${waiterToken}`)
    .send({ status: "served" })

  expect(res.status).toBe(200)
  expect(res.body.item.status).toBe("served")
  // Parent order MUST stay served, not regress back to done
  expect(res.body.order.status).toBe("served")
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/routes/staff-orders.test.ts`
Expected: FAIL with expected `served` but received `done`

- [ ] **Step 3: Update parent order status derivation logic in `server/routes/staff-orders.ts`**

Perbarui logika derived-status di `server/routes/staff-orders.ts`:
```typescript
const TERMINAL_OR_ADVANCED_STATUSES = ["served", "paid", "cancelled"]

let newOrderStatus = order.status
if (!TERMINAL_OR_ADVANCED_STATUSES.includes(order.status)) {
  const allItems = await db("order_items").where({ order_id: orderId })
  const allDoneOrServed = allItems.length > 0 && allItems.every((i) => i.status === "done" || i.status === "served")
  const allServed = allItems.length > 0 && allItems.every((i) => i.status === "served")
  const anyCookingOrDoneOrServed = allItems.some(
    (i) => i.status === "cooking" || i.status === "done" || i.status === "served"
  )

  if (allServed) {
    newOrderStatus = "served"
  } else if (allDoneOrServed) {
    newOrderStatus = "done"
  } else if (anyCookingOrDoneOrServed && order.status === "pending") {
    newOrderStatus = "cooking"
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run server/routes/staff-orders.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/routes/staff-orders.ts server/routes/staff-orders.test.ts
git commit -m "fix(api): prevent parent order status regression on terminal states"
```

---

### Task 2: Fix Delivery Confirmation Action Condition in `WaiterOrderCard.tsx`

**Files:**
- Modify: `src/components/staff/WaiterOrderCard.tsx:110-135`
- Test: `src/components/staff/WaiterOrderCard.test.tsx`

**Interfaces:**
- Consumes: `isReadyForPickup` and `isAllServed` flags.
- Produces: Action footer displaying active "Konfirmasi Telah Diantar ke Meja" button ONLY when `isReadyForPickup && !isAllServed`, displaying waiting indicator when cooking, and served label when all served.

- [ ] **Step 1: Write the failing test for pending/cooking order action state**

Tambahkan test case di `src/components/staff/WaiterOrderCard.test.tsx`:
```tsx
it("disables or hides serve action button when order is still cooking", () => {
  const mockOrderCooking: KDSOrder = {
    id: 102,
    branch_id: 1,
    table_number: 3,
    status: "cooking",
    customer_name: "Mas Teguh",
    created_at: new Date().toISOString(),
    items: [
      {
        id: 2,
        dish_id: 10,
        dish_name: "Ikan Bakar Pantura",
        quantity: 1,
        status: "cooking",
      },
    ],
  }

  render(<WaiterOrderCard order={mockOrderCooking} onServeOrder={vi.fn()} />)

  expect(screen.queryByRole("button", { name: /Telah Diantar/i })).not.toBeInTheDocument()
  expect(screen.getByText(/Menunggu Dapur Menyelesaikan Masakan/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/staff/WaiterOrderCard.test.tsx`
Expected: FAIL

- [ ] **Step 3: Update `WaiterOrderCard.tsx`**

Perbarui footer di `src/components/staff/WaiterOrderCard.tsx`:
```tsx
{/* Action Footer */}
<div className="pt-2">
  {isReadyForPickup && !isAllServed ? (
    <button
      type="button"
      onClick={() => onServeOrder(order.id)}
      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-emas px-4 py-2.5 font-sans text-sm font-semibold text-ink shadow transition hover:bg-emas-bright active:scale-[0.98]"
    >
      <CheckCircleIcon className="h-4 w-4" />
      Konfirmasi Telah Diantar ke Meja
    </button>
  ) : isAllServed ? (
    <div className="flex min-h-[44px] items-center justify-center text-xs font-semibold text-muted">
      Pesanan telah diantar ke Meja {order.table_number}
    </div>
  ) : (
    <div className="flex min-h-[44px] items-center justify-center rounded-lg border border-line bg-ink-3/40 text-xs font-medium text-cream-dim">
      <FlameIcon className="mr-1.5 h-3.5 w-3.5 text-bata" />
      Menunggu Dapur Menyelesaikan Masakan
    </div>
  )}
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/staff/WaiterOrderCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/staff/WaiterOrderCard.tsx src/components/staff/WaiterOrderCard.test.tsx
git commit -m "fix(ui): restrict delivery confirmation action to ready-for-pickup orders"
```

---

### Task 3: Gate WebSocket Initialization & Error Handling in `WaiterOrdersPage.tsx`

**Files:**
- Modify: `src/pages/WaiterOrdersPage.tsx:80-115`
- Test: `src/pages/WaiterOrdersPage.test.tsx`

**Interfaces:**
- Consumes: `getStaffToken()`.
- Produces: Guarded WebSocket connection that connects only when authenticated, handles `ws.onerror = () => setWsConnected(false)`, and re-evaluates when `staffUser` changes.

- [ ] **Step 1: Write test for unauthenticated WebSocket guard**

Tambahkan test case di `src/pages/WaiterOrdersPage.test.tsx`:
```tsx
it("does not initiate WebSocket connection when staff token is absent", () => {
  ;(staffAuth.getStaffToken as any).mockReturnValue(null)
  ;(staffAuth.getStaffUser as any).mockReturnValue(null)

  const wsSpy = vi.spyOn(global, "WebSocket" as any)

  render(<WaiterOrdersPage />)

  expect(wsSpy).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/WaiterOrdersPage.test.tsx`
Expected: FAIL with WebSocket being called

- [ ] **Step 3: Update WebSocket `useEffect` in `src/pages/WaiterOrdersPage.tsx`**

Perbarui hook WebSocket di `src/pages/WaiterOrdersPage.tsx`:
```tsx
useEffect(() => {
  if (!getStaffToken()) return

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  const wsUrl = `${protocol}//${window.location.hostname}:3001`
  const ws = new WebSocket(wsUrl)
  wsRef.current = ws

  ws.onopen = () => setWsConnected(true)
  ws.onclose = () => setWsConnected(false)
  ws.onerror = () => setWsConnected(false)
  ws.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data)
      if (payload.type === "order_created" || payload.type === "order_updated") {
        if (payload.order?.status === "done" && !isMuted) {
          playKitchenBell(false)
        }
        fetchOrders()
      }
    } catch {
      // ignore malformed ws message
    }
  }

  return () => {
    ws.close()
  }
}, [fetchOrders, isMuted, staffUser])
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/WaiterOrdersPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/WaiterOrdersPage.tsx src/pages/WaiterOrdersPage.test.tsx
git commit -m "fix(ui): gate WebSocket connection behind staff authentication and handle socket errors"
```

---

### Task 4: Align Branch Metadata Across Staff Pages

**Files:**
- Modify: `src/pages/WaiterOrdersPage.tsx:25-30`
- Modify: `src/pages/KDSPage.tsx:28-35`
- Test: Full test suite verification

**Interfaces:**
- Consumes: Canonical branches from database seed (`1: Tegal, 2: Slawi, 3: Semarang, 4: Jakarta`).
- Produces: Synced `BRANCHES` and `KDS_BRANCHES` constants.

- [ ] **Step 1: Update `BRANCHES` in `src/pages/WaiterOrdersPage.tsx` and `src/pages/KDSPage.tsx`**

Perbarui array cabang di `src/pages/WaiterOrdersPage.tsx`:
```typescript
export const BRANCHES = [
  { id: 1, name: "Tegal" },
  { id: 2, name: "Slawi" },
  { id: 3, name: "Semarang" },
  { id: 4, name: "Jakarta" },
]
```

Dan di `src/pages/KDSPage.tsx`:
```typescript
export const KDS_BRANCHES = [
  { id: 1, name: "Tegal" },
  { id: 2, name: "Slawi" },
  { id: 3, name: "Semarang" },
  { id: 4, name: "Jakarta" },
]
```

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: PASS all 18 test files (135+ tests).

- [ ] **Step 3: Commit**

```bash
git add src/pages/WaiterOrdersPage.tsx src/pages/KDSPage.tsx
git commit -m "fix(metadata): align staff branch dropdown choices with database seed branches"
```
