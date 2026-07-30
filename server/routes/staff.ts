import { Router, Request, Response, NextFunction } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { db } from "../db"

const router = Router()

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
 * Returns JWT secret from environment or throws error in production if missing.
 */
export function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET
  }
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
    return "sembilu-dev-secret"
  }
  throw new Error("JWT_SECRET environment variable is missing.")
}

export const VALID_STAFF_ROLES = ["waiter", "chef", "manager"] as const
export type StaffRole = (typeof VALID_STAFF_ROLES)[number]

/**
 * Type guard to validate JWT payload structure at runtime
 */
export function isValidStaffPayload(decoded: unknown): decoded is StaffPayload {
  if (typeof decoded !== "object" || decoded === null) {
    return false
  }
  const payload = decoded as Record<string, unknown>
  return (
    typeof payload.staff_id === "number" &&
    typeof payload.role === "string" &&
    VALID_STAFF_ROLES.includes(payload.role as StaffRole) &&
    typeof payload.branch_id === "number"
  )
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
    const secret = getJwtSecret()
    const decoded = jwt.verify(token, secret)

    if (!isValidStaffPayload(decoded)) {
      res.status(401).json({ error: "Invalid token payload structure." })
      return
    }

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

    const secret = getJwtSecret()
    const token = jwt.sign(payload, secret, { expiresIn: "8h" })

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
