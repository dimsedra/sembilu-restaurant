import { fileURLToPath } from "url"
import { dirname, resolve } from "path"
import type { Knex } from "knex"

const __dirname = dirname(fileURLToPath(import.meta.url))

const config: Knex.Config = {
  client: "pg",
  connection: process.env.DATABASE_URL || "postgres://localhost:5432/sembilu",
  migrations: {
    directory: resolve(__dirname, "migrations"),
    extension: "ts",
  },
  seeds: {
    directory: resolve(__dirname, "seeds"),
    extension: "ts",
  },
}

export default config
