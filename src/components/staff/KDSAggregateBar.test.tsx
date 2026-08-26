// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { KDSAggregateBar, aggregateActiveDishes, KDSOrder } from "./KDSAggregateBar"

describe("KDSAggregateBar", () => {
  const mockOrders: KDSOrder[] = [
    {
      id: 1,
      table_number: "02",
      status: "pending",
      items: [
        {
          id: 1,
          order_id: 1,
          dish_name: "Bebek Goreng Sembilu",
          quantity: 2,
          status: "pending",
          sambal_name: "Sambal Matah",
          sambal_heat_level: 3,
        },
        {
          id: 2,
          order_id: 1,
          dish_name: "Ayam Bakar Klaten",
          quantity: 1,
          status: "cooking",
          sambal_name: "Sambal Bawang",
        },
      ],
    },
    {
      id: 2,
      table_number: "04",
      status: "cooking",
      items: [
        {
          id: 3,
          order_id: 2,
          dish_name: "Bebek Goreng Sembilu",
          quantity: 3,
          status: "pending",
          sambal_name: "Sambal Matah",
          sambal_extra: true,
        },
        {
          id: 4,
          order_id: 2,
          dish_name: "Bebek Goreng Sembilu",
          quantity: 1,
          status: "done", // Already done, should not be in active batch count
        },
      ],
    },
  ]

  it("aggregates active items correctly (5x Bebek, 1x Ayam) and excludes done items", () => {
    render(
      <KDSAggregateBar
        orders={mockOrders}
        onFilterDish={vi.fn()}
        selectedDish={null}
      />
    )

    // Check quantities and dish names
    expect(screen.getByText(/5x/i)).toBeDefined()
    expect(screen.getByRole("button", { name: /Bebek Goreng Sembilu/i })).toBeDefined()
    expect(screen.getByText(/1x/i)).toBeDefined()
    expect(screen.getByRole("button", { name: /Ayam Bakar Klaten/i })).toBeDefined()
  })

  it("calls onFilterDish when a dish chip is clicked", () => {
    const handleFilter = vi.fn()
    render(
      <KDSAggregateBar
        orders={mockOrders}
        onFilterDish={handleFilter}
        selectedDish={null}
      />
    )

    const chip = screen.getByRole("button", { name: /Bebek Goreng Sembilu/i })
    fireEvent.click(chip)
    expect(handleFilter).toHaveBeenCalledWith("Bebek Goreng Sembilu")
  })

  it("toggles filter off (calls onFilterDish with null) when clicking the already selected dish chip", () => {
    const handleFilter = vi.fn()
    render(
      <KDSAggregateBar
        orders={mockOrders}
        onFilterDish={handleFilter}
        selectedDish="Bebek Goreng Sembilu"
      />
    )

    const chip = screen.getByRole("button", { name: /Bebek Goreng Sembilu/i })
    fireEvent.click(chip)
    expect(handleFilter).toHaveBeenCalledWith(null)
  })

  it("resets filter when clicking the clear filter button in the active filter badge", () => {
    const handleFilter = vi.fn()
    render(
      <KDSAggregateBar
        orders={mockOrders}
        onFilterDish={handleFilter}
        selectedDish="Bebek Goreng Sembilu"
      />
    )

    const clearBtn = screen.getByRole("button", { name: /hapus filter/i })
    fireEvent.click(clearBtn)
    expect(handleFilter).toHaveBeenCalledWith(null)
  })

  it("toggles detailed sambal variants and table breakdown drawer", () => {
    render(
      <KDSAggregateBar
        orders={mockOrders}
        onFilterDish={vi.fn()}
        selectedDish={null}
      />
    )

    const toggleBtn = screen.getByRole("button", { name: /rincian sambal/i })
    fireEvent.click(toggleBtn)

    expect(screen.getByText(/Rincian Varian Sambal & Meja Antrean/i)).toBeDefined()
    expect(screen.getAllByText(/Sambal Matah/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Meja 02/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Meja 04/i).length).toBeGreaterThan(0)
  })

  it("renders empty state message when there are no active orders or items", () => {
    render(
      <KDSAggregateBar
        orders={[]}
        onFilterDish={vi.fn()}
        selectedDish={null}
      />
    )

    expect(
      screen.getByText(/Tidak ada antrean masakan saat ini/i)
    ).toBeDefined()
  })

  it("ignores orders with status served, paid, or cancelled", () => {
    const closedOrders: KDSOrder[] = [
      {
        id: 99,
        table_number: "09",
        status: "served",
        items: [
          {
            id: 991,
            dish_name: "Cumi Hitam Pedas",
            quantity: 4,
            status: "cooking",
          },
        ],
      },
      {
        id: 100,
        table_number: "10",
        status: "paid",
        items: [
          {
            id: 1001,
            dish_name: "Cumi Hitam Pedas",
            quantity: 2,
            status: "pending",
          },
        ],
      },
    ]

    const aggregated = aggregateActiveDishes(closedOrders)
    expect(aggregated).toEqual([])
  })
})
