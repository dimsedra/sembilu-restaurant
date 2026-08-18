import { Router, Response } from "express"
import { db } from "../db"
import { requireStaffAuth, AuthenticatedRequest } from "./staff"
import { calculateDefaultEndTime, assignTableForReservation } from "./reservations"

const router = Router()

const ALLOWED_RESERVATION_STATUSES = ["confirmed", "completed", "cancelled"] as const
type ReservationStatus = (typeof ALLOWED_RESERVATION_STATUSES)[number]

/**
 * Resolves target branch ID and checks staff authorization.
 * Non-manager staff trying to query or create for another branch receive 403 Forbidden.
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
 * GET /api/staff/reservations
 * Returns today's (or specified date) reservations for staff branch with joined customer details
 */
router.get("/", requireStaffAuth, async (req: AuthenticatedRequest, res: Response) => {
  const staff = req.staff!

  const { branchId, isAllowed } = resolveBranchAccess(staff, req.query.branch_id)
  if (!isAllowed) {
    res.status(403).json({ error: "Forbidden: Cannot access reservations belonging to another branch." })
    return
  }

  try {
    let query = db("reservations")
      .join("customers", "reservations.customer_id", "customers.id")
      .where({ "reservations.branch_id": branchId })

    if (req.query.date) {
      query = query.whereRaw("DATE(reservations.date) = DATE(?)", [String(req.query.date)])
    } else {
      query = query.whereRaw("DATE(reservations.date) = CURRENT_DATE")
    }

    const reservations = await query
      .select(
        "reservations.*",
        "customers.name",
        "customers.phone",
        "customers.visit_count"
      )
      .orderBy("reservations.time", "asc")

    res.json(reservations)
  } catch (error) {
    console.error("Error fetching staff reservations:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

/**
 * PATCH /api/staff/reservations/:id/status
 * Update reservation status (guest check-in / cancellation)
 */
router.patch("/:id/status", requireStaffAuth, async (req: AuthenticatedRequest, res: Response) => {
  const staff = req.staff!
  const reservationId = Number(req.params.id)
  const { status } = req.body

  if (!status || !ALLOWED_RESERVATION_STATUSES.includes(status as ReservationStatus)) {
    res.status(400).json({ error: "Invalid reservation status value. Allowed: 'confirmed', 'completed', 'cancelled'." })
    return
  }

  try {
    const reservation = await db("reservations").where({ id: reservationId }).first()
    if (!reservation) {
      res.status(404).json({ error: "Reservation not found." })
      return
    }

    const { isAllowed } = resolveBranchAccess(staff, reservation.branch_id)
    if (!isAllowed) {
      res.status(403).json({ error: "Forbidden: Cannot edit reservations belonging to another branch." })
      return
    }

    await db("reservations").where({ id: reservationId }).update({
      status,
      updated_at: db.fn.now(),
    })

    const updatedReservation = await db("reservations").where({ id: reservationId }).first()

    res.json({ reservation: updatedReservation })
  } catch (error) {
    console.error("Error updating reservation status:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

/**
 * POST /api/staff/reservations
 * Create phone-in reservation from staff portal with customer phone upsert
 */
router.post("/", requireStaffAuth, async (req: AuthenticatedRequest, res: Response) => {
  const staff = req.staff!
  const { name, phone, date, time, party_size, notes, branch_id: inputBranchId, table_number, time_end } = req.body

  if (!name || !phone || !date || !time || !party_size) {
    res.status(400).json({ error: "Missing required fields: name, phone, date, time, party_size." })
    return
  }

  const { branchId, isAllowed } = resolveBranchAccess(staff, inputBranchId)
  if (!isAllowed) {
    res.status(403).json({ error: "Forbidden: Cannot create reservations for another branch." })
    return
  }

  try {
    const resolvedTimeEnd = time_end || calculateDefaultEndTime(time)
    const { tableNumber, error: tableError } = await assignTableForReservation(
      branchId,
      date,
      time,
      resolvedTimeEnd,
      party_size,
      table_number
    )

    if (tableError) {
      res.status(400).json({ error: "Table not found in this branch." })
      return
    }

    let customer = await db("customers").where({ phone }).first()

    if (customer) {
      await db("customers").where({ id: customer.id }).increment("visit_count", 1)
      customer = await db("customers").where({ id: customer.id }).first()
    } else {
      const [newCustomer] = await db("customers")
        .insert({ name, phone, visit_count: 1 })
        .returning("*")
      customer = newCustomer
    }

    const [reservation] = await db("reservations")
      .insert({
        customer_id: customer.id,
        branch_id: branchId,
        date,
        time,
        time_end: resolvedTimeEnd,
        table_number: tableNumber,
        party_size,
        status: "confirmed",
        notes: notes || null,
      })
      .returning("*")

    res.status(201).json({ reservation, customer })
  } catch (error) {
    console.error("Error creating staff reservation:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

export default router
