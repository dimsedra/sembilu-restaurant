import "dotenv/config"
import { beforeAll, afterAll } from "vitest"
import { db } from "./db"

beforeAll(async () => {
  try {
    await db.migrate.latest()
    await db.seed.run()
  } catch (err) {
    // If Postgres is not running (e.g. running pure client-side unit tests), ignore setup error
  }
})

afterAll(async () => {
  try {
    await db.destroy()
  } catch (_err) {
    // ignore
  }
})
