import { Router } from "express"
import { db } from "../db"

const router = Router()

router.post("/", async (req, res) => {
  const { name, phone, branch_id, date, time, party_size } = req.body

  if (!name || !phone || !branch_id || !date || !time || !party_size) {
    res.status(400).json({ error: "Semua field harus diisi" })
    return
  }

  const branch = await db("branches").where("id", branch_id).first()
  if (!branch) {
    res.status(400).json({ error: "Cabang tidak ditemukan" })
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

  const [{ id: reservationId }] = await db("reservations")
    .insert({
      customer_id: customer.id,
      branch_id,
      date,
      time,
      party_size,
    })
    .returning("id")

  const reservation = await db("reservations").where("id", reservationId).first()

  res.status(201).json({ reservation, customer })
})

export default router
