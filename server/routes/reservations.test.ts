import { describe, it, expect } from "vitest"
import request from "supertest"
import app from "../index"
import { db } from "../db"

describe("POST /api/reservations", () => {
  afterEach(async () => {
    await db("order_items").del()
    await db("orders").del()
    await db("reservations").del()
    await db("customers").del()
  })

  it("creates a customer and reservation for a new phone number", async () => {
    const res = await request(app).post("/api/reservations").send({
      name: "Budi",
      phone: "0812-1111-1111",
      branch_id: 1,
      date: "2026-08-15",
      time: "19:00",
      party_size: 4,
    })
    expect(res.status).toBe(201)
    expect(res.body.reservation).toHaveProperty("id")
    expect(res.body.customer.name).toBe("Budi")
    expect(res.body.customer.visit_count).toBe(1)
  })

  it("finds existing customer and increments visit_count", async () => {
    await request(app).post("/api/reservations").send({
      name: "Sari",
      phone: "0812-2222-2222",
      branch_id: 1,
      date: "2026-08-15",
      time: "18:00",
      party_size: 2,
    })
    const res = await request(app).post("/api/reservations").send({
      name: "Sari",
      phone: "0812-2222-2222",
      branch_id: 1,
      date: "2026-08-20",
      time: "19:00",
      party_size: 3,
    })
    expect(res.status).toBe(201)
    expect(res.body.customer.visit_count).toBe(2)
    expect(res.body.customer.name).toBe("Sari")
  })

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app).post("/api/reservations").send({
      name: "Budi",
    })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty("error")
  })

  it("returns 400 for invalid branch_id", async () => {
    const res = await request(app).post("/api/reservations").send({
      name: "Budi",
      phone: "0812-3333-3333",
      branch_id: 999,
      date: "2026-08-15",
      time: "19:00",
      party_size: 4,
    })
    expect(res.status).toBe(400)
  })
})
