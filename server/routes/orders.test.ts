import { describe, it, expect, vi } from "vitest"
import request from "supertest"
import app from "../index"
import { db } from "../db"
import * as websocket from "../websocket"

describe("POST /api/orders", () => {
  afterEach(async () => {
    await db("order_items").del()
    await db("orders").del()
    await db("reservations").del()
    await db("customers").del()
  })

  it("creates an order with items for a new customer", async () => {
    const res = await request(app).post("/api/orders").send({
      name: "Budi",
      phone: "0813-1111-1111",
      branch_id: 1,
      table_number: 5,
      items: [
        { dish_id: 1, quantity: 2, sambal_id: 1, sambal_extra: false },
        { dish_id: 3, quantity: 1, sambal_id: null, sambal_extra: false },
      ],
    })
    expect(res.status).toBe(201)
    expect(res.body.order.table_number).toBe(5)
    expect(res.body.items).toHaveLength(2)
    expect(res.body.customer.visit_count).toBe(1)
  })

  it("broadcasts order_created WebSocket event on order placement", async () => {
    const broadcastSpy = vi.spyOn(websocket, "broadcastOrderUpdate")
    const res = await request(app).post("/api/orders").send({
      name: "Budi",
      phone: "0813-1111-1111",
      branch_id: 1,
      table_number: 5,
      items: [
        { dish_id: 1, quantity: 2, sambal_id: 1, sambal_extra: false },
      ],
    })
    expect(res.status).toBe(201)
    const orderId = res.body.order.id
    expect(broadcastSpy).toHaveBeenCalledTimes(1)
    expect(broadcastSpy).toHaveBeenCalledWith({
      event: "order_created",
      orderId,
      status: "pending",
      items: expect.arrayContaining([
        expect.objectContaining({
          dish_id: 1,
          quantity: 2,
        }),
      ]),
    })
  })

  it("rejects dish not available at the branch", async () => {
    const res = await request(app).post("/api/orders").send({
      name: "Budi",
      phone: "0813-2222-2222",
      branch_id: 2,
      table_number: 5,
      items: [{ dish_id: 1, quantity: 1 }],
    })
    expect(res.status).toBe(400)
  })
})

describe("GET /api/orders/:id", () => {
  afterEach(async () => {
    await db("order_items").del()
    await db("orders").del()
    await db("reservations").del()
    await db("customers").del()
  })

  it("returns an order with items", async () => {
    const create = await request(app).post("/api/orders").send({
      name: "Sari",
      phone: "0813-3333-3333",
      branch_id: 1,
      table_number: 3,
      items: [{ dish_id: 1, quantity: 1 }],
    })
    const res = await request(app).get(`/api/orders/${create.body.order.id}`)
    expect(res.status).toBe(200)
    expect(res.body.order.id).toBe(create.body.order.id)
    expect(res.body.items).toHaveLength(1)
  })

  it("returns 404 for unknown order", async () => {
    const res = await request(app).get("/api/orders/99999")
    expect(res.status).toBe(404)
  })
})

describe("GET /api/orders/:id/track", () => {
  afterEach(async () => {
    await db("order_items").del()
    await db("orders").del()
    await db("reservations").del()
    await db("customers").del()
  })

  it("returns detailed tracking information including joined dish and sambal info", async () => {
    const create = await request(app).post("/api/orders").send({
      name: "Sari",
      phone: "0813-8888-8888",
      branch_id: 1,
      table_number: 7,
      items: [{ dish_id: 1, quantity: 2, sambal_id: 1, notes: "Extra pedas" }],
    })
    const orderId = create.body.order.id

    const res = await request(app).get(`/api/orders/${orderId}/track`)
    expect(res.status).toBe(200)
    expect(res.body.order.id).toBe(orderId)
    expect(res.body.order.table_number).toBe(7)
    expect(res.body.customer.name).toBe("Sari")
    expect(res.body.branch.id).toBe(1)
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0]).toHaveProperty("dish_name")
    expect(res.body.items[0]).toHaveProperty("dish_price")
    expect(res.body.items[0]).toHaveProperty("sambal_name")
    expect(res.body.items[0].notes).toBe("Extra pedas")
  })

  it("returns 404 for non-existent order id", async () => {
    const res = await request(app).get("/api/orders/99999/track")
    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/tidak ditemukan/i)
  })
})

