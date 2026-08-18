# Frontend Real-Time Order Tracking View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the customer live order tracking page in React (`/track/:orderId`) with real-time WebSocket updates, showing live cooking stages, item progression, and order details.

**Architecture:**
- Create [`src/pages/TrackPage.tsx`](file:///d:/Project%20Hub/sembilu-restaurant/src/pages/TrackPage.tsx) that fetches initial order data from `GET /api/orders/:id/track` and maintains an active WebSocket connection to receive `order_updated` events.
- Update [`src/App.tsx`](file:///d:/Project%20Hub/sembilu-restaurant/src/App.tsx) with the `/track/:orderId` route.
- Update [`src/pages/OrderPage.tsx`](file:///d:/Project%20Hub/sembilu-restaurant/src/pages/OrderPage.tsx) so customers can jump straight to live tracking upon placing an order.

**Tech Stack:** React 19, TypeScript, React Router 7, Tailwind CSS, WebSockets (`window.WebSocket`), Vite.

**Spec / Reference:**
- Issue #7: `T5 — Order Tracking + WebSocket`
- [`CONTEXT.md`](file:///d:/Project%20Hub/sembilu-restaurant/CONTEXT.md)
- [`docs/superpowers/plans/2026-08-18-order-tracking-backend.md`](file:///d:/Project%20Hub/sembilu-restaurant/docs/superpowers/plans/2026-08-18-order-tracking-backend.md)

## Global Constraints

- Use Sembilu "Candlelit Heirloom" styling tokens (ink, ink-2, emas, cream, bata).
- Clean real-time lifecycle: open WebSocket connection on mount, cleanup on unmount.
- Filter incoming WebSocket events by `orderId === currentOrderId`.
- Clear, descriptive statuses in Indonesian (Diterima, Dimasak, Siap Disajikan, Tersaji).

---

### Task 1: Create `TrackPage.tsx` Component

**Files:**
- Create: `src/pages/TrackPage.tsx`

**Interfaces:**
- Consumes: `GET /api/orders/:id/track` and `ws://localhost:3001` (or dynamic host)
- Produces: `TrackPage` React component

- [ ] **Step 1: Implement `src/pages/TrackPage.tsx`**
Build the tracking interface:
- Extract `orderId` from URL params (`useParams()`).
- Initial REST fetch: `GET /api/orders/${orderId}/track`.
- WebSocket listener in `useEffect`:
  - Connects to `ws://${window.location.hostname}:3001`.
  - Listens for `message` events where `data.event === "order_updated" && data.orderId === Number(orderId)`.
  - Updates local state (`order.status`, `items` status).
  - Cleans up (`ws.close()`) on component unmount.
- Render:
  - Header with branch badge, table number, order ID, and Aksara decoration.
  - Multi-stage visual progress stepper:
    1. **Diterima** (Pending)
    2. **Dimasak** (Cooking)
    3. **Siap Disajikan** (Done)
    4. **Tersaji** (Served)
  - Detailed line items with dish names, prices, sambal choices, heat badges, and individual dish status tags.
  - Connection indicator (e.g. "🟢 Live updates aktif").

- [ ] **Step 2: Verify component TypeScript compilation**
Run: `npx tsc --noEmit`
Expected: PASS (0 type errors).

- [ ] **Step 3: Commit**
```bash
git add src/pages/TrackPage.tsx
git commit -m "feat(ui): create real-time TrackPage component with WebSocket listener"
```

---

### Task 2: Register Route in `App.tsx` & Connect `OrderPage.tsx`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/OrderPage.tsx`

**Interfaces:**
- Consumes: `TrackPage` from `@/pages/TrackPage`

- [ ] **Step 1: Add `/track/:orderId` route to `src/App.tsx`**
Import `TrackPage` and register `<Route path="/track/:orderId" element={<TrackPage />} />`.

- [ ] **Step 2: Connect `OrderPage.tsx` confirmation screen to `/track/:orderId`**
In `OrderPage.tsx`, add a prominent action button on order submission:
`"Lacak Pesanan Live →"` linking to `/track/${result.orderId}` (via React Router `useNavigate` or `Link`).

- [ ] **Step 3: Verify build and tests**
Run: `npm run build && npx vitest run`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add src/App.tsx src/pages/OrderPage.tsx
git commit -m "feat(routing): add /track/:orderId route and link order submission to tracker"
```

---

## Verification Plan

### Automated Tests & Typecheck
1. Type check: `npx tsc --noEmit`
2. Frontend build verification: `npm run build`
3. Backend test suite: `npx vitest run`

### Manual Verification
1. Place an order on `/order`.
2. Click "Lacak Pesanan Live →" and verify navigation to `/track/:orderId`.
3. Verify that changing status on the backend instantly updates the UI in real-time.
