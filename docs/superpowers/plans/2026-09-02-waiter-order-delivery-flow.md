# Waiter Order Delivery Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun antarmuka operasional khusus Waiter/Runner (`/staff/orders`) dan menyempurnakan alur transisi status pengantaran hidangan ke meja tamu (`served`), memisahkan tugas koki dapur (fokus memasak sampai `done`) dengan tugas waiter (konfirmasi piring telah diantar ke meja tamu).

**Architecture:** Memanfaatkan REST API `PATCH /api/staff/orders/:id` dan `PATCH /api/staff/orders/:id/items/:itemId` dengan dukungan transisi status `done` -> `served`. Di frontend, membangun halaman `WaiterOrdersPage` dan komponen `WaiterOrderCard` dengan sinkronisasi real-time WebSocket, filter status (Siap Diantar, Dimasak, Tersaji), badge hitungan meja siap antar, dan audio chime ketika pesanan siap saji.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Express 5, Knex.js, PostgreSQL, WebSocket (`ws`), Vitest, Testing Library.

**Spec:** `CONTEXT.md` (Section Staff Realm Routes: `/staff/orders`), `docs/adr/ADR-0005-deterministic-kitchen-state-machine.md`.

## Global Constraints

- Backend runtime: Express 5 + Node.js 20+ dengan TypeScript (`tsx`).
- Database: PostgreSQL dengan query builder Knex.js.
- Frontend: React 19 SPA dengan Tailwind CSS v4 dan React Router v7.
- Visual Identity: Tema Candlelit Heirloom (palet `#14110d`, `#f4ead3`, `#c9a24b`, `#b84a30`).
- Touch target minimal 44px untuk kemudahan operasional tablet/mobile waiter.

---

### Task 1: Backend Transition Guard Update (`done` -> `served`)

**Files:**
- Modify: `server/routes/staff-orders.ts:8-12`
- Test: `server/routes/staff-orders.test.ts`

**Interfaces:**
- Consumes: `AuthenticatedRequest` with JWT token.
- Produces: `PATCH /api/staff/orders/:id/items/:itemId` supporting `newStatus: "served"` when current status is `done`.

- [ ] **Step 1: Write the failing test for line-item `done` -> `served` transition**

Tambahkan test case pada `server/routes/staff-orders.test.ts`:
```typescript
it("allows waiter to transition item status from done to served", async () => {
  // Setup order with cooking item
  const [order] = await db("orders").insert({
    branch_id: 1,
    table_number: 4,
    status: "cooking",
  }).returning("*")

  const [item] = await db("order_items").insert({
    order_id: order.id,
    dish_id: 1,
    quantity: 1,
    status: "done",
  }).returning("*")

  const res = await request(app)
    .patch(`/api/staff/orders/${order.id}/items/${item.id}`)
    .set("Authorization", `Bearer ${waiterToken}`)
    .send({ status: "served" })

  expect(res.status).toBe(200)
  expect(res.body.item.status).toBe("served")
  expect(res.body.order.status).toBe("served")
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/routes/staff-orders.test.ts`
Expected: FAIL with `Invalid transition from done to served`

- [ ] **Step 3: Update `VALID_ITEM_TRANSITIONS` in `server/routes/staff-orders.ts`**

Ubah `VALID_ITEM_TRANSITIONS` di `server/routes/staff-orders.ts`:
```typescript
const VALID_ITEM_TRANSITIONS: Record<string, string> = {
  pending: "cooking",
  cooking: "done",
  done: "served",
}
```
Dan pastikan kalkulasi status order induk memperhitungkan `served`:
```typescript
const allDoneOrServed = allItems.every((i) => i.status === "done" || i.status === "served")
const anyServed = allItems.some((i) => i.status === "served")
const allServed = allItems.every((i) => i.status === "served")

if (allServed) {
  newOrderStatus = "served"
} else if (allDoneOrServed) {
  newOrderStatus = "done"
} else if (anyCooking && order.status === "pending") {
  newOrderStatus = "cooking"
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run server/routes/staff-orders.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/routes/staff-orders.ts server/routes/staff-orders.test.ts
git commit -m "feat(api): allow item transition from done to served in staff orders"
```

---

### Task 2: Waiter Order Card Component (`WaiterOrderCard.tsx`)

**Files:**
- Create: `src/components/staff/WaiterOrderCard.tsx`
- Test: `src/components/staff/WaiterOrderCard.test.tsx`

**Interfaces:**
- Consumes: `KDSOrder` type from `KDSAggregateBar.ts`, action callback `onServeOrder(orderId: number)`.
- Produces: Visual card displaying table number, elapsed time, list of items with sambal, and a primary action button "Konfirmasi Telah Diantar (Sajikan)".

- [ ] **Step 1: Write the failing test for `WaiterOrderCard`**

Buat file `src/components/staff/WaiterOrderCard.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { WaiterOrderCard } from "./WaiterOrderCard"
import { KDSOrder } from "./KDSAggregateBar"

const mockOrderReady: KDSOrder = {
  id: 101,
  branch_id: 1,
  table_number: 5,
  status: "done",
  customer_name: "Mas Budi",
  created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  items: [
    {
      id: 1,
      dish_id: 10,
      dish_name: "Ikan Bakar Pantura",
      quantity: 2,
      sambal_name: "Sambal Terasi",
      heat: 3,
      status: "done",
      notes: "Jangan terlalu gosong",
    },
  ],
}

describe("WaiterOrderCard", () => {
  it("renders table number, customer name, and done status badge", () => {
    render(<WaiterOrderCard order={mockOrderReady} onServeOrder={vi.fn()} />)

    expect(screen.getByText(/Meja 5/i)).toBeInTheDocument()
    expect(screen.getByText(/Mas Budi/i)).toBeInTheDocument()
    expect(screen.getByText(/Siap Diantar/i)).toBeInTheDocument()
  })

  it("calls onServeOrder when 'Konfirmasi Telah Diantar' button is clicked", () => {
    const handleServe = vi.fn()
    render(<WaiterOrderCard order={mockOrderReady} onServeOrder={handleServe} />)

    const serveBtn = screen.getByRole("button", { name: /Telah Diantar/i })
    fireEvent.click(serveBtn)

    expect(handleServe).toHaveBeenCalledWith(101)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/staff/WaiterOrderCard.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `WaiterOrderCard.tsx`**

Buat file `src/components/staff/WaiterOrderCard.tsx`:
```tsx
import React from "react"
import { cn } from "../../utils/cn"
import { KDSOrder } from "./KDSAggregateBar"
import { formatElapsedTimer, getElapsedSeconds } from "./KDSTicketCard"
import { CheckCircleIcon, FlameIcon, ChiliIcon } from "./icons"

interface WaiterOrderCardProps {
  order: KDSOrder
  onServeOrder: (orderId: number) => void
  onServeItem?: (orderId: number, itemId: number) => void
}

export function WaiterOrderCard({ order, onServeOrder, onServeItem }: WaiterOrderCardProps) {
  const elapsed = getElapsedSeconds(order.created_at)
  const isReadyForPickup = order.status === "done" || order.items.every((i) => i.status === "done" || i.status === "served")
  const isAllServed = order.status === "served" || order.items.every((i) => i.status === "served")

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border p-4 shadow-lg transition-all",
        isReadyForPickup && !isAllServed
          ? "border-emas bg-ink-2 ring-2 ring-emas/30"
          : isAllServed
          ? "border-line/60 bg-ink-2/50 opacity-75"
          : "border-line bg-ink-2"
      )}
    >
      {/* Header Meja & Info */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emas font-display text-lg font-bold text-ink">
            {order.table_number}
          </span>
          <div>
            <h3 className="font-display font-semibold text-cream">Meja {order.table_number}</h3>
            <p className="text-xs text-cream-dim">{order.customer_name || "Tamu Walk-in"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded bg-ink-3 px-2 py-1 font-mono text-xs text-cream-dim">
            ⏱ {formatElapsedTimer(elapsed)}
          </span>
          {isReadyForPickup && !isAllServed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emas/15 px-2.5 py-0.5 text-xs font-semibold text-emas">
              <span className="h-1.5 w-1.5 rounded-full bg-emas animate-pulse" />
              Siap Diantar
            </span>
          ) : isAllServed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              ✓ Tersaji
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-950 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
              <FlameIcon className="h-3 w-3" /> Sedang Dimasak
            </span>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="my-3 flex-1 space-y-2">
        {order.items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-start justify-between rounded-lg p-2.5 text-sm",
              item.status === "done"
                ? "bg-emas/10 border border-emas/30"
                : item.status === "served"
                ? "bg-emerald-950/20 border border-emerald-800/30"
                : "bg-ink-3/60 border border-line/40"
            )}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emas">{item.quantity}x</span>
                <span className="font-medium text-cream">{item.dish_name}</span>
              </div>
              {item.sambal_name && (
                <div className="mt-1 flex items-center gap-1 text-xs text-cream-dim">
                  <ChiliIcon className="h-3 w-3 text-bata" />
                  <span>{item.sambal_name}</span>
                </div>
              )}
              {item.notes && <p className="mt-0.5 text-xs italic text-muted">"{item.notes}"</p>}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-medium",
                  item.status === "done"
                    ? "bg-emas text-ink font-semibold"
                    : item.status === "served"
                    ? "bg-emerald-900 text-emerald-300"
                    : "bg-ink-3 text-muted"
                )}
              >
                {item.status === "done" ? "Siap" : item.status === "served" ? "Tersaji" : "Dimasak"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="pt-2">
        {!isAllServed ? (
          <button
            type="button"
            onClick={() => onServeOrder(order.id)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-emas px-4 py-2.5 font-sans text-sm font-semibold text-ink shadow transition hover:bg-emas-bright active:scale-[0.98]"
          >
            <CheckCircleIcon className="h-4 w-4" />
            Konfirmasi Telah Diantar ke Meja
          </button>
        ) : (
          <div className="flex min-h-[44px] items-center justify-center text-xs font-semibold text-muted">
            Pesanan telah diantar ke Meja {order.table_number}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/staff/WaiterOrderCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/staff/WaiterOrderCard.tsx src/components/staff/WaiterOrderCard.test.tsx
git commit -m "feat(ui): add WaiterOrderCard component with delivery confirmation action"
```

---

### Task 3: Waiter Floor Operations Page (`WaiterOrdersPage.tsx`)

**Files:**
- Create: `src/pages/WaiterOrdersPage.tsx`
- Test: `src/pages/WaiterOrdersPage.test.tsx`

**Interfaces:**
- Consumes: REST endpoint `GET /api/staff/orders`, `PATCH /api/staff/orders/:id`, WebSocket events `order_created`, `order_updated`.
- Produces: Full interactive waiter floor view with filter tabs (Siap Diantar, Dimasak, Tersaji, Semua), auto-refresh, audio chime on kitchen completion, and staff authentication guard.

- [ ] **Step 1: Write the failing test for `WaiterOrdersPage`**

Buat file `src/pages/WaiterOrdersPage.test.tsx`:
```tsx
import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { WaiterOrdersPage } from "./WaiterOrdersPage"
import * as staffAuth from "../utils/staffAuth"

vi.mock("../utils/staffAuth", () => ({
  getStaffToken: vi.fn(),
  getStaffUser: vi.fn(),
  getAuthHeaders: vi.fn(() => ({ Authorization: "Bearer fake-token" })),
  clearStaffAuth: vi.fn(),
}))

describe("WaiterOrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(staffAuth.getStaffToken as any).mockReturnValue("fake-token")
    ;(staffAuth.getStaffUser as any).mockReturnValue({
      id: 1,
      name: "Wati (Waiter)",
      email: "wati@sembilu.com",
      role: "waiter",
      branch_id: 1,
    })
  })

  it("renders waiter header and status filter tabs", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as any)

    render(<WaiterOrdersPage />)

    expect(screen.getByText(/Operasional Waiter/i)).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Siap Diantar/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Sedang Dimasak/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/WaiterOrdersPage.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `WaiterOrdersPage.tsx`**

Buat file `src/pages/WaiterOrdersPage.tsx`:
```tsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { cn } from "../utils/cn"
import { AKSARA } from "../data"
import {
  StaffUser,
  getStaffToken,
  getStaffUser,
  clearStaffAuth,
  getAuthHeaders,
} from "../utils/staffAuth"
import { playKitchenBell } from "../utils/sound"
import {
  BellIcon,
  BellOffIcon,
  WifiIcon,
  WifiOffIcon,
  UserIcon,
  LogOutIcon,
  RefreshCwIcon,
  ChefHatIcon,
} from "../components/staff/icons"
import { StaffAuthModal } from "../components/staff/StaffAuthModal"
import { KDSOrder } from "../components/staff/KDSAggregateBar"
import { WaiterOrderCard } from "../components/staff/WaiterOrderCard"

export const BRANCHES = [
  { id: 1, name: "Tegal" },
  { id: 2, name: "Solo" },
  { id: 3, name: "Yogyakarta" },
]

export type WaiterTab = "ready" | "cooking" | "served" | "all"

export function WaiterOrdersPage() {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(() => getStaffUser())
  const [showAuthModal, setShowAuthModal] = useState<boolean>(() => !getStaffToken())
  const [selectedBranchId, setSelectedBranchId] = useState<number>(() => {
    const user = getStaffUser()
    return user?.branch_id || 1
  })

  const [orders, setOrders] = useState<KDSOrder[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState<boolean>(false)
  const [selectedTab, setSelectedTab] = useState<WaiterTab>("ready")
  const [isMuted, setIsMuted] = useState<boolean>(false)

  const wsRef = useRef<WebSocket | null>(null)

  const fetchOrders = useCallback(async (branchId = selectedBranchId) => {
    const token = getStaffToken()
    if (!token) {
      setShowAuthModal(true)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/staff/orders?branch_id=${branchId}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Gagal memuat daftar pesanan.")
      const data = await res.json()
      setOrders(data)
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat pesanan.")
    } finally {
      setLoading(false)
    }
  }, [selectedBranchId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.hostname}:3001`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setWsConnected(true)
    ws.onclose = () => setWsConnected(false)
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
  }, [fetchOrders, isMuted])

  // Handle Deliver Order
  const handleServeOrder = async (orderId: number) => {
    try {
      const res = await fetch(`/api/staff/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "served" }),
      })
      if (!res.ok) throw new Error("Gagal mengupdate status pesanan.")
      
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "served", items: o.items.map((i) => ({ ...i, status: "served" })) }
            : o
        )
      )
    } catch (err: any) {
      alert(err.message)
      fetchOrders()
    }
  }

  // Filtered Orders & Badges
  const readyOrders = useMemo(
    () => orders.filter((o) => o.status === "done" || (o.items.length > 0 && o.items.every((i) => i.status === "done" || i.status === "served") && o.status !== "served")),
    [orders]
  )
  const cookingOrders = useMemo(
    () => orders.filter((o) => o.status === "pending" || o.status === "cooking"),
    [orders]
  )
  const servedOrders = useMemo(
    () => orders.filter((o) => o.status === "served"),
    [orders]
  )

  const displayedOrders = useMemo(() => {
    switch (selectedTab) {
      case "ready":
        return readyOrders
      case "cooking":
        return cookingOrders
      case "served":
        return servedOrders
      default:
        return orders
    }
  }, [selectedTab, readyOrders, cookingOrders, servedOrders, orders])

  return (
    <div className="grain min-h-screen bg-ink font-sans text-cream">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-ink-2/90 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-aksara text-sm text-emas">{AKSARA}</span>
            <div>
              <h1 className="font-display text-lg font-bold tracking-wider text-cream">
                SEMBILU · OPERASIONAL WAITER
              </h1>
              <p className="text-xs text-cream-dim">Manajemen Pengantaran Hidangan ke Meja</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Link to Kitchen KDS */}
            <a
              href="/staff/kitchen"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-cream-dim hover:text-cream hover:border-emas transition"
            >
              <ChefHatIcon className="h-4 w-4 text-emas" />
              Layar Dapur (KDS)
            </a>

            {/* Branch Switcher */}
            {staffUser?.role === "manager" && (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                className="rounded-lg border border-line bg-ink-3 px-3 py-1.5 text-xs text-cream focus:border-emas"
              >
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>Cabang {b.name}</option>
                ))}
              </select>
            )}

            {/* WebSocket Indicator */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                wsConnected ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"
              )}
            >
              {wsConnected ? <WifiIcon className="h-3 w-3" /> : <WifiOffIcon className="h-3 w-3" />}
              {wsConnected ? "Live" : "Offline"}
            </span>

            {/* Logout */}
            <button
              onClick={() => {
                clearStaffAuth()
                setStaffUser(null)
                setShowAuthModal(true)
              }}
              title="Logout"
              className="rounded-lg border border-line p-2 text-muted hover:text-cream"
            >
              <LogOutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex gap-2" role="tablist">
            <button
              role="tab"
              aria-selected={selectedTab === "ready"}
              onClick={() => setSelectedTab("ready")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
                selectedTab === "ready"
                  ? "bg-emas text-ink shadow"
                  : "border border-line bg-ink-2 text-cream-dim hover:text-cream"
              )}
            >
              <span>🔔 Siap Diantar</span>
              {readyOrders.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bata text-xs font-bold text-cream animate-bounce">
                  {readyOrders.length}
                </span>
              )}
            </button>

            <button
              role="tab"
              aria-selected={selectedTab === "cooking"}
              onClick={() => setSelectedTab("cooking")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
                selectedTab === "cooking"
                  ? "bg-emas text-ink shadow"
                  : "border border-line bg-ink-2 text-cream-dim hover:text-cream"
              )}
            >
              <span>🔥 Sedang Dimasak</span>
              <span className="text-xs opacity-75">({cookingOrders.length})</span>
            </button>

            <button
              role="tab"
              aria-selected={selectedTab === "served"}
              onClick={() => setSelectedTab("served")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
                selectedTab === "served"
                  ? "bg-emas text-ink shadow"
                  : "border border-line bg-ink-2 text-cream-dim hover:text-cream"
              )}
            >
              <span>✓ Tersaji di Meja</span>
              <span className="text-xs opacity-75">({servedOrders.length})</span>
            </button>

            <button
              role="tab"
              aria-selected={selectedTab === "all"}
              onClick={() => setSelectedTab("all")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
                selectedTab === "all"
                  ? "bg-emas text-ink shadow"
                  : "border border-line bg-ink-2 text-cream-dim hover:text-cream"
              )}
            >
              <span>Semua ({orders.length})</span>
            </button>
          </div>

          <button
            onClick={() => fetchOrders()}
            className="flex items-center gap-1.5 text-xs text-cream-dim hover:text-cream"
          >
            <RefreshCwIcon className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Orders Grid */}
        {loading && orders.length === 0 ? (
          <div className="py-16 text-center text-muted">Memuat daftar pesanan...</div>
        ) : displayedOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line py-16 text-center">
            <p className="font-display text-lg text-cream-dim">Tidak ada pesanan dalam status ini.</p>
            <p className="mt-1 text-xs text-muted">Pesanan baru atau yang selesai dimasak akan muncul otomatis di sini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedOrders.map((order) => (
              <WaiterOrderCard
                key={order.id}
                order={order}
                onServeOrder={handleServeOrder}
              />
            ))}
          </div>
        )}
      </main>

      {/* Auth Modal Guard */}
      <StaffAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          setStaffUser(user)
          setSelectedBranchId(user.branch_id)
          setShowAuthModal(false)
          fetchOrders(user.branch_id)
        }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/WaiterOrdersPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/WaiterOrdersPage.tsx src/pages/WaiterOrdersPage.test.tsx
git commit -m "feat(ui): add WaiterOrdersPage operational floor screen"
```

---

### Task 4: Route Registration & Cross-Navigation

**Files:**
- Modify: `src/App.tsx:1-85`
- Modify: `src/pages/KDSPage.tsx` (Add Header link to Waiter View)

- [ ] **Step 1: Register `/staff/orders` and `/staff/waiter` in `src/App.tsx`**

Tambahkan import `WaiterOrdersPage` dan pasang route di `src/App.tsx`:
```tsx
import { WaiterOrdersPage } from "@/pages/WaiterOrdersPage"

// Di dalam <Routes>:
<Route path="/staff/orders" element={<WaiterOrdersPage />} />
<Route path="/staff/waiter" element={<WaiterOrdersPage />} />
```

- [ ] **Step 2: Tambahkan Nav Link Waiter di Header `KDSPage.tsx`**

Tambahkan link cepat di header `KDSPage.tsx`:
```tsx
<a
  href="/staff/orders"
  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-cream-dim hover:text-cream hover:border-emas transition"
>
  Layar Waiter / Floor
</a>
```

- [ ] **Step 3: Run Full Test Suite**

Run: `npm test`
Expected: PASS all 16+ test files without regressions.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/pages/KDSPage.tsx
git commit -m "feat(routes): register waiter orders page and add cross-navigation"
```
