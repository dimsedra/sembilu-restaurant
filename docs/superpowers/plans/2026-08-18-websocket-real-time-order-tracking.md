# WebSockets Real-Time Order Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the real-time WebSocket backend so that when the kitchen updates a dish status on the KDS screen, the change is instantly broadcast to connected customer and waiter screens.

**Architecture:** 
- A lightweight WebSocket server module ([`server/websocket.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/websocket.ts)) manages open client connections.
- Node's standard HTTP server in [`server/index.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/index.ts) serves both Express REST routes and WebSocket connections on the same port (`3001`).
- The existing KDS endpoint ([`server/routes/staff-orders.ts`](file:///d:/Project%20Hub/sembilu-restaurant/server/routes/staff-orders.ts)) calls `broadcastOrderUpdate()` whenever a chef changes item or order statuses.

**Tech Stack:** Node.js, Express, `ws`, `@types/ws`, TypeScript, Vitest.

**Spec / Reference:**
- [`teaching/lessons/0025-websocket-real-time-order-tracking.html`](file:///d:/Project%20Hub/sembilu-restaurant/teaching/lessons/0025-websocket-real-time-order-tracking.html)
- [`teaching/learning-records/0021-websocket-order-tracking.md`](file:///d:/Project%20Hub/sembilu-restaurant/teaching/learning-records/0021-websocket-order-tracking.md)
- [`CONTEXT.md`](file:///d:/Project%20Hub/sembilu-restaurant/CONTEXT.md)

## Global Constraints

- Keep things simple and minimal (YAGNI).
- Strict separation of concerns: keep WebSocket connection management in its own module (`server/websocket.ts`).
- Clear, descriptive test assertions with clean logs.

---

### Task 1: Install `ws` Dependencies & Create WebSocket Manager Module

**Files:**
- Modify: `package.json`
- Create: `server/websocket.ts`
- Test: `server/websocket.test.ts`

**Interfaces:**
- Produces: 
  - `initWebSocketServer(httpServer: http.Server): WebSocketServer`
  - `broadcastOrderUpdate(eventPayload: OrderUpdatePayload): void`
  - `closeWebSocketServer(): Promise<void>`
  - `getConnectedClientsCount(): number`

- [ ] **Step 1: Install `ws` and `@types/ws`**
Run: `npm install ws && npm install -D @types/ws`

- [ ] **Step 2: Write failing unit test for WebSocket Server connection and broadcast**
Create `server/websocket.test.ts` testing:
1. Connecting a WebSocket client to the server.
2. Broadcasting an `order_updated` event and receiving the JSON message on the client.
3. Proper disconnect cleanup when a client closes the socket.

- [ ] **Step 3: Run test to verify it fails**
Run: `npx vitest run server/websocket.test.ts`
Expected: FAIL (module not yet implemented).

- [ ] **Step 4: Implement `server/websocket.ts`**
Implement the client connection registry (`Set<WebSocket>`), error handling, ping/pong heartbeat or graceful close, and the `broadcastOrderUpdate()` helper.

- [ ] **Step 5: Run test to verify it passes**
Run: `npx vitest run server/websocket.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**
`git add package.json package-lock.json server/websocket.ts server/websocket.test.ts`
`git commit -m "feat(websocket): add WebSocket connection manager and broadcast helper"`

---

### Task 2: Attach WebSocket Server to Express & Node HTTP Server

**Files:**
- Modify: `server/index.ts`
- Modify: `server/websocket.test.ts`

**Interfaces:**
- Consumes: `initWebSocketServer` from `server/websocket.ts`
- Produces: Exported `server` (Node HTTP server instance) alongside `app` for testing and dev server.

- [ ] **Step 1: Write integration test verifying Express HTTP and WebSockets share the same server**
Update `server/websocket.test.ts` to test attaching to the main Express app.

- [ ] **Step 2: Update `server/index.ts`**
Use `http.createServer(app)` and attach `initWebSocketServer(server)`.

- [ ] **Step 3: Run test to verify it passes**
Run: `npx vitest run server/websocket.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**
`git add server/index.ts server/websocket.test.ts`
`git commit -m "feat(server): mount WebSocket server on Express HTTP instance"`

---

### Task 3: Trigger Real-Time Broadcasts from KDS Route Updates

**Files:**
- Modify: `server/routes/staff-orders.ts`
- Create / Update Test: `server/routes/staff-orders.test.ts` (or `server/routes/staff-orders-websocket.test.ts`)

**Interfaces:**
- Consumes: `broadcastOrderUpdate` from `../websocket`

- [ ] **Step 1: Write failing test verifying KDS item update triggers a WebSocket broadcast**
Test that updating an item (`PATCH /api/staff/orders/:id/items/:itemId`) broadcasts `{ event: "order_updated", orderId, status, items }` to open sockets.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run server/routes/staff-orders-websocket.test.ts`
Expected: FAIL.

- [ ] **Step 3: Integrate `broadcastOrderUpdate()` inside `server/routes/staff-orders.ts`**
Call the broadcast helper when:
1. An individual item status transitions (`pending` $\rightarrow$ `cooking` $\rightarrow$ `done`) and parent order status updates.
2. An order is marked as `served` or `paid`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run server/routes/staff-orders-websocket.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
`git add server/routes/staff-orders.ts server/routes/staff-orders-websocket.test.ts`
`git commit -m "feat(kds): broadcast live order and item status updates over WebSockets"`

---

## Verification Plan

### Automated Tests
1. **WebSocket Unit Tests**:
   - `npx vitest run server/websocket.test.ts`
2. **KDS WebSocket Integration Tests**:
   - `npx vitest run server/routes/staff-orders-websocket.test.ts`

### Manual Verification
1. Start dev backend: `npm run dev:server`.
2. Connect a WebSocket client (or script) to `ws://localhost:3001`.
3. Send a `PATCH` request to update an item status and verify the message appears instantly in the WebSocket client console without refreshing.
