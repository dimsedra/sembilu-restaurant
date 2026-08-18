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

  it("allows order on walk-in table (tables 1-9) without reservation", async () => {
    const res = await request(app).post("/api/orders").send({
      name: "Andi",
      phone: "0812-9999-0001",
      branch_id: 1,
      table_number: 1,
      items: [{ dish_id: 1, quantity: 1 }],
    })
    expect(res.status).toBe(201)
    expect(res.body.order.table_number).toBe(1)
  })

  it("allows order on reserved table (tables 10-12) when customer has active reservation in time window", async () => {
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`

    const [customer] = await db("customers")
      .insert({ name: "Rina", phone: "0812-9999-1010", visit_count: 1 })
      .returning("*")

    await db("reservations").insert({
      customer_id: customer.id,
      branch_id: 1,
      table_number: 10,
      date: todayStr,
      time: timeStr,
      party_size: 4,
      status: "confirmed",
    })

    const res = await request(app).post("/api/orders").send({
      name: "Rina",
      phone: "0812-9999-1010",
      branch_id: 1,
      table_number: 10,
      items: [{ dish_id: 1, quantity: 1 }],
    })
    expect(res.status).toBe(201)
    expect(res.body.order.table_number).toBe(10)
  })

  it("rejects order on reserved table when phone number does not match reservation", async () => {
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`

    const [customer] = await db("customers")
      .insert({ name: "Rina", phone: "0812-9999-1010", visit_count: 1 })
      .returning("*")

    await db("reservations").insert({
      customer_id: customer.id,
      branch_id: 1,
      table_number: 10,
      date: todayStr,
      time: timeStr,
      party_size: 4,
      status: "confirmed",
    })

    const res = await request(app).post("/api/orders").send({
      name: "Imposter",
      phone: "0812-0000-9999",
      branch_id: 1,
      table_number: 10,
      items: [{ dish_id: 1, quantity: 1 }],
    })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(
      "Meja ini khusus untuk reservasi. Tidak ada reservasi aktif yang cocok dengan data Anda."
    )
  })

  it("rejects order on reserved table when there is no active reservation", async () => {
    const res = await request(app).post("/api/orders").send({
      name: "Dewi",
      phone: "0812-9999-2020",
      branch_id: 1,
      table_number: 11,
      items: [{ dish_id: 1, quantity: 1 }],
    })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(
      "Meja ini khusus untuk reservasi. Tidak ada reservasi aktif yang cocok dengan data Anda."
    )
  })

  it("rejects order on reserved table when reservation is on a different date", async () => {
    const [customer] = await db("customers")
      .insert({ name: "Joko", phone: "0812-9999-3030", visit_count: 1 })
      .returning("*")

    await db("reservations").insert({
      customer_id: customer.id,
      branch_id: 1,
      table_number: 12,
      date: "2020-01-01",
      time: "12:00:00",
      party_size: 4,
      status: "confirmed",
    })

    const res = await request(app).post("/api/orders").send({
      name: "Joko",
      phone: "0812-9999-3030",
      branch_id: 1,
      table_number: 12,
      items: [{ dish_id: 1, quantity: 1 }],
    })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(
      "Meja ini khusus untuk reservasi. Tidak ada reservasi aktif yang cocok dengan data Anda."
    )
  })

  it("rejects order on reserved table when reservation is outside time window", async () => {
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    // 5 hours ahead
    const farHour = (now.getHours() + 5) % 24
    const farTimeStr = `${String(farHour).padStart(2, "0")}:00:00`
    const farEndTimeStr = `${String((farHour + 2) % 24).padStart(2, "0")}:00:00`

    const [customer] = await db("customers")
      .insert({ name: "Doni", phone: "0812-9999-4040", visit_count: 1 })
      .returning("*")

    await db("reservations").insert({
      customer_id: customer.id,
      branch_id: 1,
      table_number: 12,
      date: todayStr,
      time: farTimeStr,
      time_end: farEndTimeStr,
      party_size: 4,
      status: "confirmed",
    })

    const res = await request(app).post("/api/orders").send({
      name: "Doni",
      phone: "0812-9999-4040",
      branch_id: 1,
      table_number: 12,
      items: [{ dish_id: 1, quantity: 1 }],
    })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe(
      "Meja ini khusus untuk reservasi. Tidak ada reservasi aktif yang cocok dengan data Anda."
    )
  })

  it("rejects order when table does not exist in branch", async () => {
    const res = await request(app).post("/api/orders").send({
      name: "Unknown Table",
      phone: "0812-9999-5050",
      branch_id: 1,
      table_number: 99,
      items: [{ dish_id: 1, quantity: 1 }],
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Meja tidak ditemukan di cabang ini")
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

