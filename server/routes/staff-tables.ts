import { Router, Response } from "express"
import { db } from "../db"
import { requireStaffAuth, AuthenticatedRequest } from "./staff"

const router = Router()

export const ALLOWED_TABLE_STATUSES = ["free", "occupied", "reserved"] as const
export type TableStatus = (typeof ALLOWED_TABLE_STATUSES)[number]

/**
 * Resolves target branch ID and checks staff authorization.
 * Non-manager staff trying to query or update for another branch receive 403 Forbidden.
 */
function resolveBranchAccess(
  staff: NonNullable<AuthenticatedRequest["staff"]>,
  requestedBranchId?: unknown
): { branchId: number; isAllowed: boolean } {
  if (!requestedBranchId) {
    return { branchId: staff.branch_id, isAllowed: true }
  }

  const targetId = Number(requestedBranchId)
  if (staff.role === "manager") {
    return { branchId: targetId, isAllowed: true }
  }

  if (targetId !== staff.branch_id) {
    return { branchId: targetId, isAllowed: false }
  }

  return { branchId: staff.branch_id, isAllowed: true }
}

/**
 * GET /api/staff/tables
 * Returns tables for the staff member's branch (or requested branch for managers)
 * ordered by table_number ascending.
 */
router.get("/", requireStaffAuth, async (req: AuthenticatedRequest, res: Response) => {
  const staff = req.staff!

  const { branchId, isAllowed } = resolveBranchAccess(staff, req.query.branch_id)
  if (!isAllowed) {
    res.status(403).json({ error: "Forbidden: Cannot access tables belonging to another branch." })
    return
  }

  try {
    const tables = await db("tables")
      .where({ branch_id: branchId })
      .orderBy("table_number", "asc")

    res.json(tables)
  } catch (error) {
    console.error("Error fetching staff tables:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

/**
 * PATCH /api/staff/tables/:id
 * Updates table status. Validates status against ALLOWED_TABLE_STATUSES and enforces branch isolation.
 */
router.patch("/:id", requireStaffAuth, async (req: AuthenticatedRequest, res: Response) => {
  const staff = req.staff!
  const tableId = Number(req.params.id)
  const { status } = req.body

  if (!status || !ALLOWED_TABLE_STATUSES.includes(status as TableStatus)) {
    res.status(400).json({
      error: `Invalid status '${status}'. Allowed statuses: ${ALLOWED_TABLE_STATUSES.map((s) => `'${s}'`).join(", ")}.`,
    })
    return
  }

  try {
    const table = await db("tables").where({ id: tableId }).first()
    if (!table) {
      res.status(404).json({ error: "Table not found." })
      return
    }

    const { isAllowed } = resolveBranchAccess(staff, table.branch_id)
    if (!isAllowed) {
      res.status(403).json({ error: "Forbidden: Cannot edit tables belonging to another branch." })
      return
    }

    await db("tables").where({ id: tableId }).update({
      status,
      updated_at: new Date(),
    })

    const updatedTable = await db("tables").where({ id: tableId }).first()
    res.json(updatedTable)
  } catch (error) {
    console.error("Error updating table status:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

export default router
