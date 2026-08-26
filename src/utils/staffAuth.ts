export interface StaffUser {
  id: number
  name: string
  email?: string
  role: "waiter" | "chef" | "manager" | string
  branch_id: number
}

export const STAFF_TOKEN_KEY = "sembilu_staff_token"
export const STAFF_USER_KEY = "sembilu_staff_user"

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage
  }
  if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage
  }
  return null
}

/**
 * Retrieves the stored staff JWT token from localStorage.
 */
export function getStaffToken(): string | null {
  const storage = getStorage()
  return storage ? storage.getItem(STAFF_TOKEN_KEY) : null
}

/**
 * Stores staff JWT token and profile into localStorage.
 */
export function setStaffAuth(token: string, staff: StaffUser): void {
  const storage = getStorage()
  if (!storage) return
  storage.setItem(STAFF_TOKEN_KEY, token)
  storage.setItem(STAFF_USER_KEY, JSON.stringify(staff))
}

/**
 * Clears staff credentials and profile from localStorage.
 */
export function clearStaffAuth(): void {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(STAFF_TOKEN_KEY)
  storage.removeItem(STAFF_USER_KEY)
}

/**
 * Retrieves the currently logged in staff user profile.
 */
export function getStaffUser(): StaffUser | null {
  const storage = getStorage()
  if (!storage) return null
  const raw = storage.getItem(STAFF_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StaffUser
  } catch {
    return null
  }
}

/**
 * Returns standard JSON headers with Bearer Authorization if token is present.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getStaffToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  return headers
}
