import { Router } from "express"
import { db } from "../db"

const router = Router()

export function calculateDefaultEndTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number)
  const endHours = (hours + 2) % 24
  return `${String(endHours).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}:00`
}

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + (minutes || 0)
}

export function isTimeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  let aStart = parseTimeToMinutes(startA)
  let aEnd = parseTimeToMinutes(endA)
  if (aEnd <= aStart) aEnd += 24 * 60

  let bStart = parseTimeToMinutes(startB)
  let bEnd = parseTimeToMinutes(endB)
  if (bEnd <= bStart) bEnd += 24 * 60

  return aStart < bEnd && aEnd > bStart
}

export async function assignTableForReservation(
  branchId: number,
  date: string,
  time: string,
  timeEnd: string,
  partySize: number,
  requestedTableNumber?: number | null
): Promise<{ tableNumber: number | null; error?: string }> {
  if (requestedTableNumber != null) {
    const table = await db("tables")
      .where({ branch_id: branchId, table_number: requestedTableNumber })
      .first()
    if (!table) {
      return { tableNumber: null, error: "Meja tidak ditemukan di cabang ini" }
    }
    return { tableNumber: Number(requestedTableNumber) }
  }

  const candidateTables = await db("tables")
    .where({ branch_id: branchId, is_walk_in: false })
    .where("capacity", ">=", partySize)
    .orderBy("capacity", "asc")
    .orderBy("table_number", "asc")

  if (candidateTables.length === 0) {
    return { tableNumber: null }
  }

  const existingReservations = await db("reservations")
    .where({ branch_id: branchId, status: "confirmed" })
    .whereNotNull("table_number")
    .whereRaw("DATE(date) = DATE(?)", [String(date)])

  for (const table of candidateTables) {
    const tableReservations = existingReservations.filter(
      (r) => r.table_number === table.table_number
    )

    const hasConflict = tableReservations.some((r) => {
      const rEnd = r.time_end || calculateDefaultEndTime(r.time)
      return isTimeOverlapping(time, timeEnd, r.time, rEnd)
    })

    if (!hasConflict) {
      return { tableNumber: table.table_number }
    }
  }

  return { tableNumber: null }
}

router.post("/", async (req, res) => {
  const { name, phone, branch_id, date, time, party_size, table_number, time_end } = req.body

  if (!name || !phone || !branch_id || !date || !time || !party_size) {
    res.status(400).json({ error: "Semua field harus diisi" })
    return
  }

  const branch = await db("branches").where("id", branch_id).first()
  if (!branch) {
    res.status(400).json({ error: "Cabang tidak ditemukan" })
    return
  }

  const resolvedTimeEnd = time_end || calculateDefaultEndTime(time)
  const { tableNumber, error: tableError } = await assignTableForReservation(
    branch_id,
    date,
    time,
    resolvedTimeEnd,
    party_size,
    table_number
  )

  if (tableError) {
    res.status(400).json({ error: tableError })
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
      time_end: resolvedTimeEnd,
      table_number: tableNumber,
      party_size,
    })
    .returning("id")

  const reservation = await db("reservations").where("id", reservationId).first()

  res.status(201).json({ reservation, customer })
})

export default router

