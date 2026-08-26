import { useMemo, useState } from "react"
import { cn } from "../../utils/cn"
import {
  LayersIcon,
  FlameIcon,
  ClockIcon,
  ChiliIcon,
  XIcon,
  ChevronDownIcon,
  ChefHatIcon,
} from "./icons"

export interface KDSOrderItem {
  id: number
  order_id?: number
  dish_id?: number
  dish_name: string
  dish_price?: number
  quantity: number
  sambal_id?: number | null
  sambal_name?: string | null
  sambal_heat_level?: number | null
  sambal_extra?: boolean
  notes?: string | null
  status?: "pending" | "cooking" | "done" | string
}

export interface KDSOrder {
  id: number
  branch_id?: number
  customer_id?: number | null
  customer_name?: string | null
  table_number?: number | string
  status: string
  created_at?: string
  updated_at?: string
  items?: KDSOrderItem[]
}

export interface AggregatedSambalVariant {
  sambalName: string
  count: number
  heatLevel?: number | null
  extraCount: number
}

export interface AggregatedDish {
  dishName: string
  totalQuantity: number
  pendingQuantity: number
  cookingQuantity: number
  sambalVariants: AggregatedSambalVariant[]
  tables: Array<{ tableNumber: string | number; quantity: number }>
  orderIds: number[]
}

export interface KDSAggregateBarProps {
  orders: KDSOrder[]
  selectedDish?: string | null
  onFilterDish?: (dishName: string | null) => void
  className?: string
}

/**
 * Aggregates all active (pending/cooking) items across active orders
 */
export function aggregateActiveDishes(orders: KDSOrder[]): AggregatedDish[] {
  const dishMap = new Map<
    string,
    {
      dishName: string
      totalQuantity: number
      pendingQuantity: number
      cookingQuantity: number
      sambalMap: Map<string, { count: number; heatLevel?: number | null; extraCount: number }>
      tableMap: Map<string | number, number>
      orderIds: Set<number>
    }
  >()

  for (const order of orders) {
    if (!order) continue
    // Skip finished orders
    if (order.status === "served" || order.status === "paid" || order.status === "cancelled") {
      continue
    }

    const items = order.items || []
    for (const item of items) {
      if (!item) continue
      // Item is active if pending or cooking
      const itemStatus = item.status || order.status
      if (itemStatus !== "pending" && itemStatus !== "cooking") {
        continue
      }

      const dishName = item.dish_name
      if (!dishName) continue

      const qty = item.quantity || 1

      if (!dishMap.has(dishName)) {
        dishMap.set(dishName, {
          dishName,
          totalQuantity: 0,
          pendingQuantity: 0,
          cookingQuantity: 0,
          sambalMap: new Map(),
          tableMap: new Map(),
          orderIds: new Set(),
        })
      }

      const record = dishMap.get(dishName)!
      record.totalQuantity += qty
      if (itemStatus === "cooking") {
        record.cookingQuantity += qty
      } else {
        record.pendingQuantity += qty
      }

      if (order.id) {
        record.orderIds.add(order.id)
      }

      const tableNum = order.table_number ?? "TBD"
      record.tableMap.set(tableNum, (record.tableMap.get(tableNum) || 0) + qty)

      const sambalKey = item.sambal_name && item.sambal_name.trim().length > 0 ? item.sambal_name.trim() : "Tanpa Sambal"
      const existingSambal = record.sambalMap.get(sambalKey) || {
        count: 0,
        heatLevel: item.sambal_heat_level,
        extraCount: 0,
      }
      existingSambal.count += qty
      if (item.sambal_extra) {
        existingSambal.extraCount += qty
      }
      if (item.sambal_heat_level !== undefined && item.sambal_heat_level !== null) {
        existingSambal.heatLevel = item.sambal_heat_level
      }
      record.sambalMap.set(sambalKey, existingSambal)
    }
  }

  return Array.from(dishMap.values())
    .map((record) => ({
      dishName: record.dishName,
      totalQuantity: record.totalQuantity,
      pendingQuantity: record.pendingQuantity,
      cookingQuantity: record.cookingQuantity,
      sambalVariants: Array.from(record.sambalMap.entries()).map(([sambalName, data]) => ({
        sambalName,
        count: data.count,
        heatLevel: data.heatLevel,
        extraCount: data.extraCount,
      })),
      tables: Array.from(record.tableMap.entries())
        .map(([tableNumber, quantity]) => ({
          tableNumber,
          quantity,
        }))
        .sort((a, b) => String(a.tableNumber).localeCompare(String(b.tableNumber), undefined, { numeric: true })),
      orderIds: Array.from(record.orderIds),
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
}

export function KDSAggregateBar({
  orders,
  selectedDish,
  onFilterDish,
  className,
}: KDSAggregateBarProps) {
  const [showDetails, setShowDetails] = useState(false)

  const aggregatedDishes = useMemo(() => aggregateActiveDishes(orders), [orders])

  const totalActivePortions = useMemo(
    () => aggregatedDishes.reduce((acc, curr) => acc + curr.totalQuantity, 0),
    [aggregatedDishes]
  )

  const totalCookingPortions = useMemo(
    () => aggregatedDishes.reduce((acc, curr) => acc + curr.cookingQuantity, 0),
    [aggregatedDishes]
  )

  const totalPendingPortions = useMemo(
    () => aggregatedDishes.reduce((acc, curr) => acc + curr.pendingQuantity, 0),
    [aggregatedDishes]
  )

  const handleChipClick = (dishName: string) => {
    if (!onFilterDish) return
    if (selectedDish === dishName) {
      onFilterDish(null)
    } else {
      onFilterDish(dishName)
    }
  }

  // If a dish is filtered, we can highlight its specific breakdown in details
  const displayedDetails = useMemo(() => {
    if (selectedDish) {
      return aggregatedDishes.filter((d) => d.dishName === selectedDish)
    }
    return aggregatedDishes
  }, [aggregatedDishes, selectedDish])

  return (
    <div
      data-testid="kds-aggregate-bar"
      className={cn(
        "rounded-2xl bg-[#1b1610] border border-[#392c1e] shadow-xl p-4 sm:p-5 text-[#f4ead3] transition-all",
        className
      )}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#392c1e]/80">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#241c13] border border-[#c9a24b]/40 text-[#c9a24b]">
            <LayersIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs uppercase font-mono tracking-wider text-[#c9a24b] font-bold">
                Rekap Batch Dapur (All-Day)
              </h2>
              {totalActivePortions > 0 && (
                <span className="text-[11px] font-mono bg-[#241c13] text-[#cbbf9c] border border-[#392c1e] px-2 py-0.5 rounded-full font-semibold">
                  {totalActivePortions} Porsi ({aggregatedDishes.length} Menu)
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#a48f6e] hidden sm:block mt-0.5">
              Akumulasi hidangan aktif untuk efisiensi masak serentak
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Filter Indicator */}
          {selectedDish && (
            <div className="flex items-center gap-1.5 bg-[#c9a24b]/15 border border-[#c9a24b]/60 text-[#f4ead3] px-2.5 py-1 rounded-lg text-xs font-medium">
              <span className="text-[#cbbf9c]">Filter:</span>
              <span className="font-semibold text-[#f4ead3] max-w-[140px] truncate">{selectedDish}</span>
              <button
                type="button"
                onClick={() => onFilterDish?.(null)}
                title="Hapus Filter"
                aria-label="Hapus Filter"
                className="ml-1 p-0.5 hover:bg-[#c9a24b]/20 rounded text-[#cbbf9c] hover:text-[#b84a30] transition-colors cursor-pointer"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick status summary counts */}
          {totalActivePortions > 0 && (
            <div className="hidden md:flex items-center gap-2 text-xs font-mono">
              {totalCookingPortions > 0 && (
                <span className="inline-flex items-center gap-1 text-[#e7c57a] bg-[#e7c57a]/10 border border-[#e7c57a]/20 px-2 py-1 rounded-md">
                  <FlameIcon className="w-3.5 h-3.5 text-[#b84a30]" />
                  <span>{totalCookingPortions} Dimasak</span>
                </span>
              )}
              {totalPendingPortions > 0 && (
                <span className="inline-flex items-center gap-1 text-[#cbbf9c] bg-[#241c13] border border-[#392c1e] px-2 py-1 rounded-md">
                  <ClockIcon className="w-3.5 h-3.5 text-[#c9a24b]" />
                  <span>{totalPendingPortions} Antrean</span>
                </span>
              )}
            </div>
          )}

          {/* Expand / Details Toggle Button */}
          {aggregatedDishes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              aria-expanded={showDetails}
              className="text-xs font-medium text-[#cbbf9c] hover:text-[#c9a24b] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#241c13] border border-[#392c1e] hover:border-[#c9a24b]/40 transition-colors cursor-pointer"
            >
              <span>{showDetails ? "Sembunyikan Rincian" : "Rincian Sambal"}</span>
              <ChevronDownIcon
                className={cn("w-3.5 h-3.5 transition-transform duration-200", showDetails && "rotate-180")}
              />
            </button>
          )}
        </div>
      </div>

      {/* Main Aggregator Dish Chips */}
      {aggregatedDishes.length === 0 ? (
        <div className="flex items-center justify-center gap-2.5 py-6 text-sm text-[#a48f6e]">
          <ChefHatIcon className="w-5 h-5 text-[#c9a24b]/60 shrink-0" />
          <span>Tidak ada antrean masakan saat ini. Dapur siap menerima pesanan.</span>
        </div>
      ) : (
        <div className="mt-3.5 flex flex-wrap gap-2.5">
          {aggregatedDishes.map((dish) => {
            const isSelected = selectedDish === dish.dishName
            return (
              <button
                key={dish.dishName}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleChipClick(dish.dishName)}
                className={cn(
                  "group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer min-h-[46px] select-none",
                  isSelected
                    ? "bg-[#c9a24b]/20 border-[#c9a24b] text-[#f4ead3] ring-2 ring-[#c9a24b]/50 shadow-md shadow-[#c9a24b]/10"
                    : "bg-[#241c13] border-[#392c1e] hover:border-[#c9a24b]/50 hover:bg-[#2c2217] text-[#f4ead3]"
                )}
              >
                {/* Large quantity badge */}
                <span
                  className={cn(
                    "font-mono font-bold text-sm sm:text-base px-2 py-0.5 rounded-md shrink-0 transition-colors",
                    isSelected
                      ? "bg-[#c9a24b] text-[#14110d] font-extrabold"
                      : "bg-[#c9a24b]/15 text-[#e7c57a] border border-[#c9a24b]/30 group-hover:bg-[#c9a24b]/25"
                  )}
                >
                  {dish.totalQuantity}x
                </span>

                {/* Dish name */}
                <span className="font-semibold text-sm tracking-tight text-[#f4ead3]">
                  {dish.dishName}
                </span>

                {/* Status sub-pills */}
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  {dish.cookingQuantity > 0 && (
                    <span
                      title={`${dish.cookingQuantity} sedang dimasak`}
                      className="inline-flex items-center gap-0.5 text-[10px] font-mono text-[#e7c57a] bg-[#e7c57a]/15 border border-[#e7c57a]/30 px-1.5 py-0.5 rounded"
                    >
                      <FlameIcon className="w-3 h-3 text-[#b84a30]" />
                      <span>{dish.cookingQuantity}</span>
                    </span>
                  )}
                  {dish.pendingQuantity > 0 && (
                    <span
                      title={`${dish.pendingQuantity} antrean menunggu`}
                      className="inline-flex items-center gap-0.5 text-[10px] font-mono text-[#cbbf9c] bg-[#14110d] border border-[#392c1e] px-1.5 py-0.5 rounded"
                    >
                      <ClockIcon className="w-3 h-3 text-[#c9a24b]" />
                      <span>{dish.pendingQuantity}</span>
                    </span>
                  )}

                  {/* Sambal variant indicator */}
                  {dish.sambalVariants.length > 0 && (
                    <span
                      title={`Varian Sambal: ${dish.sambalVariants.map((s) => `${s.sambalName} (${s.count}x)`).join(", ")}`}
                      className="inline-flex items-center text-[#b84a30] ml-0.5"
                    >
                      <ChiliIcon className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Expandable Sambal & Table Breakdown Section */}
      {showDetails && displayedDetails.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#392c1e] animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase font-mono tracking-wider text-[#cbbf9c] font-semibold flex items-center gap-2">
              <ChiliIcon className="w-4 h-4 text-[#b84a30]" />
              <span>Rincian Varian Sambal & Meja Antrean</span>
            </h3>
            {selectedDish && (
              <span className="text-xs text-[#c9a24b] font-mono">
                Menampilkan rincian untuk &ldquo;{selectedDish}&rdquo;
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedDetails.map((dish) => (
              <div
                key={dish.dishName}
                className="p-3.5 rounded-xl bg-[#241c13] border border-[#392c1e] space-y-2.5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#392c1e]/60">
                  <span className="font-semibold text-sm text-[#f4ead3]">{dish.dishName}</span>
                  <span className="text-xs font-mono font-bold text-[#c9a24b] bg-[#c9a24b]/15 px-2 py-0.5 rounded border border-[#c9a24b]/30">
                    Total {dish.totalQuantity}x
                  </span>
                </div>

                {/* Sambal variants */}
                <div>
                  <span className="text-[11px] uppercase font-mono tracking-wider text-[#a48f6e] block mb-1">
                    Varian Sambal:
                  </span>
                  <div className="space-y-1">
                    {dish.sambalVariants.map((variant) => (
                      <div
                        key={variant.sambalName}
                        className="flex items-center justify-between text-xs text-[#cbbf9c] bg-[#14110d]/50 px-2 py-1 rounded border border-[#392c1e]/40"
                      >
                        <span className="flex items-center gap-1.5">
                          <ChiliIcon className="w-3 h-3 text-[#b84a30]" />
                          <span>{variant.sambalName}</span>
                          {variant.heatLevel && (
                            <span className="text-[10px] text-[#b84a30] font-mono">
                              (Lvl {variant.heatLevel})
                            </span>
                          )}
                          {variant.extraCount > 0 && (
                            <span className="text-[10px] text-[#e7c57a] bg-[#e7c57a]/15 px-1 rounded">
                              +{variant.extraCount} Extra
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-bold text-[#f4ead3]">
                          {variant.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table distribution */}
                {dish.tables.length > 0 && (
                  <div>
                    <span className="text-[11px] uppercase font-mono tracking-wider text-[#a48f6e] block mb-1">
                      Distribusi Meja:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {dish.tables.map((t) => (
                        <span
                          key={String(t.tableNumber)}
                          className="text-[11px] font-mono bg-[#14110d] text-[#cbbf9c] border border-[#392c1e] px-2 py-0.5 rounded"
                        >
                          Meja {t.tableNumber} ({t.quantity}x)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
