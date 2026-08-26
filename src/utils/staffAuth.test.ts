import { describe, it, expect, beforeEach } from "vitest"
import { getStaffToken, setStaffAuth, clearStaffAuth, getStaffUser, getAuthHeaders, StaffUser } from "./staffAuth"

describe("staffAuth utility", () => {
  // Ensure a working localStorage mock in node test environment
  const storageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString()
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
    }
  })()

  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: storageMock,
      writable: true,
      configurable: true,
    })
    localStorage.clear()
  })

  it("stores and retrieves staff token and profile", () => {
    expect(getStaffToken()).toBeNull()
    expect(getStaffUser()).toBeNull()

    const mockStaff: StaffUser = {
      id: 2,
      name: "Budi (Chef)",
      email: "budi@sembilu.com",
      role: "chef",
      branch_id: 1,
    }

    setStaffAuth("mock-jwt-token", mockStaff)

    expect(getStaffToken()).toBe("mock-jwt-token")
    expect(getStaffUser()).toEqual(mockStaff)
  })

  it("clears staff auth correctly", () => {
    setStaffAuth("token", { id: 1, name: "Wati", role: "waiter", branch_id: 1 })
    expect(getStaffToken()).toBe("token")

    clearStaffAuth()
    expect(getStaffToken()).toBeNull()
    expect(getStaffUser()).toBeNull()
  })

  it("handles corrupted JSON gracefully", () => {
    localStorage.setItem("sembilu_staff_user", "invalid-json{{")
    expect(getStaffUser()).toBeNull()
  })

  it("provides correct auth headers", () => {
    expect(getAuthHeaders()).toEqual({
      "Content-Type": "application/json",
    })

    setStaffAuth("test-token-123", { id: 1, name: "Wati", role: "waiter", branch_id: 1 })
    expect(getAuthHeaders()).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer test-token-123",
    })
  })
})
