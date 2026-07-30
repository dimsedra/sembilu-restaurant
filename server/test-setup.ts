import "dotenv/config"
import { beforeAll, afterAll } from "vitest"
import { db } from "./db"

beforeAll(async () => {
  await db.migrate.latest()
  await db.seed.run()
})

afterAll(async () => {
  await db.destroy()
})
