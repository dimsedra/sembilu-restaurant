import { describe, it, expect, afterAll, beforeAll } from "vitest"
import http from "http"
import WebSocket from "ws"
import request from "supertest"
import app, { server } from "./index"
import { broadcastOrderUpdate, closeWebSocketServer, OrderUpdatePayload } from "./websocket"

describe("Server HTTP and WebSocket Integration", () => {
  let port: number
  let testServer: http.Server

  beforeAll(async () => {
    // If server is exported, we listen on random available port
    testServer = server || http.createServer(app)
    await new Promise<void>((resolve) => {
      testServer.listen(0, () => {
        const addr = testServer.address()
        if (addr && typeof addr === "object") {
          port = addr.port
        }
        resolve()
      })
    })
  })

  afterAll(async () => {
    await closeWebSocketServer()
    await new Promise<void>((resolve) => {
      testServer.close(() => resolve())
    })
  })

  it("exports both app and server", () => {
    expect(app).toBeDefined()
    expect(server).toBeDefined()
    expect(server).toBeInstanceOf(http.Server)
  })

  it("serves Express HTTP endpoints such as /api/health", async () => {
    const res = await request(testServer).get("/api/health")
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: "ok" })
  })

  it("accepts WebSocket connections and receives broadcast updates on the same HTTP server", async () => {
    const ws = new WebSocket(`ws://localhost:${port}`)
    await new Promise<void>((resolve, reject) => {
      ws.on("open", () => resolve())
      ws.on("error", reject)
    })

    const messages: any[] = []
    ws.on("message", (data) => {
      messages.push(JSON.parse(data.toString()))
    })

    const updatePayload: OrderUpdatePayload = {
      event: "ORDER_STATUS_UPDATED",
      orderId: 101,
      status: "cooking",
      items: [{ id: 1, name: "Ayam Bakar", status: "cooking" }],
    }

    broadcastOrderUpdate(updatePayload)

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(messages).toHaveLength(1)
    expect(messages[0]).toEqual(updatePayload)

    ws.close()
    await new Promise<void>((resolve) => {
      ws.on("close", () => resolve())
    })
  })
})
