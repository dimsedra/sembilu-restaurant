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

  it("calculates default time_end (+2 hours) and auto-assigns an available reserved table", async () => {
    const res = await request(app).post("/api/reservations").send({
      name: "Andi",
      phone: "0812-4444-4444",
      branch_id: 1,
      date: "2026-08-25",
      time: "19:00",
      party_size: 4,
    })
    expect(res.status).toBe(201)
    expect(res.body.reservation.table_number).toBe(10)
    expect(res.body.reservation.time_end).toMatch(/^21:00/)
  })

  it("accepts explicit valid table_number and time_end", async () => {
    const res = await request(app).post("/api/reservations").send({
      name: "Dewi",
      phone: "0812-5555-5555",
      branch_id: 1,
      date: "2026-08-25",
      time: "19:00",
      time_end: "21:30:00",
      party_size: 4,
      table_number: 11,
    })
    expect(res.status).toBe(201)
    expect(res.body.reservation.table_number).toBe(11)
    expect(res.body.reservation.time_end).toMatch(/^21:30/)
  })

  it("assigns next available table if earlier table is booked at overlapping time", async () => {
    // First booking gets table 10 (cap 6)
    const res1 = await request(app).post("/api/reservations").send({
      name: "Guest 1",
      phone: "0812-6666-0001",
      branch_id: 1,
      date: "2026-08-26",
      time: "19:00",
      party_size: 4,
    })
    expect(res1.status).toBe(201)
    expect(res1.body.reservation.table_number).toBe(10)

    // Second booking at overlapping time gets table 11 (cap 8)
    const res2 = await request(app).post("/api/reservations").send({
      name: "Guest 2",
      phone: "0812-6666-0002",
      branch_id: 1,
      date: "2026-08-26",
      time: "19:30",
      party_size: 4,
    })
    expect(res2.status).toBe(201)
    expect(res2.body.reservation.table_number).toBe(11)
  })

  it("returns 400 when explicitly requested table does not exist in branch", async () => {
    const res = await request(app).post("/api/reservations").send({
      name: "Eko",
      phone: "0812-7777-7777",
      branch_id: 1,
      date: "2026-08-25",
      time: "19:00",
      party_size: 4,
      table_number: 99,
    })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty("error")
  })
})
