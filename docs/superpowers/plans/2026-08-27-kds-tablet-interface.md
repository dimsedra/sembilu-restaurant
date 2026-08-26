# Kitchen Display System (KDS) Tablet Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a touch-friendly, high-contrast Kitchen Display System (KDS) at `/staff/kitchen` (with `/staff/kds` alias) that completely replaces paper kitchen ticket rails by enabling chefs to simultaneously monitor multiple order tickets side-by-side, view real-time aggregated batch cooking totals ("All-Day" summary), and transition item statuses with 1-tap SVG controls.

**Architecture:** 
- **Digital Ticket Rail Layout**: Multi-ticket fluid grid displaying 4–8 active order cards side-by-side sorted FIFO (oldest pending tickets first) with live urgency color coding.
- **"All-Day" Batch Cooking Aggregator (`KDSAggregateBar.tsx`)**: Real-time aggregated counter summing active dish quantities across all open tickets (e.g., "Total Antrean: 6x Bebek Goreng, 4x Ayam Bakar") so chefs can batch-cook efficiently in woks/fryers without manually tallying multiple paper slips.
- **Dual View Modes**:
  1. *Ticket Rail View* (Struk Meja Digital - side-by-side full table tickets).
  2. *Aggregated Batch View / Quick Filter* (Rekap Masakan Dapur).
- **Pure SVG Iconography (`icons.tsx`)**: Custom, themeable SVG components (no OS-dependent emojis).
- **Real-Time Layer**: WebSocket connection syncing live order arrivals (`order_created`), status changes (`order_updated`), and Web Audio API synthesized kitchen chimes.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, WebSockets (`ws`), Clean Inline SVG Icons, Web Audio API, Vitest.

**Spec:**
- Issue #16: `Kitchen Display System (KDS) tablet interface has no frontend UI for real-time ticket management`
- [`CONTEXT.md`](file:///d:/Project%20Hub/sembilu-restaurant/CONTEXT.md)
- [`server/routes/staff-orders.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/routes/staff-orders.ts)
- [`server/websocket.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/websocket.ts)

## Global Constraints

- **Paperless Kitchen Replacement**: Must support multi-ticket concurrent tracking on a single tablet screen (responsive 2–4 column grid on tablet landscape / desktop).
- **Strict SVG Iconography**: No platform emojis (no 🍳, ✅, 🌶️, 🟢). All iconography uses custom inline SVGs.
- Design theme strictly adheres to Sembilu "Candlelit Heirloom" aesthetics (`#14110d` ink background, `#f4ead3` cream text, `#c9a24b` gold accents, `#b84a30` bata alerts).
- High contrast and large touch targets (minimum 44px) for greasy/multitasking kitchen environments.
- State transitions must strictly follow backend state machine (`pending` -> `cooking` -> `done`).
- Automatic reconnection and zero extraneous UI dependencies.

---

### Task 1: Staff Authentication Storage, SVG Icons & Audio Alert Utilities

**Files:**
- Create: `src/utils/staffAuth.ts`
- Create: `src/components/staff/icons.tsx`
- Create: `src/components/staff/StaffAuthModal.tsx`
- Create: `src/utils/sound.ts`
- Test: `src/utils/staffAuth.test.ts`
- Test: `src/utils/sound.test.ts`

**Interfaces:**
- Auth: `getStaffToken()`, `setStaffAuth(token, staff)`, `clearStaffAuth()`, `getStaffUser()`, `<StaffAuthModal />`.
- Icons: `<ChefHatIcon />`, `<FlameIcon />`, `<CheckCircleIcon />`, `<ChiliIcon />`, `<ClockIcon />`, `<BellIcon />`, `<BellOffIcon />`, `<WifiIcon />`, `<WifiOffIcon />`, `<AlertTriangleIcon />`, `<LayersIcon />`, `<GridIcon />`, `<ListIcon />`, `<UserIcon />`, `<LogOutIcon />`.
- Audio: `playKitchenBell(muted?: boolean)` using Web Audio API synthesis.

- [ ] **Step 1: Write test for `staffAuth` and `sound` utilities**

```typescript
// src/utils/staffAuth.test.ts
import { describe, it, expect, beforeEach } from "vitest"
import { getStaffToken, setStaffAuth, clearStaffAuth, getStaffUser } from "./staffAuth"

describe("staffAuth utility", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("stores and retrieves staff token and profile", () => {
    expect(getStaffToken()).toBeNull()
    const mockStaff = { id: 2, name: "Budi (Chef)", email: "budi@sembilu.com", role: "chef", branch_id: 1 }
    setStaffAuth("mock-jwt-token", mockStaff)

    expect(getStaffToken()).toBe("mock-jwt-token")
    expect(getStaffUser()).toEqual(mockStaff)
  })

  it("clears staff auth correctly", () => {
    setStaffAuth("token", { id: 1, name: "Wati", role: "waiter", branch_id: 1 })
    clearStaffAuth()
    expect(getStaffToken()).toBeNull()
    expect(getStaffUser()).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run src/utils/staffAuth.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `staffAuth.ts`, `icons.tsx`, `sound.ts`, and `StaffAuthModal.tsx`**

- [ ] **Step 4: Run tests to verify pass**
Run: `npx vitest run src/utils/staffAuth.test.ts src/utils/sound.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/utils/staffAuth.ts src/utils/staffAuth.test.ts src/components/staff/icons.tsx src/components/staff/StaffAuthModal.tsx src/utils/sound.ts src/utils/sound.test.ts
git commit -m "feat(staff): add staff auth storage, SVG icons, audio chime, and kitchen quick login"
```

---

### Task 2: "All-Day" Batch Cooking Aggregator Component (`KDSAggregateBar.tsx`)

**Files:**
- Create: `src/components/staff/KDSAggregateBar.tsx`
- Test: `src/components/staff/KDSAggregateBar.test.tsx`

**Interfaces:**
- Consumes: `orders: Order[]` (active orders).
- Produces: Collapsible / toggleable summary drawer summarizing:
  - Total pending/cooking quantities per dish across ALL active tickets (e.g. "6x Bebek Goreng", "4x Ayam Bakar").
  - Breakdown by sambal variants.
  - One-tap quick filter (clicking a dish filters the ticket rail to show only orders containing that dish).

- [ ] **Step 1: Write test for `KDSAggregateBar`**

```typescript
// src/components/staff/KDSAggregateBar.test.tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { KDSAggregateBar } from "./KDSAggregateBar"

describe("KDSAggregateBar", () => {
  const mockOrders = [
    {
      id: 1,
      status: "pending",
      items: [
        { id: 1, dish_name: "Bebek Goreng Sembilu", quantity: 2, status: "pending" },
        { id: 2, dish_name: "Ayam Bakar Klaten", quantity: 1, status: "cooking" },
      ],
    },
    {
      id: 2,
      status: "cooking",
      items: [
        { id: 3, dish_name: "Bebek Goreng Sembilu", quantity: 3, status: "pending" },
      ],
    },
  ]

  it("aggregates active items correctly (5x Bebek, 1x Ayam)", () => {
    render(<KDSAggregateBar orders={mockOrders as any} onFilterDish={vi.fn()} selectedDish={null} />)

    expect(screen.getByText(/5x/i)).toBeDefined()
    expect(screen.getByText(/Bebek Goreng Sembilu/i)).toBeDefined()
    expect(screen.getByText(/1x/i)).toBeDefined()
    expect(screen.getByText(/Ayam Bakar Klaten/i)).toBeDefined()
  })

  it("calls onFilterDish when a dish chip is clicked", () => {
    const handleFilter = vi.fn()
    render(<KDSAggregateBar orders={mockOrders as any} onFilterDish={handleFilter} selectedDish={null} />)

    const chip = screen.getByText(/Bebek Goreng Sembilu/i)
    fireEvent.click(chip)
    expect(handleFilter).toHaveBeenCalledWith("Bebek Goreng Sembilu")
  })
})
```

- [ ] **Step 2: Implement `src/components/staff/KDSAggregateBar.tsx`**

- [ ] **Step 3: Run test to verify pass**
Run: `npx vitest run src/components/staff/KDSAggregateBar.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/components/staff/KDSAggregateBar.tsx src/components/staff/KDSAggregateBar.test.tsx
git commit -m "feat(kds): create KDSAggregateBar for all-day batch cooking summaries"
```

---

### Task 3: Digital Ticket Rail Card Component (`KDSTicketCard.tsx`)

**Files:**
- Create: `src/components/staff/KDSTicketCard.tsx`
- Test: `src/components/staff/KDSTicketCard.test.tsx`

**Interfaces:**
- Consumes: Order object with items, `onUpdateItemStatus(orderId, itemId, newStatus)`, `onBatchUpdate(orderId, newStatus)`.
- Produces: Side-by-side ticket card featuring:
  - Table badge + Walk-in / Reservation distinction.
  - Live elapsed timer (`MM:SS`) with `<ClockIcon />` and urgency indicator (normal <10m, warning 10-20m, urgent >20m).
  - High-visibility quantity chips (`2x`, `1x`), `<ChiliIcon />` sambal indicators, and `<AlertTriangleIcon />` notes.
  - Single-tap action buttons on each line item (`Masak`, `Selesai`, `Siap Saji`).
  - Batch ticket actions (`Mulai Semua`, `Selesaikan Semua`).

- [ ] **Step 1: Write test for `KDSTicketCard`**

```typescript
// src/components/staff/KDSTicketCard.test.tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { KDSTicketCard } from "./KDSTicketCard"

describe("KDSTicketCard", () => {
  const mockOrder = {
    id: 101,
    branch_id: 1,
    table_number: 4,
    status: "pending",
    created_at: new Date().toISOString(),
    customer_name: "Bpk. Arya",
    items: [
      {
        id: 1,
        order_id: 101,
        dish_id: 2,
        dish_name: "Bebek Goreng Sembilu",
        quantity: 2,
        sambal_name: "Sambal Matah",
        sambal_extra: true,
        notes: "Minta bagian paha",
        status: "pending",
      },
    ],
  }

  it("renders table number and line items", () => {
    const handleUpdate = vi.fn()
    render(<KDSTicketCard order={mockOrder} onUpdateItemStatus={handleUpdate} />)

    expect(screen.getByText(/MEJA 04/i)).toBeDefined()
    expect(screen.getByText(/Bebek Goreng Sembilu/i)).toBeDefined()
    expect(screen.getByText(/Minta bagian paha/i)).toBeDefined()
  })

  it("triggers item status update on button click", () => {
    const handleUpdate = vi.fn()
    render(<KDSTicketCard order={mockOrder} onUpdateItemStatus={handleUpdate} />)

    const cookBtn = screen.getByRole("button", { name: /masak/i })
    fireEvent.click(cookBtn)
    expect(handleUpdate).toHaveBeenCalledWith(101, 1, "cooking")
  })
})
```

- [ ] **Step 2: Implement `src/components/staff/KDSTicketCard.tsx`**

- [ ] **Step 3: Run test to verify pass**
Run: `npx vitest run src/components/staff/KDSTicketCard.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/components/staff/KDSTicketCard.tsx src/components/staff/KDSTicketCard.test.tsx
git commit -m "feat(kds): create high-contrast KDSTicketCard for multi-ticket rail"
```

---

### Task 4: KDS Main Page (`KDSPage.tsx`) Multi-Ticket Dashboard & Routes

**Files:**
- Create: `src/pages/KDSPage.tsx`
- Modify: `src/App.tsx` (register `/staff/kitchen` and `/staff/kds`)

**Interfaces:**
- Consumes: `GET /api/staff/orders`, WebSocket server at `ws://${host}:3001`, `PATCH /api/staff/orders/:id/items/:itemId`.
- Produces: Complete Multi-Ticket Kitchen Display System:
  - Sticky Top Bar: Sembilu Insignia, Branch selector, Live WebSocket indicator (`<WifiIcon /> Live Dapur`), Audio alert toggle (`<BellIcon />`), Quick Filter Tabs (Semua Aktif, Menunggu, Dimasak, Siap Saji), Staff Profile & Logout.
  - "All-Day" Summary Strip: Real-time aggregated dish count chips across all open orders.
  - Multi-Order Grid / Rail: Responsive layout (1 col mobile, 2-4 cols tablet landscape / widescreen) showing multiple tickets side-by-side sorted FIFO.
  - Optimistic UI updates with instant WebSocket reconciliation.

- [ ] **Step 1: Implement `src/pages/KDSPage.tsx`**
- [ ] **Step 2: Register routes in `src/App.tsx` (`/staff/kitchen` and `/staff/kds`)**
- [ ] **Step 3: Run build check**
Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/pages/KDSPage.tsx src/App.tsx
git commit -m "feat(kds): implement full multi-ticket KDSPage with All-Day batch counter and routes"
```

---

### Task 5: End-to-End Regression & Verification

**Files:**
- Test end-to-end flow

- [ ] **Step 1: Run complete project test suite**
Run: `npx vitest run`
Expected: PASS

- [ ] **Step 2: Run production build verification**
Run: `npm run build`
Expected: PASS

---

## Verification Plan

### Automated Tests
1. `npx vitest run src/utils/staffAuth.test.ts`
2. `npx vitest run src/utils/sound.test.ts`
3. `npx vitest run src/components/staff/KDSAggregateBar.test.tsx`
4. `npx vitest run src/components/staff/KDSTicketCard.test.tsx`
5. `npm run build`

### Manual Verification
1. Open `/staff/kitchen` in browser.
2. Login as Chef ("Budi").
3. Place 3 different orders in separate tabs (Table 2: 2 Bebek, Table 4: 3 Bebek + 1 Ayam, Table 8: 1 Bebek).
4. Verify on `/staff/kitchen` screen:
   - All 3 order tickets appear side-by-side in chronological order (Ticket Rail).
   - "All-Day" summary bar prominently displays **"6x Bebek Goreng Sembilu"** and **"1x Ayam Bakar"**.
   - Chef can see the entire kitchen workload at a single glance without switching tabs.
5. Tap "Masak" on Table 2's Bebek $\rightarrow$ updates Table 2 and tracks real-time progress.
6. Verify live sync with customer tracking page `/track/:orderId`.
