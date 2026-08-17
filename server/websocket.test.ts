import { describe, it, expect, beforeEach, afterEach } from "vitest"
import http from "http"
import WebSocket from "ws"
import {
  initWebSocketServer,
  broadcastOrderUpdate,
  getConnectedClientsCount,
  closeWebSocketServer,
  OrderUpdatePayload,
} from "./websocket"

describe("WebSocket Manager", () => {
  let server: http.Server
  let port: number

  beforeEach(async () => {
    server = http.createServer()
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address()
        if (addr && typeof addr === "object") {
          port = addr.port
        }
        resolve()
      })
    })
    initWebSocketServer(server)
  })

  afterEach(async () => {
    await closeWebSocketServer()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it("allows clients to connect and tracks connected count", async () => {
    expect(getConnectedClientsCount()).toBe(0)

    const ws = new WebSocket(`ws://localhost:${port}`)
    await new Promise<void>((resolve, reject) => {
      ws.on("open", () => resolve())
      ws.on("error", reject)
    })

    expect(getConnectedClientsCount()).toBe(1)

    ws.close()
    await new Promise<void>((resolve) => {
      ws.on("close", () => resolve())
    })

    // Give a brief tick for server cleanup
    await new Promise((r) => setTimeout(r, 50))
    expect(getConnectedClientsCount()).toBe(0)
  })

  it("broadcasts order updates to all connected clients", async () => {
    const ws1 = new WebSocket(`ws://localhost:${port}`)
    const ws2 = new WebSocket(`ws://localhost:${port}`)

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        ws1.on("open", () => resolve())
        ws1.on("error", reject)
      }),
      new Promise<void>((resolve, reject) => {
        ws2.on("open", () => resolve())
        ws2.on("error", reject)
      }),
    ])

    expect(getConnectedClientsCount()).toBe(2)

    const payload: OrderUpdatePayload = {
      event: "ORDER_STATUS_UPDATED",
      orderId: 42,
      status: "preparing",
      items: [{ dish_id: 1, quantity: 2 }],
    }

    const messages1: any[] = []
    const messages2: any[] = []

    ws1.on("message", (data) => {
      messages1.push(JSON.parse(data.toString()))
    })
    ws2.on("message", (data) => {
      messages2.push(JSON.parse(data.toString()))
    })

    broadcastOrderUpdate(payload)

    await new Promise((r) => setTimeout(r, 50))

    expect(messages1).toHaveLength(1)
    expect(messages1[0]).toEqual(payload)
    expect(messages2).toHaveLength(1)
    expect(messages2[0]).toEqual(payload)

    ws1.close()
    ws2.close()
    await new Promise((r) => setTimeout(r, 50))
  })

  it("handles graceful server closure", async () => {
    const ws = new WebSocket(`ws://localhost:${port}`)
    await new Promise<void>((resolve, reject) => {
      ws.on("open", () => resolve())
      ws.on("error", reject)
    })

    let closed = false
    ws.on("close", () => {
      closed = true
    })

    await closeWebSocketServer()
    expect(getConnectedClientsCount()).toBe(0)
  })
})
