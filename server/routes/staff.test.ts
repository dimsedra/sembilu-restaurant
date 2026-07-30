import { describe, it, expect } from "vitest"
import request from "supertest"
import jwt from "jsonwebtoken"
import app from "../index"
import { getJwtSecret, isValidStaffPayload } from "./staff"

describe("Staff Auth API", () => {
  describe("POST /api/staff/login", () => {
    it("returns a JWT token and staff info on valid credentials", async () => {
      const res = await request(app)
        .post("/api/staff/login")
        .send({
          email: "wati@sembilu.com",
          password: "password123",
        })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty("token")
      expect(typeof res.body.token).toBe("string")
      expect(res.body).toHaveProperty("staff")
      expect(res.body.staff.email).toBe("wati@sembilu.com")
      expect(res.body.staff.role).toBe("waiter")
      expect(res.body.staff.branch_id).toBe(1)
      expect(res.body.staff).not.toHaveProperty("password_hash")
    })

    it("returns 401 on invalid password", async () => {
      const res = await request(app)
        .post("/api/staff/login")
        .send({
          email: "wati@sembilu.com",
          password: "wrongpassword",
        })

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty("error")
    })

    it("returns 401 for non-existent email", async () => {
      const res = await request(app)
        .post("/api/staff/login")
        .send({
          email: "ghost@sembilu.com",
          password: "password123",
        })

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty("error")
    })

    it("returns 400 when email or password is missing", async () => {
      const res = await request(app)
        .post("/api/staff/login")
        .send({
          email: "wati@sembilu.com",
        })

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty("error")
    })
  })

  describe("GET /api/staff/me (Protected Route)", () => {
    it("returns staff payload when valid Bearer token is provided", async () => {
      const loginRes = await request(app)
        .post("/api/staff/login")
        .send({
          email: "wati@sembilu.com",
          password: "password123",
        })

      const token = loginRes.body.token

      const meRes = await request(app)
        .get("/api/staff/me")
        .set("Authorization", `Bearer ${token}`)

      expect(meRes.status).toBe(200)
      expect(meRes.body.staff.role).toBe("waiter")
      expect(meRes.body.staff.branch_id).toBe(1)
    })

    it("returns 401 when Authorization header is missing", async () => {
      const res = await request(app).get("/api/staff/me")
      expect(res.status).toBe(401)
      expect(res.body.error).toMatch(/Authentication required/i)
    })

    it("returns 401 when token is invalid", async () => {
      const res = await request(app)
        .get("/api/staff/me")
        .set("Authorization", "Bearer invalid.fake.token")

      expect(res.status).toBe(401)
      expect(res.body.error).toMatch(/Invalid or expired token/i)
    })

    it("returns 401 when token payload structure is invalid", async () => {
      const secret = getJwtSecret()
      // Sign token with malformed payload (missing branch_id and staff_id is string)
      const malformedToken = jwt.sign({ staff_id: "not-a-number" }, secret)

      const res = await request(app)
        .get("/api/staff/me")
        .set("Authorization", `Bearer ${malformedToken}`)

      expect(res.status).toBe(401)
      expect(res.body.error).toMatch(/Invalid token payload structure/i)
    })
  })

  describe("JWT Secret & Runtime Payload Validation Unit Helpers", () => {
    it("validates StaffPayload structure correctly", () => {
      expect(isValidStaffPayload({ staff_id: 1, role: "waiter", branch_id: 1 })).toBe(true)
      expect(isValidStaffPayload({ staff_id: "1", role: "waiter", branch_id: 1 })).toBe(false)
      expect(isValidStaffPayload({ staff_id: 1, role: 123, branch_id: 1 })).toBe(false)
      expect(isValidStaffPayload(null)).toBe(false)
      expect(isValidStaffPayload("string-payload")).toBe(false)
    })

    it("throws an error in production when JWT_SECRET is missing", () => {
      const originalEnv = process.env.NODE_ENV
      const originalSecret = process.env.JWT_SECRET
      try {
        process.env.NODE_ENV = "production"
        delete process.env.JWT_SECRET
        expect(() => getJwtSecret()).toThrow(/JWT_SECRET environment variable is missing/i)
      } finally {
        process.env.NODE_ENV = originalEnv
        process.env.JWT_SECRET = originalSecret
      }
    })
  })
})
