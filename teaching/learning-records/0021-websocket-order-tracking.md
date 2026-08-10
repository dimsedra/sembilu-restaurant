# Learning Record 0021: WebSockets for Real-Time Order Tracking

**Date:** 2026-08-10
**Topic:** WebSockets Protocol (`ws`), HTTP Upgrade Handshake, Full-Duplex Bi-Directional Push, KDS Real-Time Integration

## Context & Key Insights

1. **Why WebSockets over HTTP Polling**:
   - HTTP Polling requires the browser to constantly send HTTP requests every 2s, causing header overhead, network battery drain, and server load.
   - WebSockets establish a single persistent TCP connection allowing instant server-to-client push notifications.

2. **Handshake & Protocol Upgrade**:
   - WebSockets start as an HTTP request (`http://` or `https://`) and send an `Upgrade: websocket` header.
   - Server returns HTTP status `101 Switching Protocols`, upgrading the socket to `ws://` or `wss://`.

3. **Integration with Sembilu KDS (T7 ➔ T5)**:
   - When kitchen staff update item status on `PATCH /api/staff/orders/:id/items/:itemId`, the backend calls `broadcastOrderUpdate()`, pushing `{ orderId, status }` directly to customer tracking screens.

## Applied Artifacts
- Lesson: [`teaching/lessons/0025-websocket-real-time-order-tracking.html`](file:///d:/Project%20Hub/sembilu-restaurant/teaching/lessons/0025-websocket-real-time-order-tracking.html)
