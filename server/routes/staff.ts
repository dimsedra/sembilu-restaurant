import { Router, Request, Response, NextFunction } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { db } from "../db"

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || "sembilu-dev-secret"

export interface StaffPayload {
  staff_id: number
  role: string
  branch_id: number
}

// Custom request interface with attached staff info
export interface AuthenticatedRequest extends Request {
  staff?: StaffPayload
}

/**
 * Middleware: Verifies Bearer JWT token in Authorization header
 */
export function requireStaffAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Missing Bearer token." })
    return
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as StaffPayload
    req.staff = decoded
    next()
  } catch (_err) {
    res.status(401).json({ error: "Invalid or expired token." })
  }
}

/**
 * POST /api/staff/login
 * Authenticate staff member and return JWT token
 */
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." })
    return
  }

  try {
    const staff = await db("staff").where({ email }).first()

    if (!staff) {
      res.status(401).json({ error: "Invalid email or password." })
      return
    }

    const isMatch = await bcrypt.compare(password, staff.password_hash)

    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password." })
      return
    }

    const payload: StaffPayload = {
      staff_id: staff.id,
      role: staff.role,
      branch_id: staff.branch_id,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" })

    // Omit password_hash from response
    const { password_hash: _hash, ...staffData } = staff

    res.json({
      token,
      staff: staffData,
    })
  } catch (error) {
    console.error("Staff login error:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

/**
 * GET /api/staff/me
 * Protected endpoint returning current staff member info from token
 */
router.get("/me", requireStaffAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ staff: req.staff })
})

export default router

