import { describe, it, expect, beforeAll } from "vitest"
import request from "supertest"
import app from "../index"
import { db } from "../db"

describe("T7: Staff Order Management API (/api/staff/orders)", () => {
  let waiterToken: string
  let managerToken: string
  let testOrderId: number
  let testItemId: number
  let branch2OrderId: number

  beforeAll(async () => {
    // 1. Authenticate Waiter (branch 1 - Tegal)
    const waiterLogin = await request(app)
      .post("/api/staff/login")
      .send({ email: "wati@sembilu.com", password: "password123" })
    waiterToken = waiterLogin.body.token

    // 2. Authenticate Manager (branch 1 - Tegal)
    const managerLogin = await request(app)
      .post("/api/staff/login")
      .send({ email: "teguh@sembilu.com", password: "password123" })
    managerToken = managerLogin.body.token

    // 3. Create a test order for branch 1
    const [order1] = await db("orders")
      .insert({
        branch_id: 1,
        table_number: 4,
        status: "pending",
        type: "dine-in",
      })
      .returning("*")
    testOrderId = order1.id

    // 4. Create a test order for branch 2 (Slawi)
    const [order2] = await db("orders")
      .insert({
        branch_id: 2,
        table_number: 8,
        status: "pending",
        type: "dine-in",
      })
      .returning("*")
    branch2OrderId = order2.id

    // 5. Create a test order item for order 1
    const [item] = await db("order_items")
      .insert({
        order_id: testOrderId,
        dish_id: 1, // Nasi Goreng Jawa
        quantity: 2,
        status: "pending",
      })
      .returning("*")
    testItemId = item.id
  })

  describe("GET /api/staff/orders", () => {
    it("returns 401 when Bearer token is missing", async () => {
      const res = await request(app).get("/api/staff/orders")
      expect(res.status).toBe(401)
    })

    it("returns today's orders scoped to staff branch_id for waiters", async () => {
      const res = await request(app)
        .get("/api/staff/orders")
        .set("Authorization", `Bearer ${waiterToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body.every((o: any) => o.branch_id === 1)).toBe(true)
      expect(res.body[0]).toHaveProperty("items")
    })

    it("returns 403 when non-manager waiter attempts explicit cross-branch query ?branch_id=2", async () => {
      const res = await request(app)
        .get("/api/staff/orders?branch_id=2")
        .set("Authorization", `Bearer ${waiterToken}`)

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/Forbidden/i)
    })

    it("allows managers to filter by ?branch_id", async () => {
      const res = await request(app)
        .get("/api/staff/orders?branch_id=1")
        .set("Authorization", `Bearer ${managerToken}`)

      expect(res.status).toBe(200)
      expect(res.body[0].branch_id).toBe(1)
    })
  })

  describe("PATCH /api/staff/orders/:id/items/:itemId", () => {
    it("updates item status from pending to cooking and auto-updates parent order to cooking", async () => {
      const res = await request(app)
        .patch(`/api/staff/orders/${testOrderId}/items/${testItemId}`)
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ status: "cooking" })

      expect(res.status).toBe(200)
      expect(res.body.item.status).toBe("cooking")
      expect(res.body.orderStatus).toBe("cooking")
    })

    it("returns 400 when attempting an invalid status jump (done -> pending)", async () => {
      // First update item to done
      await request(app)
        .patch(`/api/staff/orders/${testOrderId}/items/${testItemId}`)
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ status: "done" })

      // Attempt invalid jump back to pending
      const res = await request(app)
        .patch(`/api/staff/orders/${testOrderId}/items/${testItemId}`)
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ status: "pending" })

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/Invalid status transition/i)
    })
  })

  describe("PATCH /api/staff/orders/:id", () => {
    it("updates order status to served", async () => {
      const res = await request(app)
        .patch(`/api/staff/orders/${testOrderId}`)
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ status: "served" })

      expect(res.status).toBe(200)
      expect(res.body.order.status).toBe("served")
    })

    it("returns 403 Forbidden when non-manager waiter attempts cross-branch edit", async () => {
      const res = await request(app)
        .patch(`/api/staff/orders/${branch2OrderId}`)
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ status: "served" })

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/Forbidden/i)
    })

    it("returns 400 for unallowed status values (e.g. pending)", async () => {
      const res = await request(app)
        .patch(`/api/staff/orders/${testOrderId}`)
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ status: "pending" })

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/Allowed status updates: 'served', 'paid'/i)
    })
  })
})
