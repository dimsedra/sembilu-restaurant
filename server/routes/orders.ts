import { Router } from "express"
import { db } from "../db"
import { broadcastOrderUpdate } from "../websocket"

const router = Router()

router.post("/", async (req, res) => {
  const { name, phone, branch_id, table_number, items } = req.body

  if (!name || !phone || !branch_id || !table_number || !items?.length) {
    res.status(400).json({ error: "Semua field harus diisi" })
    return
  }

  const branch = await db("branches").where("id", branch_id).first()
  if (!branch) {
    res.status(400).json({ error: "Cabang tidak ditemukan" })
    return
  }

  const table = await db("tables").where({ branch_id, table_number }).first()
  if (!table) {
    res.status(400).json({ error: "Meja tidak ditemukan di cabang ini" })
    return
  }

  if (!table.is_walk_in) {
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const activeReservations = await db("reservations")
      .join("customers", "reservations.customer_id", "customers.id")
      .where({
        "reservations.branch_id": branch_id,
        "reservations.table_number": table_number,
      })
      .whereIn("reservations.status", ["confirmed", "completed"])
      .whereRaw("DATE(reservations.date) = DATE(?)", [todayStr])
      .select("reservations.*", "customers.phone as customer_phone")

    const matchingRes = activeReservations.find((r) => {
      if (r.customer_phone !== phone) return false

      const [startH, startM] = String(r.time).split(":").map(Number)
      const startMin = startH * 60 + (startM || 0) - 15 // 15 min early buffer

      let endMin: number
      if (r.time_end) {
        const [endH, endM] = String(r.time_end).split(":").map(Number)
        let totalEnd = endH * 60 + (endM || 0)
        if (totalEnd < startH * 60 + (startM || 0)) {
          totalEnd += 24 * 60 // wraps past midnight
        }
        endMin = totalEnd + 15 // 15 min late buffer
      } else {
        endMin = startH * 60 + (startM || 0) + 120 + 15
      }

      return currentMinutes >= startMin && currentMinutes <= endMin
    })

    if (!matchingRes) {
      res.status(403).json({
        error: "Meja ini khusus untuk reservasi. Tidak ada reservasi aktif yang cocok dengan data Anda.",
      })
      return
    }
  }

  const dishIds = items.map((i: { dish_id: number }) => i.dish_id)
  const validDishes = await db("dishes").whereIn("id", dishIds).andWhere("branch_id", branch_id)
  if (validDishes.length !== new Set(dishIds).size) {
    res.status(400).json({ error: "Beberapa menu tidak tersedia di cabang ini" })
    return
  }

  let customer = await db("customers").where("phone", phone).first()
  if (customer) {
    await db("customers").where("id", customer.id).increment("visit_count", 1)
    customer = await db("customers").where("id", customer.id).first()
  } else {
    await db("customers").insert({ name, phone, visit_count: 1 })
    customer = await db("customers").where("phone", phone).first()
  }

  const [{ id: orderId }] = await db("orders")
    .insert({ branch_id, customer_id: customer.id, table_number })
    .returning("id")

  const orderItems = items.map((item: { dish_id: number; quantity?: number; sambal_id?: number | null; sambal_extra?: boolean; notes?: string }) => ({
    order_id: orderId,
    dish_id: item.dish_id,
    quantity: item.quantity || 1,
    sambal_id: item.sambal_id || null,
    sambal_extra: item.sambal_extra || false,
    notes: item.notes || null,
  }))

  await db("order_items").insert(orderItems)
  const savedItems = await db("order_items").where("order_id", orderId)
  const order = await db("orders").where("id", orderId).first()

  broadcastOrderUpdate({
    event: "order_created",
    orderId: order.id,
    status: order.status || "pending",
    items: savedItems,
  })

  res.status(201).json({ order, items: savedItems, customer })
})

router.get("/:id/track", async (req, res) => {
  const orderId = Number(req.params.id)
  const order = await db("orders").where({ id: orderId }).first()
  if (!order) {
    res.status(404).json({ error: "Pesanan tidak ditemukan" })
    return
  }

  const customer = order.customer_id
    ? await db("customers").where({ id: order.customer_id }).select("name", "phone").first()
    : null
  const branch = await db("branches").where({ id: order.branch_id }).first()

  const items = await db("order_items")
    .join("dishes", "order_items.dish_id", "dishes.id")
    .leftJoin("sambals", "order_items.sambal_id", "sambals.id")
    .where("order_items.order_id", orderId)
    .select(
      "order_items.*",
      "dishes.name as dish_name",
      "dishes.price as dish_price",
      "sambals.name as sambal_name",
      "sambals.heat as sambal_heat_level"
    )

  res.json({
    order,
    customer,
    branch,
    items,
  })
})

router.get("/:id", async (req, res) => {
  const order = await db("orders").where("id", Number(req.params.id)).first()
  if (!order) {
    res.status(404).json({ error: "Pesanan tidak ditemukan" })
    return
  }
  const items = await db("order_items").where("order_id", order.id)
  res.json({ order, items })
})


export default router
