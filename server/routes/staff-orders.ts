import { Router, Response } from "express"
import { db } from "../db"
import { requireStaffAuth, AuthenticatedRequest } from "./staff"

const router = Router()

const VALID_ITEM_TRANSITIONS: Record<string, string> = {
  pending: "cooking",
  cooking: "done",
}

const ALLOWED_STAFF_ORDER_UPDATES = ["served", "paid"] as const
type AllowedOrderUpdate = (typeof ALLOWED_STAFF_ORDER_UPDATES)[number]

/**
 * Helper to check branch access for non-manager staff
 */
function checkBranchAccess(reqStaff: NonNullable<AuthenticatedRequest["staff"]>, targetBranchId: number): boolean {
  if (reqStaff.role === "manager") return true
  return reqStaff.branch_id === targetBranchId
}

/**
 * GET /api/staff/orders
 * Returns today's orders for staff member's branch (or specified branch for managers)
 */
router.get("/", requireStaffAuth, async (req: AuthenticatedRequest, res: Response) => {
  const staff = req.staff!

  // Check if non-manager explicitly passed a branch_id query different from their branch
  if (req.query.branch_id && staff.role !== "manager" && Number(req.query.branch_id) !== staff.branch_id) {
    res.status(403).json({ error: "Forbidden: Cannot access orders belonging to another branch." })
    return
  }

  const branchId =
    staff.role === "manager" && req.query.branch_id
      ? Number(req.query.branch_id)
      : staff.branch_id

  try {
    // Filter by branch_id AND today's date (DATE(created_at) = CURRENT_DATE)
    const orders = await db("orders")
      .where({ branch_id: branchId })
      .whereRaw("DATE(orders.created_at) = CURRENT_DATE")
      .orderBy("created_at", "desc")

    if (orders.length === 0) {
      res.json([])
      return
    }

    const orderIds = orders.map((o) => o.id)

    const items = await db("order_items")
      .join("dishes", "order_items.dish_id", "dishes.id")
      .leftJoin("sambals", "order_items.sambal_id", "sambals.id")
      .whereIn("order_id", orderIds)
      .select(
        "order_items.*",
        "dishes.name as dish_name",
        "dishes.price as dish_price",
        "sambals.name as sambal_name"
      )

    // Group items by order_id
    const ordersWithItems = orders.map((order) => {
      const orderItems = items.filter((item) => item.order_id === order.id)
      return {
        ...order,
        items: orderItems,
      }
    })

    res.json(ordersWithItems)
  } catch (error) {
    console.error("Error fetching staff orders:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

/**
 * PATCH /api/staff/orders/:id/items/:itemId
 * Update item status with strict state machine and auto parent order status propagation
 */
router.patch("/:id/items/:itemId", requireStaffAuth, async (req: AuthenticatedRequest, res: Response) => {
  const staff = req.staff!
  const orderId = Number(req.params.id)
  const itemId = Number(req.params.itemId)
  const { status: newStatus } = req.body

  if (!newStatus || typeof newStatus !== "string") {
    res.status(400).json({ error: "Status string is required." })
    return
  }

  try {
    const order = await db("orders").where({ id: orderId }).first()
    if (!order) {
      res.status(404).json({ error: "Order not found." })
      return
    }

    // Enforce branch isolation
    if (!checkBranchAccess(staff, order.branch_id)) {
      res.status(403).json({ error: "Forbidden: Cannot edit orders belonging to another branch." })
      return
    }

    const currentItem = await db("order_items").where({ id: itemId, order_id: orderId }).first()
    if (!currentItem) {
      res.status(404).json({ error: "Order item not found." })
      return
    }

    // State machine check
    if (VALID_ITEM_TRANSITIONS[currentItem.status] !== newStatus) {
      res.status(400).json({
        error: `Invalid status transition from '${currentItem.status}' to '${newStatus}'.`,
      })
      return
    }

    // Update item status
    await db("order_items").where({ id: itemId }).update({
      status: newStatus,
      updated_at: db.fn.now(),
    })

    // Fetch updated item
    const updatedItem = await db("order_items").where({ id: itemId }).first()

    // Auto propagate parent order status
    let newOrderStatus = order.status

    if (newStatus === "cooking" && order.status === "pending") {
      newOrderStatus = "cooking"
      await db("orders").where({ id: orderId }).update({ status: "cooking", updated_at: db.fn.now() })
    } else if (newStatus === "done") {
      const allItems = await db("order_items").where({ order_id: orderId })
      const allDone = allItems.every((item) => item.status === "done")
      if (allDone) {
        newOrderStatus = "done"
        await db("orders").where({ id: orderId }).update({ status: "done", updated_at: db.fn.now() })
      }
    }

    res.json({
      item: updatedItem,
      orderStatus: newOrderStatus,
    })
  } catch (error) {
    console.error("Error updating order item status:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

/**
 * PATCH /api/staff/orders/:id
 * Update overall order status to served or paid
 */
router.patch("/:id", requireStaffAuth, async (req: AuthenticatedRequest, res: Response) => {
  const staff = req.staff!
  const orderId = Number(req.params.id)
  const { status: newStatus } = req.body

  if (!newStatus || !ALLOWED_STAFF_ORDER_UPDATES.includes(newStatus as AllowedOrderUpdate)) {
    res.status(400).json({ error: "Invalid order status value. Allowed status updates: 'served', 'paid'." })
    return
  }

  try {
    const order = await db("orders").where({ id: orderId }).first()
    if (!order) {
      res.status(404).json({ error: "Order not found." })
      return
    }

    // Enforce branch isolation
    if (!checkBranchAccess(staff, order.branch_id)) {
      res.status(403).json({ error: "Forbidden: Cannot edit orders belonging to another branch." })
      return
    }

    await db("orders").where({ id: orderId }).update({
      status: newStatus,
      updated_at: db.fn.now(),
    })

    const updatedOrder = await db("orders").where({ id: orderId }).first()

    res.json({ order: updatedOrder })
  } catch (error) {
    console.error("Error updating order status:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

export default router
