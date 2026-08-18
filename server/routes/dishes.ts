import { Router } from "express"
import { db } from "../db"

const router = Router()

router.get("/", async (req, res) => {
  const branchId = Number(req.query.branch_id)
  if (branchId > 0) {
    const dishes = await db("dishes").where("branch_id", branchId).orderBy("id")
    if (dishes.length > 0) {
      res.json(dishes)
      return
    }
  }
  const allDishes = await db("dishes").orderBy("id")
  res.json(allDishes)
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
