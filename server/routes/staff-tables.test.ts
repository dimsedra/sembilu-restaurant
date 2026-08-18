import { describe, it, expect, beforeAll } from "vitest"
import request from "supertest"
import app from "../index"
import { db } from "../db"

describe("Staff Tables API (/api/staff/tables)", () => {
  let waiterToken: string
  let managerToken: string
  let branch1TableId: number
  let branch2TableId: number

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

    // 3. Get table for branch 1
    const t1 = await db("tables").where({ branch_id: 1 }).orderBy("table_number", "asc").first()
    branch1TableId = t1.id

    // 4. Get table for branch 2
    const t2 = await db("tables").where({ branch_id: 2 }).orderBy("table_number", "asc").first()
    branch2TableId = t2.id
  })

  describe("GET /api/staff/tables", () => {
    it("returns 401 when no token is supplied", async () => {
      const res = await request(app).get("/api/staff/tables")
      expect(res.status).toBe(401)
      expect(res.body.error).toBeDefined()
    })

    it("returns 403 when non-manager requests tables for another branch", async () => {
      const res = await request(app)
        .get("/api/staff/tables?branch_id=2")
        .set("Authorization", `Bearer ${waiterToken}`)

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/forbidden/i)
    })

    it("returns tables list for the staff member's branch ordered by table_number ascending", async () => {
      const res = await request(app)
        .get("/api/staff/tables")
        .set("Authorization", `Bearer ${waiterToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(12)
      expect(res.body.every((t: any) => t.branch_id === 1)).toBe(true)
      // Check ascending order
      for (let i = 0; i < res.body.length - 1; i++) {
        expect(res.body[i].table_number).toBeLessThan(res.body[i + 1].table_number)
      }
    })

    it("allows managers to query tables for another branch", async () => {
      const res = await request(app)
        .get("/api/staff/tables?branch_id=2")
        .set("Authorization", `Bearer ${managerToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(12)
      expect(res.body.every((t: any) => t.branch_id === 2)).toBe(true)
    })
  })

  describe("PATCH /api/staff/tables/:id", () => {
    it("returns 401 when no token is supplied", async () => {
      const res = await request(app)
        .patch(`/api/staff/tables/${branch1TableId}`)
        .send({ status: "occupied" })

      expect(res.status).toBe(401)
    })

    it("updates status (free -> occupied -> free)", async () => {
      // 1. Change to occupied
      const res1 = await request(app)
        .patch(`/api/staff/tables/${branch1TableId}`)
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ status: "occupied" })

      expect(res1.status).toBe(200)
      expect(res1.body.status).toBe("occupied")
      expect(res1.body.id).toBe(branch1TableId)

      // 2. Change back to free
      const res2 = await request(app)
        .patch(`/api/staff/tables/${branch1TableId}`)
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ status: "free" })

      expect(res2.status).toBe(200)
      expect(res2.body.status).toBe("free")
      expect(res2.body.id).toBe(branch1TableId)
    })

    it("returns 400 with invalid status string", async () => {
      const res = await request(app)
        .patch(`/api/staff/tables/${branch1TableId}`)
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ status: "broken" })

      expect(res.status).toBe(400)
      expect(res.body.error).toBeDefined()
    })

    it("returns 404 for non-existent table ID", async () => {
      const res = await request(app)
        .patch("/api/staff/tables/99999")
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ status: "occupied" })

      expect(res.status).toBe(404)
      expect(res.body.error).toBeDefined()
    })

    it("returns 403 when modifying another branch's table as a regular waiter", async () => {
      const res = await request(app)
        .patch(`/api/staff/tables/${branch2TableId}`)
        .set("Authorization", `Bearer ${waiterToken}`)
        .send({ status: "occupied" })

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/forbidden/i)
    })
  })
})
