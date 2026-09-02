// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import {
  KDSTicketCard,
  formatTableBadge,
  getElapsedSeconds,
  formatElapsedTimer,
} from "./KDSTicketCard"
import { KDSOrder } from "./KDSAggregateBar"

describe("KDSTicketCard Helpers", () => {
  it("formats table badges correctly", () => {
    expect(formatTableBadge(4)).toBe("MEJA 04")
    expect(formatTableBadge("12")).toBe("MEJA 12")
    expect(formatTableBadge("MEJA 05")).toBe("MEJA 05")
    expect(formatTableBadge("VIP 1")).toBe("MEJA VIP 1")
    expect(formatTableBadge(null)).toBe("MEJA --")
    expect(formatTableBadge(undefined)).toBe("MEJA --")
    expect(formatTableBadge("")).toBe("MEJA --")
  })

  it("calculates elapsed seconds and formats timer text", () => {
    const fixedNow = 1700000000000
    const fiveMinsAgo = new Date(fixedNow - 5 * 60 * 1000).toISOString()
    const elapsed = getElapsedSeconds(fiveMinsAgo, fixedNow)
    expect(elapsed).toBe(300)
    expect(formatElapsedTimer(elapsed)).toBe("05:00")

    const overAnHour = 75 * 60 + 23
    expect(formatElapsedTimer(overAnHour)).toBe("75:23")

    expect(getElapsedSeconds(undefined, fixedNow)).toBe(0)
    expect(getElapsedSeconds("invalid-date", fixedNow)).toBe(0)
  })
})

describe("KDSTicketCard Component", () => {
  const baseOrder: KDSOrder = {
    id: 101,
    branch_id: 1,
    table_number: 4,
    status: "pending",
    customer_name: "Bpk. Arya",
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 mins ago
    items: [
      {
        id: 1,
        order_id: 101,
        dish_id: 2,
        dish_name: "Bebek Goreng Sembilu",
        quantity: 2,
        sambal_name: "Sambal Matah",
        sambal_heat_level: 3,
        sambal_extra: true,
        notes: "Minta bagian paha garing",
        status: "pending",
      },
      {
        id: 2,
        order_id: 101,
        dish_id: 3,
        dish_name: "Ayam Bakar Klaten",
        quantity: 1,
        sambal_name: "Sambal Terasi",
        sambal_heat_level: 1,
        status: "cooking",
      },
    ],
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-02T12:00:00.000Z"))
    baseOrder.created_at = new Date("2026-09-02T11:57:00.000Z").toISOString()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders table badge, customer name, ticket id, and walk-in badge", () => {
    render(<KDSTicketCard order={baseOrder} />)

    expect(screen.getByText("MEJA 04")).toBeDefined()
    expect(screen.getByText("Bpk. Arya")).toBeDefined()
    expect(screen.getByText("#101")).toBeDefined()
    expect(screen.getByText("Walk-in")).toBeDefined()
  })

  it("renders reservation badge when order is marked as reservation", () => {
    const reservationOrder = {
      ...baseOrder,
      type: "reservation",
    }
    render(<KDSTicketCard order={reservationOrder as any} />)

    expect(screen.getByText("Reservasi")).toBeDefined()
  })

  it("renders line items with quantities, dish names, sambal details, and notes", () => {
    render(<KDSTicketCard order={baseOrder} />)

    expect(screen.getByText("2x")).toBeDefined()
    expect(screen.getByText("Bebek Goreng Sembilu")).toBeDefined()
    expect(screen.getByText("Sambal Matah")).toBeDefined()
    expect(screen.getByText("Lvl 3")).toBeDefined()
    expect(screen.getByText("+Extra")).toBeDefined()
    expect(screen.getByText("Minta bagian paha garing")).toBeDefined()

    expect(screen.getByText("1x")).toBeDefined()
    expect(screen.getByText("Ayam Bakar Klaten")).toBeDefined()
    expect(screen.getByText("Sambal Terasi")).toBeDefined()
    expect(screen.getByText("Lvl 1")).toBeDefined()
  })

  it("triggers onUpdateItemStatus when line item action buttons are clicked", () => {
    const handleUpdate = vi.fn()
    render(<KDSTicketCard order={baseOrder} onUpdateItemStatus={handleUpdate} />)

    // Pending item has "Masak" button
    const cookBtn = screen.getByRole("button", { name: /masak bebek goreng sembilu/i })
    fireEvent.click(cookBtn)
    expect(handleUpdate).toHaveBeenCalledWith(101, 1, "cooking")

    // Cooking item has "Selesai" button
    const doneBtn = screen.getByRole("button", { name: /selesaikan ayam bakar klaten/i })
    fireEvent.click(doneBtn)
    expect(handleUpdate).toHaveBeenCalledWith(101, 2, "done")
  })

  it("shows disabled Siap Saji button for done items", () => {
    const orderWithDoneItem: KDSOrder = {
      ...baseOrder,
      items: [
        {
          id: 1,
          order_id: 101,
          dish_name: "Bebek Goreng Sembilu",
          quantity: 1,
          status: "done",
        },
      ],
    }

    render(<KDSTicketCard order={orderWithDoneItem} />)
    const readyBtn = screen.getByRole("button", { name: /bebek goreng sembilu siap saji/i })
    expect((readyBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it("handles batch action: Mulai Semua", () => {
    const handleBatch = vi.fn()
    render(<KDSTicketCard order={baseOrder} onBatchUpdate={handleBatch} />)

    const startAllBtn = screen.getByRole("button", { name: /mulai semua/i })
    fireEvent.click(startAllBtn)
    expect(handleBatch).toHaveBeenCalledWith(101, "cooking")
  })

  it("handles batch action fallback to onUpdateItemStatus if onBatchUpdate is not provided", () => {
    const handleUpdate = vi.fn()
    render(<KDSTicketCard order={baseOrder} onUpdateItemStatus={handleUpdate} />)

    const startAllBtn = screen.getByRole("button", { name: /mulai semua/i })
    fireEvent.click(startAllBtn)
    // Only pending items (item 1) should be triggered
    expect(handleUpdate).toHaveBeenCalledWith(101, 1, "cooking")
    expect(handleUpdate).toHaveBeenCalledTimes(1)
  })

  it("handles batch action: Selesaikan Semua", () => {
    const handleBatch = vi.fn()
    render(<KDSTicketCard order={baseOrder} onBatchUpdate={handleBatch} />)

    const completeAllBtn = screen.getByRole("button", { name: /selesaikan semua/i })
    fireEvent.click(completeAllBtn)
    expect(handleBatch).toHaveBeenCalledWith(101, "done")
  })

  it("renders ready banner and Sajikan ke Meja when all items are done", () => {
    const allDoneOrder: KDSOrder = {
      ...baseOrder,
      items: [
        {
          id: 1,
          order_id: 101,
          dish_name: "Bebek Goreng Sembilu",
          quantity: 2,
          status: "done",
        },
        {
          id: 2,
          order_id: 101,
          dish_name: "Ayam Bakar Klaten",
          quantity: 1,
          status: "done",
        },
      ],
    }

    const handleMarkServed = vi.fn()
    render(<KDSTicketCard order={allDoneOrder} onMarkServed={handleMarkServed} />)

    expect(screen.getByText("Semua Menu Selesai Dimasak")).toBeDefined()

    const serveBtn = screen.getByRole("button", { name: /sajikan ke meja/i })
    fireEvent.click(serveBtn)
    expect(handleMarkServed).toHaveBeenCalledWith(101)
  })

  it("applies urgent styling when order created_at is > 20 minutes ago", () => {
    const urgentOrder: KDSOrder = {
      ...baseOrder,
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
    }

    render(<KDSTicketCard order={urgentOrder} />)
    const card = screen.getByTestId("kds-ticket-card-101")
    expect(card.className).toContain("border-[#b84a30]")

    const timer = screen.getByTestId("ticket-timer")
    expect(timer.className).toContain("animate-pulse")
  })

  it("applies warning styling when order created_at is between 10 and 20 minutes ago", () => {
    const warningOrder: KDSOrder = {
      ...baseOrder,
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
    }

    render(<KDSTicketCard order={warningOrder} />)
    const card = screen.getByTestId("kds-ticket-card-101")
    expect(card.className).toContain("border-amber-500/50")
  })

  it("highlights card and matching dish when highlightDish prop is active", () => {
    render(
      <KDSTicketCard
        order={baseOrder}
        highlightDish="Bebek Goreng Sembilu"
      />
    )

    const card = screen.getByTestId("kds-ticket-card-101")
    expect(card.className).toContain("ring-2 ring-[#c9a24b]")

    const item1 = screen.getByTestId("ticket-item-1")
    expect(item1.className).toContain("ring-1 ring-[#c9a24b]")

    const item2 = screen.getByTestId("ticket-item-2")
    expect(item2.className).not.toContain("ring-1 ring-[#c9a24b]")
  })

  it("ticks the live elapsed timer over time", () => {
    render(<KDSTicketCard order={baseOrder} />)

    const timer = screen.getByTestId("ticket-timer")
    expect(timer.textContent).toBe("03:00")

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(timer.textContent).toBe("03:02")
  })
})
