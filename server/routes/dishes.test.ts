import { describe, it, expect } from "vitest"
import request from "supertest"
import app from "../index"

describe("GET /api/dishes", () => {
  it("returns all dishes", async () => {
    const res = await request(app).get("/api/dishes")
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(7)
    expect(res.body[0]).toHaveProperty("name")
    expect(res.body[0]).toHaveProperty("price")
    expect(res.body[0]).toHaveProperty("description")
  })

  it("returns a single dish by id", async () => {
    const res = await request(app).get("/api/dishes/1")
    expect(res.status).toBe(200)
    expect(res.body.name).toBe("Ikan Bakar Pantura")
    expect(res.body.price).toBe(89)
  })

  it("returns 404 for unknown dish", async () => {
    const res = await request(app).get("/api/dishes/999")
    expect(res.status).toBe(404)
  })

  it("filters dishes by branch_id", async () => {
    const res = await request(app).get("/api/dishes?branch_id=1")
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    res.body.forEach((dish: { branch_id: number }) => {
      expect(dish.branch_id).toBe(1)
    })
  })
})
