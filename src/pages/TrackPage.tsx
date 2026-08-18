import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { AKSARA } from "@/data"
import { cn } from "@/utils/cn"

interface Order {
  id: number
  branch_id: number
  customer_id: number | null
  table_number: number
  status: string
  created_at?: string
  updated_at?: string
}

interface Customer {
  name: string
  phone: string
}

interface Branch {
  id: number
  name: string
  city?: string
  address?: string
}

interface OrderItem {
  id: number
  order_id: number
  dish_id: number
  quantity: number
  sambal_id: number | null
  sambal_extra: boolean
  notes?: string | null
  status: "pending" | "cooking" | "done" | string
  dish_name: string
  dish_price: number
  sambal_name?: string | null
  sambal_heat_level?: number | null
}

const TIMELINE_STAGES = [
  {
    key: "pending",
    title: "Diterima",
    desc: "Pesanan telah dicatat di sistem.",
    aksara: "꧑",
  },
  {
    key: "cooking",
    title: "Dimasak",
    desc: "Dapur sedang meracik hidangan.",
    aksara: "꧒",
  },
  {
    key: "done",
    title: "Siap Disajikan",
    desc: "Hidangan selesai dimasak, siap diantar.",
    aksara: "꧓",
  },
  {
    key: "served",
    title: "Tersaji",
    desc: "Selamat menikmati santapan Jawa.",
    aksara: "꧔",
  },
]

function getStageIndex(status: string): number {
  switch (status) {
    case "pending":
      return 0
    case "cooking":
      return 1
    case "done":
      return 2
    case "served":
    case "paid":
      return 3
    default:
      return 0
  }
}

function formatRupiah(amount: number): string {
  const normalized = amount < 1000 ? amount * 1000 : amount
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(normalized)
}

function formatChiliHeat(heat: number | null | undefined): string {
  if (!heat || heat <= 0) return ""
  return "🌶️".repeat(Math.min(heat, 5))
}

export function TrackPage() {
  const { orderId } = useParams<{ orderId: string }>()

  const [order, setOrder] = useState<Order | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [branch, setBranch] = useState<Branch | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [connected, setConnected] = useState(false)

  // 1. Initial REST fetch
  useEffect(() => {
    if (!orderId) {
      setError("ID pesanan tidak valid")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")

    fetch(`/api/orders/${orderId}/track`)
      .then(async (res) => {
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(errBody.error || "Pesanan tidak ditemukan")
        }
        return res.json()
      })
      .then((data) => {
        setOrder(data.order)
        setCustomer(data.customer)
        setBranch(data.branch)
        setItems(data.items || [])
      })
      .catch((err) => {
        setError(err.message || "Gagal memuat status pesanan")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [orderId])

  // 2. Real-time WebSocket connection
  useEffect(() => {
    if (!orderId) return

    let isMounted = true
    const host = window.location.hostname || "localhost"
    const socket = new WebSocket(`ws://${host}:3001`)

    socket.onopen = () => {
      if (isMounted) setConnected(true)
    }

    socket.onclose = () => {
      if (isMounted) setConnected(false)
    }

    socket.onerror = () => {
      if (isMounted) setConnected(false)
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.event === "order_updated" && data.orderId === Number(orderId)) {
          setOrder((prev) => (prev ? { ...prev, status: data.status } : prev))
          if (data.items && Array.isArray(data.items)) {
            setItems((prevItems) =>
              prevItems.map((item) => {
                const updated = data.items.find((i: any) => i.id === item.id)
                return updated ? { ...item, status: updated.status } : item
              })
            )
          }
        }
      } catch (e) {
        console.error("Gagal memproses pesan WebSocket:", e)
      }
    }

    return () => {
      isMounted = false
      socket.close()
    }
  }, [orderId])

  const currentStageIndex = order ? getStageIndex(order.status) : 0

  // Calculate order total
  const dishSubtotal = items.reduce(
    (acc, it) => acc + (it.dish_price || 0) * (it.quantity || 1),
    0
  )
  const sambalExtraSubtotal = items.reduce(
    (acc, it) => acc + (it.sambal_extra ? 5 * (it.quantity || 1) : 0),
    0
  )
  const grandTotal = dishSubtotal + sambalExtraSubtotal

  if (loading) {
    return (
      <div className="grain relative flex min-h-screen items-center justify-center bg-ink px-5">
        <div className="text-center">
          <div className="mb-4 animate-spin text-4xl text-emas">✦</div>
          <p className="font-display text-xl text-cream">Memuat Status Pesanan...</p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cream-dim">
            {AKSARA}
          </p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="grain relative flex min-h-screen items-center justify-center bg-ink px-5">
        <div className="mx-auto max-w-md rounded-3xl border border-bata/40 bg-ink-2/80 p-8 text-center backdrop-blur">
          <div className="mb-4 font-aksara text-5xl text-bata">꧋</div>
          <h1 className="font-display text-2xl text-cream">Pesanan Tidak Ditemukan</h1>
          <p className="mt-3 text-sm text-cream-dim">
            {error || "Nomor pesanan yang Anda tuju tidak terdaftar atau telah kadaluwarsa."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/order"
              className="rounded-full bg-emas px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink transition hover:bg-emas-bright"
            >
              Buat Pesanan Baru
            </Link>
            <Link
              to="/"
              className="rounded-full border border-line px-6 py-2.5 text-xs font-semibold text-cream-dim transition hover:border-emas hover:text-cream"
            >
              Ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grain relative min-h-screen bg-ink text-cream pb-20 pt-8 sm:pt-12">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        {/* Navigation & Header */}
        <header className="mb-8 flex flex-col gap-4 border-b border-line/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-ink-2/70 text-cream-dim transition hover:border-emas hover:text-emas"
              title="Kembali ke Beranda"
            >
              ←
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl tracking-tight text-cream">
                  SEMBILU
                </span>
                <span className="font-aksara text-sm text-emas">{AKSARA}</span>
              </div>
              <p className="text-xs uppercase tracking-widest text-muted">
                Pelacakan Pesanan Langsung
              </p>
            </div>
          </div>

          {/* Live WebSocket Status Indicator */}
          <div className="flex items-center">
            {connected ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-medium text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span>🟢 Pembaruan Langsung Aktif</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/40 px-3.5 py-1.5 text-xs font-medium text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Menghubungkan Ulang...</span>
              </div>
            )}
          </div>
        </header>

        {/* Order Identifier & Overview Card */}
        <section className="mb-10 rounded-3xl border border-line bg-gradient-to-b from-ink-2/90 to-ink-3/70 p-6 backdrop-blur sm:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-display text-3xl font-medium tracking-tight text-gold sm:text-4xl">
                  Pesanan #{order.id}
                </span>
                <span className="rounded-full border border-emas/30 bg-emas/10 px-3 py-0.5 font-aksara text-xs text-emas">
                  {branch?.name || `Cabang ${order.branch_id}`}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cream-dim">
                {customer && (
                  <span>
                    Pemesan: <strong className="text-cream">{customer.name}</strong>
                  </span>
                )}
                <span>·</span>
                <span>
                  Meja <strong className="text-cream">{order.table_number}</strong>
                </span>
                {order.created_at && (
                  <>
                    <span>·</span>
                    <span className="text-xs text-muted">
                      {new Date(order.created_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-line bg-ink/60 px-4 py-2.5">
              <span className="text-xs uppercase tracking-widest text-muted">Status:</span>
              <span className="font-display text-base font-semibold capitalize text-gold">
                {order.status === "pending"
                  ? "Diterima"
                  : order.status === "cooking"
                  ? "Sedang Dimasak"
                  : order.status === "done"
                  ? "Siap Disajikan"
                  : order.status === "served"
                  ? "Tersaji"
                  : order.status === "paid"
                  ? "Lunas"
                  : order.status}
              </span>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="mt-10 border-t border-line/50 pt-8">
            <div className="relative">
              {/* Horizontal Line Background for Desktop */}
              <div className="absolute left-8 right-8 top-5 hidden h-0.5 bg-line/80 sm:block" />
              {/* Active Line Fill for Desktop */}
              <div
                className="absolute left-8 top-5 hidden h-0.5 bg-gradient-to-r from-emas to-emas-bright transition-all duration-700 sm:block"
                style={{
                  width: `calc(${(currentStageIndex / (TIMELINE_STAGES.length - 1)) * 100}% - 2rem)`,
                }}
              />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 sm:gap-2">
                {TIMELINE_STAGES.map((stage, idx) => {
                  const isCompleted = idx < currentStageIndex
                  const isCurrent = idx === currentStageIndex
                  const isUpcoming = idx > currentStageIndex

                  return (
                    <div
                      key={stage.key}
                      className={cn(
                        "relative flex flex-row items-start gap-4 transition-all duration-300 sm:flex-col sm:items-center sm:text-center",
                        isUpcoming && "opacity-40"
                      )}
                    >
                      {/* Step Circle */}
                      <div
                        className={cn(
                          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-500",
                          isCurrent &&
                            "border-emas bg-emas text-ink shadow-[0_0_20px_rgba(201,162,75,0.6)] ring-4 ring-emas/20",
                          isCompleted &&
                            "border-emas/80 bg-ink-2 text-emas",
                          isUpcoming &&
                            "border-line bg-ink-2 text-cream-dim/50"
                        )}
                      >
                        {isCompleted ? (
                          "✓"
                        ) : (
                          <span className="font-aksara">{stage.aksara}</span>
                        )}
                      </div>

                      {/* Stage Info */}
                      <div>
                        <h4
                          className={cn(
                            "font-display text-base font-semibold",
                            isCurrent && "text-gold",
                            isCompleted && "text-cream",
                            isUpcoming && "text-cream-dim"
                          )}
                        >
                          {stage.title}
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-cream-dim">
                          {stage.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid: Line Items & Order Summary */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Line Items List (2 cols) */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-cream">Rincian Hidangan</h2>
              <span className="text-xs text-muted">
                {items.length} macam sajian
              </span>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-line bg-ink-2/40 p-4 transition-all hover:border-line/90 hover:bg-ink-2/60 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-lg text-cream">
                          {item.dish_name}
                        </span>
                        <span className="rounded-md bg-ink-3 px-2 py-0.5 text-xs font-semibold text-emas">
                          × {item.quantity}
                        </span>
                      </div>

                      {/* Sambal & Extras */}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        {item.sambal_name ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-bata/30 bg-bata/10 px-2.5 py-1 text-bata-bright">
                            <span>{item.sambal_name}</span>
                            {item.sambal_heat_level ? (
                              <span title={`Tingkat Pedas: ${item.sambal_heat_level}`}>
                                {formatChiliHeat(item.sambal_heat_level)}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-cream-dim/60">Tanpa sambal</span>
                        )}

                        {item.sambal_extra && (
                          <span className="rounded-full border border-emas/30 bg-emas/10 px-2 py-0.5 text-[0.7rem] text-emas">
                            + Tambahan
                          </span>
                        )}
                      </div>

                      {/* Special Notes */}
                      {item.notes && (
                        <p className="mt-2.5 text-xs italic text-cream-dim/80 bg-ink-3/50 px-3 py-1.5 rounded-lg border border-line/40">
                          Catatan: "{item.notes}"
                        </p>
                      )}
                    </div>

                    {/* Status Badge & Price */}
                    <div className="flex flex-col items-end gap-2 text-right">
                      <span className="font-display text-sm font-semibold text-gold">
                        {formatRupiah(item.dish_price * item.quantity)}
                      </span>

                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-wider",
                          item.status === "cooking" &&
                            "border-emas/50 bg-emas/15 text-emas animate-pulse",
                          item.status === "done" &&
                            "border-emerald-500/40 bg-emerald-950/50 text-emerald-400",
                          (item.status === "pending" || !item.status) &&
                            "border-line bg-ink-3 text-cream-dim"
                        )}
                      >
                        {item.status === "cooking"
                          ? "🔥 Dimasak"
                          : item.status === "done"
                          ? "✓ Siap"
                          : "⏳ Menunggu"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Sidebar (1 col) */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-line bg-ink-2/60 p-6 backdrop-blur">
              <h3 className="font-display text-xl text-cream">Ringkasan Biaya</h3>
              <p className="mt-1 text-xs text-muted">
                Pembayaran dapat diselesaikan di kasir.
              </p>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between text-cream-dim">
                  <span>Subtotal Hidangan</span>
                  <span className="text-cream">{formatRupiah(dishSubtotal)}</span>
                </div>

                {sambalExtraSubtotal > 0 && (
                  <div className="flex justify-between text-cream-dim">
                    <span>Sambal Tambahan</span>
                    <span className="text-cream">{formatRupiah(sambalExtraSubtotal)}</span>
                  </div>
                )}

                <div className="border-t border-line/60 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg text-cream">Total Akhir</span>
                    <span className="font-display text-2xl font-bold text-gold">
                      {formatRupiah(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-line/50 bg-ink-3/40 p-3 text-center">
                <p className="text-xs text-cream-dim">
                  Kenyamanan Anda adalah kehormatan kami. Silakan sampaikan bila ada kebutuhan tambahan kepada pramusaji.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-3">
              <Link
                to="/order"
                className="w-full rounded-full border border-line bg-ink-2/40 py-3 text-center text-xs font-semibold text-cream-dim transition hover:border-emas hover:text-cream"
              >
                + Tambah Pesanan Lain
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
