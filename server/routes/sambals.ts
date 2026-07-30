import { Router } from "express"
import { db } from "../db"

const router = Router()

router.get("/", async (_req, res) => {
  const sambals = await db("sambals").orderBy("id")
  res.json(sambals)
})

export default router
