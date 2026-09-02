import React from "react"
import { cn } from "../../utils/cn"
import { KDSOrder } from "./KDSAggregateBar"
import { formatElapsedTimer, getElapsedSeconds } from "./KDSTicketCard"
import { CheckCircleIcon, FlameIcon, ChiliIcon } from "./icons"

export interface WaiterOrderCardProps {
  order: KDSOrder
  onServeOrder: (orderId: number) => void
  onServeItem?: (orderId: number, itemId: number) => void
}

export function WaiterOrderCard({ order, onServeOrder, onServeItem }: WaiterOrderCardProps) {
  const elapsed = getElapsedSeconds(order.created_at)
  const items = order.items || []
  const isReadyForPickup =
    order.status === "done" ||
    (items.length > 0 && items.every((i) => i.status === "done" || i.status === "served"))
  const isAllServed =
    order.status === "served" ||
    (items.length > 0 && items.every((i) => i.status === "served"))

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border p-4 shadow-lg transition-all",
        isReadyForPickup && !isAllServed
          ? "border-emas bg-ink-2 ring-2 ring-emas/30"
          : isAllServed
          ? "border-line/60 bg-ink-2/50 opacity-75"
          : "border-line bg-ink-2"
      )}
    >
      {/* Header Meja & Info */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emas font-display text-lg font-bold text-ink">
            {order.table_number}
          </span>
          <div>
            <h3 className="font-display font-semibold text-cream">Meja {order.table_number}</h3>
            <p className="text-xs text-cream-dim">{order.customer_name || "Tamu Walk-in"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded bg-ink-3 px-2 py-1 font-mono text-xs text-cream-dim">
            ⏱ {formatElapsedTimer(elapsed)}
          </span>
          {isReadyForPickup && !isAllServed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emas/15 px-2.5 py-0.5 text-xs font-semibold text-emas">
              <span className="h-1.5 w-1.5 rounded-full bg-emas animate-pulse" />
              Siap Diantar
            </span>
          ) : isAllServed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              ✓ Tersaji
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-950 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
              <FlameIcon className="h-3 w-3" /> Sedang Dimasak
            </span>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="my-3 flex-1 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-start justify-between rounded-lg p-2.5 text-sm",
              item.status === "done"
                ? "bg-emas/10 border border-emas/30"
                : item.status === "served"
                ? "bg-emerald-950/20 border border-emerald-800/30"
                : "bg-ink-3/60 border border-line/40"
            )}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emas">{item.quantity}x</span>
                <span className="font-medium text-cream">{item.dish_name}</span>
              </div>
              {item.sambal_name && (
                <div className="mt-1 flex items-center gap-1 text-xs text-cream-dim">
                  <ChiliIcon className="h-3 w-3 text-bata" />
                  <span>{item.sambal_name}</span>
                </div>
              )}
              {item.notes && <p className="mt-0.5 text-xs italic text-muted">"{item.notes}"</p>}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-medium",
                  item.status === "done"
                    ? "bg-emas text-ink font-semibold"
                    : item.status === "served"
                    ? "bg-emerald-900 text-emerald-300"
                    : "bg-ink-3 text-muted"
                )}
              >
                {item.status === "done" ? "Siap" : item.status === "served" ? "Tersaji" : "Dimasak"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="pt-2">
        {!isAllServed ? (
          <button
            type="button"
            onClick={() => onServeOrder(order.id)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-emas px-4 py-2.5 font-sans text-sm font-semibold text-ink shadow transition hover:bg-emas-bright active:scale-[0.98]"
          >
            <CheckCircleIcon className="h-4 w-4" />
            Konfirmasi Telah Diantar ke Meja
          </button>
        ) : (
          <div className="flex min-h-[44px] items-center justify-center text-xs font-semibold text-muted">
            Pesanan telah diantar ke Meja {order.table_number}
          </div>
        )}
      </div>
    </div>
  )
}
