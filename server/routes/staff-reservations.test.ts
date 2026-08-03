import { describe, it, expect, beforeAll } from "vitest"
import request from "supertest"
import app from "../index"
import { db } from "../db"

describe("T8: Staff Reservations API (/api/staff/reservations)", () => {
  let waiterToken: string
  let managerToken: string
  let testCustomerId: number
  let testReservationId: number
  let branch2ReservationId: number
  const todayDate = new Date().toISOString().split("T")[0]

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

    // 3. Find or create test customer
    let customer = await db("customers").where({ phone: "081299998888" }).first()
    if (!customer) {
      const [newCust] = await db("customers")
        .insert({ name: "Pak Budi", phone: "081299998888", visit_count: 3 })
        .returning("*")
      customer = newCust
    }
    testCustomerId = customer.id

    // 4. Create test reservation for branch 1 (Tegal) today
    const [res1] = await db("reservations")
      .insert({
        customer_id: testCustomerId,
        branch_id: 1,
        date: todayDate,
        time: "19:00",
        party_size: 4,
        status: "confirmed",
      })
      .returning("*")
    testReservationId = res1.id

    // 5. Create test reservation for branch 2 (Slawi) today
    const [res2] = await db("reservations")
      .insert({
        customer_id: testCustomerId,
        branch_id: 2,
        date: todayDate,
        time: "20:00",
        party_size: 2,
        status: "confirmed",
      })
      .returning("*")
    branch2ReservationId = res2.id
  })

  describe("GET /api/staff/reservations", () => {
    it("returns 401 when Bearer token is missing", async () => {
      const res = await request(app).get("/api/staff/reservations")
      expect(res.status).toBe(401)
    })

    it("returns today's reservations for staff member's branch with joined customer details", async () => {
      const res = await request(app)
        .get("/api/staff/reservations")
        .set("Authorization", `Bearer ${waiterToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body.every((r: any) => r.branch_id === 1)).toBe(true)
      expect(res.body.some((r: any) => r.id === branch2ReservationId)).toBe(false)
      expect(res.body[0]).toHaveProperty("name")
      expect(res.body[0]).toHaveProperty("phone")
      expect(res.body[0]).toHaveProperty("visit_count")
    })

    it("returns 403 when non-manager waiter attempts cross-branch query ?branch_id=2", async () => {
      const res = await request(app)
        .get("/api/staff/reservations?branch_id=2")
        .set("Authorization", `Bearer ${waiterToken}`)

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/Forbidden/i)
    })

    it("allows managers to query reservations for another branch using ?branch_id", async () => {
      const res = await request(app)
        .get("/api/staff/reservations?branch_id=2")
        .set("Authorization", `Bearer ${managerToken}`)

      expect(res.status).toBe(200)
      expect(res.body.every((r: any) => r.branch_id === 2)).toBe(true)
    })
  })

  describe("PATCH /api/staff/reservations/:id/status", () => {
    it("updates reservation status to completed (guest check-in)", async () => {
      const res = await request(app)
        .patch(`/api/staff/reservations/${testReservationId}/status`)
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ status: "completed" })

      expect(res.status).toBe(200)
      expect(res.body.reservation.status).toBe("completed")
    })

    it("returns 403 Forbidden when non-manager waiter attempts to edit branch 2 reservation", async () => {
      const res = await request(app)
        .patch(`/api/staff/reservations/${branch2ReservationId}/status`)
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ status: "completed" })

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/Forbidden/i)
    })

    it("returns 400 for invalid status string", async () => {
      const res = await request(app)
        .patch(`/api/staff/reservations/${testReservationId}/status`)
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ status: "unknown_status" })

      expect(res.status).toBe(400)
    })
  })

  describe("POST /api/staff/reservations", () => {
    it("creates a new phone reservation and upserts customer record", async () => {
      const uniquePhone = `0819${Math.floor(100000 + Math.random() * 900000)}`
      const res = await request(app)
        .post("/api/staff/reservations")
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({
          name: "Ibu Siti",
          phone: uniquePhone,
          date: todayDate,
          time: "18:30",
          party_size: 3,
          notes: "Phone booking for family",
        })

      expect(res.status).toBe(201)
      expect(res.body.reservation.branch_id).toBe(1)
      expect(res.body.customer.name).toBe("Ibu Siti")
      expect(res.body.customer.visit_count).toBe(1)
    })

    it("returns 403 Forbidden when non-manager waiter attempts cross-branch creation branch_id=2", async () => {
      const uniquePhone = `0819${Math.floor(100000 + Math.random() * 900000)}`
      const res = await request(app)
        .post("/api/staff/reservations")
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({
          name: "Ibu Siti",
          phone: uniquePhone,
          date: todayDate,
          time: "18:30",
          party_size: 3,
          branch_id: 2,
        })

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/Forbidden/i)
    })

    it("returns 400 when missing required fields", async () => {
      const res = await request(app)
        .post("/api/staff/reservations")
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ name: "Ibu Siti" })

      expect(res.status).toBe(400)
    })
  })
})
