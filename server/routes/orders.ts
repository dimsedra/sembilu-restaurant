import { Router } from "express"
import { db } from "../db"

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

  res.status(201).json({ order, items: savedItems, customer })
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
