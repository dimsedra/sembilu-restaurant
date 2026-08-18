import "dotenv/config"
import http from "http"
import express from "express"
import cors from "cors"
import { db } from "./db"
import { initWebSocketServer, closeWebSocketServer } from "./websocket"
import dishesRouter from "./routes/dishes"
import sambalsRouter from "./routes/sambals"
import reservationsRouter from "./routes/reservations"
import ordersRouter from "./routes/orders"
import staffRouter from "./routes/staff"
import staffOrdersRouter from "./routes/staff-orders"
import staffReservationsRouter from "./routes/staff-reservations"
import staffTablesRouter from "./routes/staff-tables"

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 3001

initWebSocketServer(server)

app.use(cors())
app.use(express.json())

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" })
})

app.use("/api/dishes", dishesRouter)
app.use("/api/sambals", sambalsRouter)
app.use("/api/reservations", reservationsRouter)
app.use("/api/orders", ordersRouter)
app.use("/api/staff/orders", staffOrdersRouter)
app.use("/api/staff/reservations", staffReservationsRouter)
app.use("/api/staff/tables", staffTablesRouter)
app.use("/api/staff", staffRouter)

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`🍽️ Sembilu API running on http://localhost:${PORT}`)
  })
}

process.on("SIGTERM", async () => {
  await closeWebSocketServer()
  await db.destroy()
})

export { app, server }
export default app

