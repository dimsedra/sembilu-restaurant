// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { KDSPage } from "./KDSPage"
import * as staffAuth from "../utils/staffAuth"
import * as soundModule from "../utils/sound"

// Mock Web Audio / sound helper
vi.mock("../utils/sound", () => ({
  playKitchenBell: vi.fn(),
}))

// Mock sample orders
const mockOrders = [
  {
    id: 101,
    branch_id: 1,
    table_number: 3,
    customer_name: "Budi Santoso",
    status: "pending",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    items: [
      {
        id: 1,
        order_id: 101,
        dish_name: "Bebek Goreng",
        quantity: 2,
        sambal_name: "Sambal Terasi",
        sambal_heat_level: 3,
        status: "pending",
      },
      {
        id: 2,
        order_id: 101,
        dish_name: "Es Gembira",
        quantity: 2,
        status: "pending",
      },
    ],
  },
  {
    id: 102,
    branch_id: 1,
    table_number: 5,
    customer_name: "Sari",
    status: "cooking",
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    items: [
      {
        id: 3,
        order_id: 102,
        dish_name: "Ayam Bakar",
        quantity: 1,
        sambal_name: "Sambal Bajak",
        sambal_heat_level: 2,
        status: "cooking",
      },
    ],
  },
  {
    id: 103,
    branch_id: 1,
    table_number: 8,
    customer_name: "Dewi",
    status: "done",
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    items: [
      {
        id: 4,
        order_id: 103,
        dish_name: "Ikan Bakar Pantura",
        quantity: 1,
        status: "done",
      },
    ],
  },
]

describe("KDSPage Component", () => {
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

    // Mock global WebSocket
    class MockWebSocket {
      url: string
      readyState: number = 1 // OPEN
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
        this.readyState = 3 // CLOSED
        if (this.onclose) this.onclose()
      }
    }

    vi.stubGlobal("WebSocket", MockWebSocket)

    // Set default authenticated staff
    staffAuth.setStaffAuth("test-token-xyz", {
      id: 1,
      name: "Chef Budi",
      role: "chef",
      branch_id: 1,
    })

    // Mock global fetch
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
              token: "new-token",
              staff: { id: 1, name: "Chef Budi", role: "chef", branch_id: 1 },
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

  it("renders header bar with brand logo, live status, and staff badge", async () => {
    render(<KDSPage />)

    expect(screen.getByText("SEMBILU")).toBeDefined()
    expect(screen.getByText("DAPUR OPERASIONAL")).toBeDefined()
    expect(screen.getByText("Chef Budi")).toBeDefined()

    await waitFor(() => {
      expect(screen.getByText("MEJA 03")).toBeDefined()
      expect(screen.getByText("MEJA 05")).toBeDefined()
      expect(screen.getByText("MEJA 08")).toBeDefined()
    })
  })

  it("displays WebSocket live status indicator once connected", async () => {
    render(<KDSPage />)

    await waitFor(() => {
      const badge = screen.getByTestId("ws-status-badge")
      expect(badge.textContent).toContain("Live Dapur")
    })
  })

  it("renders All-Day Batch aggregate bar and allows 1-tap dish filtering", async () => {
    render(<KDSPage />)

    await waitFor(() => {
      expect(screen.getByText("Rekap Batch Dapur (All-Day)")).toBeDefined()
      expect(screen.getAllByText("Bebek Goreng").length).toBeGreaterThan(0)
    })

    // Click on Bebek Goreng chip in aggregate bar
    const bebekChip = screen.getAllByText("Bebek Goreng")[0].closest("button")
    expect(bebekChip).toBeDefined()
    fireEvent.click(bebekChip!)

    // Only ticket 101 (containing Bebek Goreng) should remain visible
    await waitFor(() => {
      expect(screen.getByText("MEJA 03")).toBeDefined()
      expect(screen.queryByText("MEJA 05")).toBeNull()
      expect(screen.queryByText("MEJA 08")).toBeNull()
    })
  })

  it("filters tickets when switching filter tabs (Menunggu, Sedang Dimasak, Siap Saji)", async () => {
    render(<KDSPage />)

    await waitFor(() => {
      expect(screen.getByText("MEJA 03")).toBeDefined()
      expect(screen.getByText("MEJA 05")).toBeDefined()
      expect(screen.getByText("MEJA 08")).toBeDefined()
    })

    // Click "Menunggu" tab
    const waitingTab = screen.getByText("Menunggu").closest("button")!
    fireEvent.click(waitingTab)

    await waitFor(() => {
      expect(screen.getByText("MEJA 03")).toBeDefined()
      expect(screen.queryByText("MEJA 08")).toBeNull()
    })

    // Click "Sedang Dimasak" tab
    const cookingTab = screen.getByText("Sedang Dimasak").closest("button")!
    fireEvent.click(cookingTab)

    await waitFor(() => {
      expect(screen.getByText("MEJA 05")).toBeDefined()
      expect(screen.queryByText("MEJA 03")).toBeNull()
      expect(screen.queryByText("MEJA 08")).toBeNull()
    })

    // Click "Siap Saji" tab
    const doneTab = screen.getByText("Siap Saji").closest("button")!
    fireEvent.click(doneTab)

    await waitFor(() => {
      expect(screen.getByText("MEJA 08")).toBeDefined()
      expect(screen.queryByText("MEJA 03")).toBeNull()
      expect(screen.queryByText("MEJA 05")).toBeNull()
    })
  })

  it("shows empty state when no tickets match active filters", async () => {
    ordersToReturn = []

    render(<KDSPage />)

    await waitFor(() => {
      expect(screen.getByTestId("kds-empty-state")).toBeDefined()
      expect(
        screen.getByText("Dapur Bersih · Tidak Ada Antrean Pesanan")
      ).toBeDefined()
    })
  })

  it("handles item status transition via PATCH API", async () => {
    render(<KDSPage />)

    await waitFor(() => {
      expect(screen.getAllByText("Bebek Goreng").length).toBeGreaterThan(0)
    })

    // Find and click "Masak" button for item 1 in order 101
    const masakBtn = screen.getByLabelText("Masak Bebek Goreng")
    fireEvent.click(masakBtn)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/staff/orders/101/items/1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "cooking" }),
        })
      )
    })
  })

  it("handles batch action Mulai Semua on ticket", async () => {
    render(<KDSPage />)

    await waitFor(() => {
      expect(screen.getByText("MEJA 03")).toBeDefined()
    })

    const card = screen.getByTestId("kds-ticket-card-101")
    const startAllBtn = card.querySelector('button[aria-label="Mulai Semua"]')
    expect(startAllBtn).toBeDefined()
    fireEvent.click(startAllBtn!)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/staff/orders/101/items/1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "cooking" }),
        })
      )
    })
  })

  it("handles Sajikan ke Meja button to mark order served", async () => {
    render(<KDSPage />)

    await waitFor(() => {
      expect(screen.getByText("MEJA 08")).toBeDefined()
    })

    const serveBtn = screen.getByText("Sajikan ke Meja")
    fireEvent.click(serveBtn)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/staff/orders/103",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "served" }),
        })
      )
    })
  })

  it("plays kitchen bell chime and refetches orders on WebSocket order_created event", async () => {
    render(<KDSPage />)

    const ws = mockWebSocketInstances[0]

    // Simulate WebSocket receiving order_created
    await act(async () => {
      ws.onmessage({
        data: JSON.stringify({
          event: "order_created",
          orderId: 105,
        }),
      })
    })

    await waitFor(() => {
      expect(soundModule.playKitchenBell).toHaveBeenCalledWith(false)
    })
  })

  it("toggles audio alert mute state", async () => {
    render(<KDSPage />)

    const muteToggle = screen.getByText("Suara Aktif").closest("button")!
    fireEvent.click(muteToggle)

    await waitFor(() => {
      expect(screen.getByText("Suara Mati")).toBeDefined()
    })
  })

  it("logs out staff user, clears storage, and opens auth modal", async () => {
    render(<KDSPage />)

    await waitFor(() => {
      expect(screen.getByLabelText("Keluar Staf")).toBeDefined()
    })

    const logoutBtn = screen.getByLabelText("Keluar Staf")
    fireEvent.click(logoutBtn)

    await waitFor(() => {
      expect(staffAuth.getStaffToken()).toBeNull()
      expect(screen.getByText("Autentikasi Kitchen Display")).toBeDefined()
    })
  })

  it("prompts Auth Modal if staff user is unauthenticated", async () => {
    staffAuth.clearStaffAuth()
    render(<KDSPage />)

    expect(screen.getByText("Autentikasi Kitchen Display")).toBeDefined()
  })
})
