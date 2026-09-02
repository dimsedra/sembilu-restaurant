// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { WaiterOrdersPage } from "./WaiterOrdersPage"
import * as staffAuth from "../utils/staffAuth"
import * as soundModule from "../utils/sound"

// Mock Web Audio / sound helper
vi.mock("../utils/sound", () => ({
  playKitchenBell: vi.fn(),
}))

const mockOrders = [
  {
    id: 101,
    branch_id: 1,
    table_number: 3,
    customer_name: "Budi Santoso",
    status: "cooking",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    items: [
      {
        id: 1,
        order_id: 101,
        dish_name: "Bebek Goreng",
        quantity: 2,
        status: "cooking",
      },
    ],
  },
  {
    id: 102,
    branch_id: 1,
    table_number: 5,
    customer_name: "Sari",
    status: "done",
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    items: [
      {
        id: 2,
        order_id: 102,
        dish_name: "Ayam Bakar",
        quantity: 1,
        status: "done",
      },
    ],
  },
  {
    id: 103,
    branch_id: 1,
    table_number: 8,
    customer_name: "Dewi",
    status: "served",
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    items: [
      {
        id: 3,
        order_id: 103,
        dish_name: "Ikan Bakar Pantura",
        quantity: 1,
        status: "served",
      },
    ],
  },
]

describe("WaiterOrdersPage Component", () => {
  let mockWebSocketInstances: any[] = []
  let ordersToReturn: any[] = []

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
    vi.clearAllMocks()
    ordersToReturn = [...mockOrders]

    Object.defineProperty(globalThis, "localStorage", {
      value: storageMock,
      writable: true,
      configurable: true,
    })
    localStorage.clear()
    mockWebSocketInstances = []

    class MockWebSocket {
      url: string
      readyState: number = 1
      onopen: (() => void) | null = null
      onclose: (() => void) | null = null
      onerror: (() => void) | null = null
      onmessage: ((event: { data: string }) => void) | null = null

      constructor(url: string) {
        this.url = url
        mockWebSocketInstances.push(this)
        setTimeout(() => {
          if (this.onopen) this.onopen()
        }, 10)
      }

      send() {}
      close() {
        this.readyState = 3
        if (this.onclose) this.onclose()
      }
    }

    vi.stubGlobal("WebSocket", MockWebSocket)

    staffAuth.setStaffAuth("test-waiter-token", {
      id: 2,
      name: "Wati (Waiter)",
      role: "waiter",
      branch_id: 1,
    })

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options?: any) => {
        if (url.includes("/api/staff/orders") && (!options || options.method === "GET" || !options.method)) {
          return {
            ok: true,
            status: 200,
            json: async () => ordersToReturn,
          } as Response
        }

        if (url.includes("/api/staff/orders/") && options?.method === "PATCH") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
          } as Response
        }

        if (url.includes("/api/staff/login") && options?.method === "POST") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              token: "new-waiter-token",
              staff: { id: 2, name: "Wati", role: "waiter", branch_id: 1 },
            }),
          } as Response
        }

        return {
          ok: false,
          status: 404,
          json: async () => ({ error: "Not found" }),
        } as Response
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("renders waiter header and status filter tabs", async () => {
    render(<WaiterOrdersPage />)

    expect(screen.getByText(/OPERASIONAL WAITER/i)).toBeDefined()
    expect(screen.getByRole("tab", { name: /Siap Diantar/i })).toBeDefined()
    expect(screen.getByRole("tab", { name: /Sedang Dimasak/i })).toBeDefined()
    expect(screen.getByRole("tab", { name: /Tersaji di Meja/i })).toBeDefined()
    expect(screen.getByRole("tab", { name: /Semua/i })).toBeDefined()

    // Default tab is "ready" which displays order 102 (status: done)
    await waitFor(() => {
      expect(screen.getByText("Meja 5")).toBeDefined()
      expect(screen.queryByText("Meja 3")).toBeNull()
      expect(screen.queryByText("Meja 8")).toBeNull()
    })
  })

  it("filters orders when clicking tabs", async () => {
    render(<WaiterOrdersPage />)

    await waitFor(() => {
      expect(screen.getByText("Meja 5")).toBeDefined()
    })

    // Click "Sedang Dimasak" tab
    const cookingTab = screen.getByRole("tab", { name: /Sedang Dimasak/i })
    fireEvent.click(cookingTab)

    await waitFor(() => {
      expect(screen.getByText("Meja 3")).toBeDefined()
      expect(screen.queryByText("Meja 5")).toBeNull()
      expect(screen.queryByText("Meja 8")).toBeNull()
    })

    // Click "Tersaji di Meja" tab
    const servedTab = screen.getByRole("tab", { name: /Tersaji di Meja/i })
    fireEvent.click(servedTab)

    await waitFor(() => {
      expect(screen.getByText("Meja 8")).toBeDefined()
      expect(screen.queryByText("Meja 3")).toBeNull()
      expect(screen.queryByText("Meja 5")).toBeNull()
    })

    // Click "Semua" tab
    const allTab = screen.getByRole("tab", { name: /Semua/i })
    fireEvent.click(allTab)

    await waitFor(() => {
      expect(screen.getByText("Meja 3")).toBeDefined()
      expect(screen.getByText("Meja 5")).toBeDefined()
      expect(screen.getByText("Meja 8")).toBeDefined()
    })
  })

  it("marks order as served when clicking Konfirmasi Telah Diantar", async () => {
    render(<WaiterOrdersPage />)

    await waitFor(() => {
      expect(screen.getByText("Meja 5")).toBeDefined()
    })

    const serveBtn = screen.getByText("Konfirmasi Telah Diantar ke Meja")
    fireEvent.click(serveBtn)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/staff/orders/102",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "served" }),
        })
      )
    })
  })

  it("handles WebSocket message and plays kitchen bell on done status", async () => {
    render(<WaiterOrdersPage />)

    const ws = mockWebSocketInstances[0]

    await act(async () => {
      ws.onmessage({
        data: JSON.stringify({
          type: "order_updated",
          order: { id: 101, status: "done" },
        }),
      })
    })

    await waitFor(() => {
      expect(soundModule.playKitchenBell).toHaveBeenCalledWith(false)
    })
  })

  it("toggles audio alert mute state", async () => {
    render(<WaiterOrdersPage />)

    const muteToggle = screen.getByText("Suara Aktif").closest("button")!
    fireEvent.click(muteToggle)

    await waitFor(() => {
      expect(screen.getByText("Suara Mati")).toBeDefined()
    })
  })

  it("renders branch selector for manager role and updates orders", async () => {
    staffAuth.setStaffAuth("test-manager-token", {
      id: 3,
      name: "Teguh (Manager)",
      role: "manager",
      branch_id: 1,
    })

    render(<WaiterOrdersPage />)

    const branchSelect = screen.getByRole("combobox")
    expect(branchSelect).toBeDefined()

    fireEvent.change(branchSelect, { target: { value: "2" } })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/staff/orders?branch_id=2",
        expect.any(Object)
      )
    })
  })

  it("logs out staff and opens auth modal", async () => {
    render(<WaiterOrdersPage />)

    const logoutBtn = screen.getByTitle("Logout")
    fireEvent.click(logoutBtn)

    await waitFor(() => {
      expect(staffAuth.getStaffToken()).toBeNull()
      expect(screen.getByText("Autentikasi Kitchen Display")).toBeDefined()
    })
  })

  it("prompts Auth Modal if staff is unauthenticated", async () => {
    staffAuth.clearStaffAuth()
    render(<WaiterOrdersPage />)

    expect(screen.getByText("Autentikasi Kitchen Display")).toBeDefined()
  })
})
