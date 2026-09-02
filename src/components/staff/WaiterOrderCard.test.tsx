// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { WaiterOrderCard } from "./WaiterOrderCard"
import { KDSOrder } from "./KDSAggregateBar"

const mockOrderReady: KDSOrder = {
  id: 101,
  branch_id: 1,
  table_number: 5,
  status: "done",
  customer_name: "Mas Budi",
  created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  items: [
    {
      id: 1,
      dish_id: 10,
      dish_name: "Ikan Bakar Pantura",
      quantity: 2,
      sambal_name: "Sambal Terasi",
      status: "done",
      notes: "Jangan terlalu gosong",
    },
  ],
}

const mockOrderCooking: KDSOrder = {
  id: 102,
  branch_id: 1,
  table_number: 8,
  status: "cooking",
  customer_name: null,
  created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  items: [
    {
      id: 2,
      dish_id: 11,
      dish_name: "Ayam Goreng Lengkuas",
      quantity: 1,
      sambal_name: "Sambal Matah",
      status: "cooking",
    },
  ],
}

const mockOrderServed: KDSOrder = {
  id: 103,
  branch_id: 1,
  table_number: 3,
  status: "served",
  customer_name: "Siti",
  created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  items: [
    {
      id: 3,
      dish_id: 12,
      dish_name: "Bebek Betutu",
      quantity: 1,
      status: "served",
    },
  ],
}

describe("WaiterOrderCard", () => {
  it("renders table number, customer name, and done status badge", () => {
    render(<WaiterOrderCard order={mockOrderReady} onServeOrder={vi.fn()} />)

    expect(screen.getByText(/Meja 5/i)).toBeDefined()
    expect(screen.getByText(/Mas Budi/i)).toBeDefined()
    expect(screen.getByText(/Siap Diantar/i)).toBeDefined()
    expect(screen.getByText(/Ikan Bakar Pantura/i)).toBeDefined()
    expect(screen.getByText(/Sambal Terasi/i)).toBeDefined()
    expect(screen.getByText(/"Jangan terlalu gosong"/i)).toBeDefined()
  })

  it("calls onServeOrder when 'Konfirmasi Telah Diantar' button is clicked", () => {
    const handleServe = vi.fn()
    render(<WaiterOrderCard order={mockOrderReady} onServeOrder={handleServe} />)

    const serveBtn = screen.getByRole("button", { name: /Telah Diantar/i })
    fireEvent.click(serveBtn)

    expect(handleServe).toHaveBeenCalledWith(101)
  })

  it("renders cooking state correctly with walk-in fallback", () => {
    render(<WaiterOrderCard order={mockOrderCooking} onServeOrder={vi.fn()} />)

    expect(screen.getByText(/Meja 8/i)).toBeDefined()
    expect(screen.getByText(/Tamu Walk-in/i)).toBeDefined()
    expect(screen.getByText(/Sedang Dimasak/i)).toBeDefined()
  })

  it("renders served state without action button", () => {
    render(<WaiterOrderCard order={mockOrderServed} onServeOrder={vi.fn()} />)

    expect(screen.getByText("✓ Tersaji")).toBeDefined()
    expect(screen.getByText(/Pesanan telah diantar ke Meja 3/i)).toBeDefined()
    expect(screen.queryByRole("button", { name: /Telah Diantar/i })).toBeNull()
  })

  it("disables or hides serve action button when order is still cooking", () => {
    const mockOrderCookingLocal: KDSOrder = {
      id: 104,
      branch_id: 1,
      table_number: 3,
      status: "cooking",
      customer_name: "Mas Teguh",
      created_at: new Date().toISOString(),
      items: [
        {
          id: 2,
          dish_id: 10,
          dish_name: "Ikan Bakar Pantura",
          quantity: 1,
          status: "cooking",
        },
      ],
    }

    render(<WaiterOrderCard order={mockOrderCookingLocal} onServeOrder={vi.fn()} />)

    expect(screen.queryByRole("button", { name: /Telah Diantar/i })).toBeNull()
    expect(screen.getByText(/Menunggu Dapur Menyelesaikan Masakan/i)).toBeDefined()
  })
})

