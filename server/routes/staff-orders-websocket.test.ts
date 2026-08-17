import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest"
import request from "supertest"
import app from "../index"
import { db } from "../db"
import * as websocket from "../websocket"

describe("Staff Orders WebSocket Broadcast Integration", () => {
  let waiterToken: string
  let testOrderId: number
  let testItemId: number
  let broadcastSpy: any

  beforeAll(async () => {
    // 1. Authenticate Waiter (branch 1 - Tegal)
    const waiterLogin = await request(app)
      .post("/api/staff/login")
      .send({ email: "wati@sembilu.com", password: "password123" })
    waiterToken = waiterLogin.body.token

    // 2. Create a test order for branch 1
    const [order] = await db("orders")
      .insert({
        branch_id: 1,
        table_number: 10,
        status: "pending",
        type: "dine-in",
      })
      .returning("*")
    testOrderId = order.id

    // 3. Create a test order item for order
    const [item] = await db("order_items")
      .insert({
        order_id: testOrderId,
        dish_id: 1,
        quantity: 1,
        status: "pending",
      })
      .returning("*")
    testItemId = item.id
  })

  beforeEach(() => {
    broadcastSpy = vi.spyOn(websocket, "broadcastOrderUpdate")
  })

  it("broadcasts order_updated when an order item status is updated to cooking", async () => {
    const res = await request(app)
      .patch(`/api/staff/orders/${testOrderId}/items/${testItemId}`)
      .set("Authorization", `Bearer ${waiterToken}`)
      .send({ status: "cooking" })

    expect(res.status).toBe(200)
    expect(broadcastSpy).toHaveBeenCalledTimes(1)
    expect(broadcastSpy).toHaveBeenCalledWith({
      event: "order_updated",
      orderId: testOrderId,
      status: "cooking",
      items: [
        expect.objectContaining({
          id: testItemId,
          status: "cooking",
        }),
      ],
    })
  })

  it("broadcasts order_updated when an order item status is updated to done (and order completes to done)", async () => {
    broadcastSpy.mockClear()

    const res = await request(app)
      .patch(`/api/staff/orders/${testOrderId}/items/${testItemId}`)
      .set("Authorization", `Bearer ${waiterToken}`)
      .send({ status: "done" })

    expect(res.status).toBe(200)
    expect(broadcastSpy).toHaveBeenCalledTimes(1)
    expect(broadcastSpy).toHaveBeenCalledWith({
      event: "order_updated",
      orderId: testOrderId,
      status: "done",
      items: [
        expect.objectContaining({
          id: testItemId,
          status: "done",
        }),
      ],
    })
  })

  it("broadcasts order_updated when order status is updated to served", async () => {
    broadcastSpy.mockClear()

    const res = await request(app)
      .patch(`/api/staff/orders/${testOrderId}`)
      .set("Authorization", `Bearer ${waiterToken}`)
      .send({ status: "served" })

    expect(res.status).toBe(200)
    expect(broadcastSpy).toHaveBeenCalledTimes(1)
    expect(broadcastSpy).toHaveBeenCalledWith({
      event: "order_updated",
      orderId: testOrderId,
      status: "served",
    })
  })

  it("broadcasts order_updated when order status is updated to paid", async () => {
    broadcastSpy.mockClear()

    const res = await request(app)
      .patch(`/api/staff/orders/${testOrderId}`)
      .set("Authorization", `Bearer ${waiterToken}`)
      .send({ status: "paid" })

    expect(res.status).toBe(200)
    expect(broadcastSpy).toHaveBeenCalledTimes(1)
    expect(broadcastSpy).toHaveBeenCalledWith({
      event: "order_updated",
      orderId: testOrderId,
      status: "paid",
    })
  })

  it("does not broadcast when order update request fails validation or returns error", async () => {
    broadcastSpy.mockClear()

    const res = await request(app)
      .patch(`/api/staff/orders/${testOrderId}`)
      .set("Authorization", `Bearer ${waiterToken}`)
      .send({ status: "invalid_status" })

    expect(res.status).toBe(400)
    expect(broadcastSpy).not.toHaveBeenCalled()
  })
})
