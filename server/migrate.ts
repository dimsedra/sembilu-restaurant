import "dotenv/config"
import { db } from "./db"

async function run() {
  try {
    const [batch, log] = await db.migrate.latest()
    console.log(`Migrations up to batch ${batch}: ${log.length} ran`)
    log.forEach((name) => console.log(`  ✓ ${name}`))
  } catch (err) {
    console.error("Migration failed:", err)
    process.exit(1)
  }
  await db.destroy()
}

run()
