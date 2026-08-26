import { useEffect, useState, useMemo } from "react"
import { cn } from "../../utils/cn"
import {
  ClockIcon,
  FlameIcon,
  CheckCircleIcon,
  ChiliIcon,
  AlertTriangleIcon,
  UserIcon,
} from "./icons"
import { KDSOrder } from "./KDSAggregateBar"

export interface KDSTicketCardProps {
  order: KDSOrder
  onUpdateItemStatus?: (
    orderId: number,
    itemId: number,
    newStatus: "pending" | "cooking" | "done" | "served" | string
  ) => void
  onBatchUpdate?: (orderId: number, newStatus: "cooking" | "done") => void
  onMarkServed?: (orderId: number) => void
  highlightDish?: string | null
  className?: string
}

/**
 * Formats table number into prominent badge display (e.g. MEJA 04)
 */
export function formatTableBadge(tableNumber?: number | string | null): string {
  if (tableNumber === undefined || tableNumber === null || tableNumber === "") {
    return "MEJA --"
  }
  const str = String(tableNumber).trim()
  if (str.toUpperCase().startsWith("MEJA")) {
    return str.toUpperCase()
  }
  if (!isNaN(Number(str))) {
    return `MEJA ${String(Number(str)).padStart(2, "0")}`
  }
  return `MEJA ${str}`
}

/**
 * Computes elapsed time in seconds from created_at
 */
export function getElapsedSeconds(createdAt?: string, now = Date.now()): number {
  if (!createdAt) return 0
  const createdTime = new Date(createdAt).getTime()
  if (isNaN(createdTime)) return 0
  return Math.max(0, Math.floor((now - createdTime) / 1000))
}

/**
 * Formats seconds into MM:SS (or MMM:SS)
 */
export function formatElapsedTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

export function KDSTicketCard({
  order,
  onUpdateItemStatus,
  onBatchUpdate,
  onMarkServed,
  highlightDish,
  className,
}: KDSTicketCardProps) {
  const [now, setNow] = useState(() => Date.now())

  // Keep live elapsed time ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const elapsedSeconds = useMemo(
    () => getElapsedSeconds(order.created_at, now),
    [order.created_at, now]
  )
  const elapsedMinutes = Math.floor(elapsedSeconds / 60)

  // Urgency classification:
  // Normal (<10m): Gold/Cream
  // Warning (10-20m): Amber
  // Urgent (>20m): Bata Red
  const isOrderCompleted =
    order.status === "done" ||
    order.status === "served" ||
    order.status === "paid"

  const urgency = useMemo(() => {
    if (isOrderCompleted) return "completed"
    if (elapsedMinutes >= 20) return "urgent"
    if (elapsedMinutes >= 10) return "warning"
    return "normal"
  }, [isOrderCompleted, elapsedMinutes])

  const items = order.items || []

  const pendingItems = useMemo(
    () => items.filter((i) => (i.status || "pending") === "pending"),
    [items]
  )

  const activeNonDoneItems = useMemo(
    () => items.filter((i) => i.status !== "done" && i.status !== "served"),
    [items]
  )

  const allItemsDone = items.length > 0 && activeNonDoneItems.length === 0

  const isReservation = Boolean(
    (order as any).type === "reservation" ||
      (order as any).reservation_id ||
      (order.customer_name &&
        order.customer_name.toLowerCase().includes("reservasi"))
  )

  const hasHighlightedDish = useMemo(() => {
    if (!highlightDish) return false
    return items.some(
      (item) => item.dish_name?.toLowerCase() === highlightDish.toLowerCase()
    )
  }, [items, highlightDish])

  // Batch actions
  const handleStartAll = () => {
    if (onBatchUpdate) {
      onBatchUpdate(order.id, "cooking")
    } else if (onUpdateItemStatus) {
      pendingItems.forEach((item) => {
        onUpdateItemStatus(order.id, item.id, "cooking")
      })
    }
  }

  const handleCompleteAll = () => {
    if (onBatchUpdate) {
      onBatchUpdate(order.id, "done")
    } else if (onUpdateItemStatus) {
      activeNonDoneItems.forEach((item) => {
        onUpdateItemStatus(order.id, item.id, "done")
      })
    }
  }

  return (
    <div
      data-testid={`kds-ticket-card-${order.id}`}
      className={cn(
        "flex flex-col justify-between rounded-2xl bg-[#1b1610] text-[#f4ead3] border transition-all duration-200 overflow-hidden shadow-xl",
        urgency === "urgent"
          ? "border-[#b84a30] shadow-lg shadow-[#b84a30]/20"
          : urgency === "warning"
            ? "border-amber-500/50 shadow-md shadow-amber-500/10"
            : "border-[#392c1e]",
        hasHighlightedDish && "ring-2 ring-[#c9a24b] border-[#c9a24b]",
        className
      )}
    >
      {/* Ticket Header */}
      <div className="bg-[#241c13] px-4 py-3 border-b border-[#392c1e]">
        <div className="flex items-center justify-between gap-2">
          {/* Table badge & Order Type */}
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-base sm:text-lg tracking-wider text-[#c9a24b] bg-[#14110d] px-2.5 py-1 rounded-lg border border-[#c9a24b]/40">
              {formatTableBadge(order.table_number)}
            </span>
            <span
              className={cn(
                "text-[11px] font-medium px-2 py-0.5 rounded-full border",
                isReservation
                  ? "bg-[#c9a24b]/15 text-[#e7c57a] border-[#c9a24b]/40"
                  : "bg-[#14110d] text-[#cbbf9c] border-[#392c1e]"
              )}
            >
              {isReservation ? "Reservasi" : "Walk-in"}
            </span>
          </div>

          {/* Live Elapsed Timer */}
          <div
            data-testid="ticket-timer"
            className={cn(
              "flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold px-2.5 py-1 rounded-lg border",
              urgency === "urgent"
                ? "bg-[#b84a30]/20 text-[#d9534f] border-[#b84a30] animate-pulse"
                : urgency === "warning"
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/50"
                  : urgency === "completed"
                    ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/30"
                    : "bg-[#14110d] text-[#cbbf9c] border-[#392c1e]"
            )}
            title={`Waktu berjalan: ${formatElapsedTimer(elapsedSeconds)}`}
          >
            <ClockIcon
              className={cn(
                "w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0",
                urgency === "urgent"
                  ? "text-[#d9534f]"
                  : urgency === "warning"
                    ? "text-amber-400"
                    : urgency === "completed"
                      ? "text-emerald-400"
                      : "text-[#c9a24b]"
              )}
            />
            <span>{formatElapsedTimer(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Customer info & Ticket ID */}
        <div className="flex items-center justify-between text-xs text-[#a48f6e] mt-2 pt-2 border-t border-[#392c1e]/60">
          <div className="flex items-center gap-1.5 truncate">
            <UserIcon className="w-3.5 h-3.5 text-[#c9a24b]/70 shrink-0" />
            <span className="truncate font-medium text-[#cbbf9c]">
              {order.customer_name || "Tamu"}
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#a48f6e] shrink-0 font-semibold">
            #{order.id}
          </span>
        </div>
      </div>

      {/* Ticket Body: Line Items */}
      <div className="p-3.5 sm:p-4 space-y-3 flex-1">
        {items.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#a48f6e]">
            Tidak ada item dalam pesanan ini.
          </div>
        ) : (
          items.map((item) => {
            const itemStatus = item.status || "pending"
            const isCooking = itemStatus === "cooking"
            const isDone = itemStatus === "done" || itemStatus === "served"
            const isItemHighlighted =
              highlightDish &&
              item.dish_name?.toLowerCase() === highlightDish.toLowerCase()

            return (
              <div
                key={item.id}
                data-testid={`ticket-item-${item.id}`}
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  isDone
                    ? "bg-[#14110d]/40 border-[#392c1e]/50 opacity-60"
                    : isCooking
                      ? "bg-[#241c13] border-amber-500/40"
                      : "bg-[#241c13]/70 border-[#392c1e]",
                  isItemHighlighted && "ring-1 ring-[#c9a24b] bg-[#c9a24b]/10"
                )}
              >
                <div className="flex items-start justify-between gap-2.5">
                  {/* Quantity & Dish Name */}
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span
                      className={cn(
                        "font-mono font-black text-sm sm:text-base px-2 py-0.5 rounded-md shrink-0 transition-colors",
                        isDone
                          ? "bg-[#241c13] text-[#a48f6e] border border-[#392c1e]"
                          : isCooking
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-[#c9a24b]/20 text-[#e7c57a] border border-[#c9a24b]/40"
                      )}
                    >
                      {item.quantity}x
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4
                        className={cn(
                          "font-bold text-sm sm:text-base text-[#f4ead3] leading-snug break-words",
                          isDone && "line-through text-[#a48f6e]"
                        )}
                      >
                        {item.dish_name}
                      </h4>

                      {/* Sambal & Heat Level details */}
                      {item.sambal_name && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-[#cbbf9c]">
                          <span className="flex items-center gap-1">
                            <ChiliIcon className="w-3.5 h-3.5 text-[#b84a30] shrink-0" />
                            <span className="font-medium text-[#cbbf9c]">
                              {item.sambal_name}
                            </span>
                          </span>

                          {/* Chili Heat Level Icons (1-5 scale) */}
                          {item.sambal_heat_level !== undefined &&
                            item.sambal_heat_level !== null &&
                            item.sambal_heat_level > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 bg-[#14110d] px-1.5 py-0.5 rounded border border-[#392c1e] text-[10px] text-[#b84a30] font-mono font-bold"
                                title={`Level Pedas: ${item.sambal_heat_level}`}
                              >
                                {Array.from({
                                  length: Math.min(5, item.sambal_heat_level),
                                }).map((_, idx) => (
                                  <ChiliIcon
                                    key={idx}
                                    className="w-3 h-3 text-[#b84a30]"
                                  />
                                ))}
                                <span className="ml-0.5">
                                  Lvl {item.sambal_heat_level}
                                </span>
                              </span>
                            )}

                          {/* Extra Sambal Badge */}
                          {item.sambal_extra && (
                            <span className="text-[10px] font-mono font-semibold bg-[#e7c57a]/15 text-[#e7c57a] border border-[#e7c57a]/30 px-1.5 py-0.5 rounded">
                              +Extra
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Single-tap Line Item Action Button */}
                  <div className="shrink-0">
                    {itemStatus === "pending" && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateItemStatus?.(order.id, item.id, "cooking")
                        }
                        aria-label={`Masak ${item.dish_name}`}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[88px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#241c13] hover:bg-[#c9a24b]/20 text-[#f4ead3] border border-[#c9a24b]/50 hover:border-[#c9a24b] active:scale-95 transition-all cursor-pointer select-none"
                      >
                        <FlameIcon className="w-4 h-4 text-[#b84a30]" />
                        <span>Masak</span>
                      </button>
                    )}

                    {itemStatus === "cooking" && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateItemStatus?.(order.id, item.id, "done")
                        }
                        aria-label={`Selesaikan ${item.dish_name}`}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[88px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 active:scale-95 transition-all cursor-pointer select-none"
                      >
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                        <span>Selesai</span>
                      </button>
                    )}

                    {itemStatus === "done" && (
                      <button
                        type="button"
                        disabled
                        aria-label={`${item.dish_name} Siap Saji`}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[88px] px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#14110d] text-[#a48f6e] border border-[#392c1e] cursor-default opacity-80 select-none"
                      >
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500/70" />
                        <span>Siap Saji</span>
                      </button>
                    )}

                    {itemStatus === "served" && (
                      <button
                        type="button"
                        disabled
                        aria-label={`${item.dish_name} Terhidang`}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[88px] px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#14110d] text-[#a48f6e] border border-[#392c1e] cursor-default opacity-80 select-none"
                      >
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                        <span>Terhidang</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* High-visibility Customer Notes / Allergy Callout */}
                {item.notes && item.notes.trim().length > 0 && (
                  <div className="mt-2.5 flex items-start gap-2 bg-amber-500/15 border border-amber-500/40 rounded-lg p-2.5 text-xs text-amber-200">
                    <AlertTriangleIcon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-400 block">
                        Catatan Khusus:
                      </span>
                      <span className="font-medium">{item.notes}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Ticket Footer: Batch Actions & Ready Banner */}
      <div className="bg-[#14110d] px-3.5 sm:px-4 py-3 border-t border-[#392c1e] space-y-2">
        {allItemsDone ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-400">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Semua Menu Selesai Dimasak</span>
            </div>
            {onMarkServed && (
              <button
                type="button"
                onClick={() => onMarkServed(order.id)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 active:scale-95 transition-all cursor-pointer select-none"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>Sajikan ke Meja</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {/* Batch Start Pending Items */}
            <button
              type="button"
              disabled={pendingItems.length === 0}
              onClick={handleStartAll}
              aria-label="Mulai Semua"
              className={cn(
                "inline-flex items-center justify-center gap-1.5 min-h-[44px] px-2.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all select-none",
                pendingItems.length > 0
                  ? "bg-[#241c13] hover:bg-[#c9a24b]/20 text-[#f4ead3] border border-[#c9a24b]/50 hover:border-[#c9a24b] active:scale-95 cursor-pointer"
                  : "bg-[#1b1610] text-[#a48f6e]/50 border border-[#392c1e]/50 cursor-not-allowed opacity-50"
              )}
            >
              <FlameIcon className="w-4 h-4 text-[#b84a30]" />
              <span>Mulai Semua</span>
            </button>

            {/* Batch Complete All Items */}
            <button
              type="button"
              disabled={activeNonDoneItems.length === 0}
              onClick={handleCompleteAll}
              aria-label="Selesaikan Semua"
              className={cn(
                "inline-flex items-center justify-center gap-1.5 min-h-[44px] px-2.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all select-none",
                activeNonDoneItems.length > 0
                  ? "bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 active:scale-95 cursor-pointer"
                  : "bg-[#1b1610] text-[#a48f6e]/50 border border-[#392c1e]/50 cursor-not-allowed opacity-50"
              )}
            >
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
              <span>Selesaikan Semua</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
