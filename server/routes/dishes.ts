import { Router } from "express"
import { db } from "../db"

const router = Router()

router.get("/", async (req, res) => {
  const query = db("dishes")
  if (req.query.branch_id) {
    query.where("branch_id", Number(req.query.branch_id))
  }
  const dishes = await query.orderBy("id")
  res.json(dishes)
})

router.get("/:id", async (req, res) => {
  const dish = await db("dishes").where("id", Number(req.params.id)).first()
  if (!dish) {
    res.status(404).json({ error: "Dish not found" })
    return
  }
  res.json(dish)
})

export default router
