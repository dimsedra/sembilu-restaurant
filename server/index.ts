import "dotenv/config"
import express from "express"
import cors from "cors"
import { db } from "./db"
import dishesRouter from "./routes/dishes"
import sambalsRouter from "./routes/sambals"
import reservationsRouter from "./routes/reservations"

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" })
})

app.use("/api/dishes", dishesRouter)
app.use("/api/sambals", sambalsRouter)
app.use("/api/reservations", reservationsRouter)

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🍽️ Sembilu API running on http://localhost:${PORT}`)
  })
}

process.on("SIGTERM", () => db.destroy())

export default app
