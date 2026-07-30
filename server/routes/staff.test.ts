import { describe, it, expect } from "vitest"
import request from "supertest"
import app from "../index"

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
      // 1. Log in to get a valid token
      const loginRes = await request(app)
        .post("/api/staff/login")
        .send({
          email: "wati@sembilu.com",
          password: "password123",
        })

      const token = loginRes.body.token

      // 2. Call protected route
      const meRes = await request(app)
        .get("/api/staff/me")
        .set("Authorization", `Bearer ${token}`)

      expect(meRes.status).toBe(200)
      expect(meRes.body.staff.email).toBe(undefined) // payload contains staff_id, role, branch_id
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
  })
})

