import { describe, it, expect } from "vitest"
import request from "supertest"
import app from "../index"

describe("GET /api/sambals", () => {
  it("returns all 9 sambals", async () => {
    const res = await request(app).get("/api/sambals")
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(9)
    expect(res.body[0]).toHaveProperty("name")
    expect(res.body[0]).toHaveProperty("heat")
    expect(res.body[0]).toHaveProperty("note")
  })

  it("each sambal has a valid heat level", async () => {
    const res = await request(app).get("/api/sambals")
    res.body.forEach((s: { heat: number }) => {
      expect(s.heat).toBeGreaterThanOrEqual(1)
      expect(s.heat).toBeLessThanOrEqual(3)
    })
  })
})
