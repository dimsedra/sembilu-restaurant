import React, { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { cn } from "../utils/cn"
import { AKSARA } from "../data"
import {
  StaffUser,
  getStaffToken,
  getStaffUser,
  clearStaffAuth,
  getAuthHeaders,
} from "../utils/staffAuth"
import { playKitchenBell } from "../utils/sound"
import {
  BellIcon,
  BellOffIcon,
  WifiIcon,
  WifiOffIcon,
  UserIcon,
  LogOutIcon,
  RefreshCwIcon,
  ChefHatIcon,
} from "../components/staff/icons"
import { StaffAuthModal } from "../components/staff/StaffAuthModal"
import { KDSOrder } from "../components/staff/KDSAggregateBar"
import { WaiterOrderCard } from "../components/staff/WaiterOrderCard"

export const BRANCHES = [
  { id: 1, name: "Tegal" },
  { id: 2, name: "Solo" },
  { id: 3, name: "Yogyakarta" },
]

export type WaiterTab = "ready" | "cooking" | "served" | "all"

export function WaiterOrdersPage() {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(() => getStaffUser())
  const [showAuthModal, setShowAuthModal] = useState<boolean>(() => !getStaffToken())
  const [selectedBranchId, setSelectedBranchId] = useState<number>(() => {
    const user = getStaffUser()
    return user?.branch_id || 1
  })

  const [orders, setOrders] = useState<KDSOrder[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState<boolean>(false)
  const [selectedTab, setSelectedTab] = useState<WaiterTab>("ready")
  const [isMuted, setIsMuted] = useState<boolean>(false)

  const wsRef = useRef<WebSocket | null>(null)

  const fetchOrders = useCallback(async (branchId = selectedBranchId) => {
    const token = getStaffToken()
    if (!token) {
      setShowAuthModal(true)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/staff/orders?branch_id=${branchId}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Gagal memuat daftar pesanan.")
      const data = await res.json()
      setOrders(data)
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat pesanan.")
    } finally {
      setLoading(false)
    }
  }, [selectedBranchId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.hostname}:3001`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setWsConnected(true)
    ws.onclose = () => setWsConnected(false)
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (
          payload.type === "order_created" ||
          payload.type === "order_updated" ||
          payload.event === "order_created" ||
          payload.event === "order_updated"
        ) {
          if ((payload.order?.status === "done" || payload.status === "done") && !isMuted) {
            playKitchenBell(false)
          }
          fetchOrders()
        }
      } catch {
        // ignore malformed ws message
      }
    }

    return () => {
      ws.close()
    }
  }, [fetchOrders, isMuted])

  // Handle Deliver Order
  const handleServeOrder = async (orderId: number) => {
    try {
      const res = await fetch(`/api/staff/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "served" }),
      })
      if (!res.ok) throw new Error("Gagal mengupdate status pesanan.")

      // Optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "served", items: o.items ? o.items.map((i) => ({ ...i, status: "served" })) : [] }
            : o
        )
      )
    } catch (err: any) {
      alert(err.message)
      fetchOrders()
    }
  }

  // Filtered Orders & Badges
  const readyOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === "done" ||
          (o.items &&
            o.items.length > 0 &&
            o.items.every((i) => i.status === "done" || i.status === "served") &&
            o.status !== "served")
      ),
    [orders]
  )
  const cookingOrders = useMemo(
    () => orders.filter((o) => o.status === "pending" || o.status === "cooking"),
    [orders]
  )
  const servedOrders = useMemo(
    () => orders.filter((o) => o.status === "served"),
    [orders]
  )

  const displayedOrders = useMemo(() => {
    switch (selectedTab) {
      case "ready":
        return readyOrders
      case "cooking":
        return cookingOrders
      case "served":
        return servedOrders
      default:
        return orders
    }
  }, [selectedTab, readyOrders, cookingOrders, servedOrders, orders])

  return (
    <div className="grain min-h-screen bg-ink font-sans text-cream">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-ink-2/90 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-aksara text-sm text-emas">{AKSARA}</span>
            <div>
              <h1 className="font-display text-lg font-bold tracking-wider text-cream">
                SEMBILU · OPERASIONAL WAITER
              </h1>
              <p className="text-xs text-cream-dim">Manajemen Pengantaran Hidangan ke Meja</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Link to Kitchen KDS */}
            <a
              href="/staff/kitchen"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-cream-dim hover:text-cream hover:border-emas transition"
            >
              <ChefHatIcon className="h-4 w-4 text-emas" />
              Layar Dapur (KDS)
            </a>

            {/* Branch Switcher */}
            {staffUser?.role === "manager" && (
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  const newBranch = Number(e.target.value)
                  setSelectedBranchId(newBranch)
                  fetchOrders(newBranch)
                }}
                className="rounded-lg border border-line bg-ink-3 px-3 py-1.5 text-xs text-cream focus:border-emas"
              >
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>Cabang {b.name}</option>
                ))}
              </select>
            )}

            {/* Sound Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Aktifkan Suara Notifikasi" : "Matikan Suara Notifikasi"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                isMuted
                  ? "border-line bg-ink-3 text-muted"
                  : "border-emas/30 bg-emas/10 text-emas"
              )}
            >
              {isMuted ? <BellOffIcon className="h-3.5 w-3.5" /> : <BellIcon className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">{isMuted ? "Suara Mati" : "Suara Aktif"}</span>
            </button>

            {/* WebSocket Indicator */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                wsConnected ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"
              )}
            >
              {wsConnected ? <WifiIcon className="h-3 w-3" /> : <WifiOffIcon className="h-3 w-3" />}
              {wsConnected ? "Live" : "Offline"}
            </span>

            {/* Logged in Staff Badge */}
            {staffUser && (
              <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-line bg-ink-3 px-2.5 py-1 text-xs text-cream-dim">
                <UserIcon className="h-3.5 w-3.5 text-emas" />
                <span>{staffUser.name}</span>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={() => {
                clearStaffAuth()
                setStaffUser(null)
                setShowAuthModal(true)
              }}
              title="Logout"
              className="rounded-lg border border-line p-2 text-muted hover:text-cream"
            >
              <LogOutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Error Notification */}
        {error && (
          <div className="mb-6 rounded-xl border border-bata/40 bg-bata/15 p-4 text-sm text-cream">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex gap-2" role="tablist">
            <button
              role="tab"
              aria-selected={selectedTab === "ready"}
              onClick={() => setSelectedTab("ready")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
                selectedTab === "ready"
                  ? "bg-emas text-ink shadow"
                  : "border border-line bg-ink-2 text-cream-dim hover:text-cream"
              )}
            >
              <span>🔔 Siap Diantar</span>
              {readyOrders.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bata text-xs font-bold text-cream animate-bounce">
                  {readyOrders.length}
                </span>
              )}
            </button>

            <button
              role="tab"
              aria-selected={selectedTab === "cooking"}
              onClick={() => setSelectedTab("cooking")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
                selectedTab === "cooking"
                  ? "bg-emas text-ink shadow"
                  : "border border-line bg-ink-2 text-cream-dim hover:text-cream"
              )}
            >
              <span>🔥 Sedang Dimasak</span>
              <span className="text-xs opacity-75">({cookingOrders.length})</span>
            </button>

            <button
              role="tab"
              aria-selected={selectedTab === "served"}
              onClick={() => setSelectedTab("served")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
                selectedTab === "served"
                  ? "bg-emas text-ink shadow"
                  : "border border-line bg-ink-2 text-cream-dim hover:text-cream"
              )}
            >
              <span>✓ Tersaji di Meja</span>
              <span className="text-xs opacity-75">({servedOrders.length})</span>
            </button>

            <button
              role="tab"
              aria-selected={selectedTab === "all"}
              onClick={() => setSelectedTab("all")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
                selectedTab === "all"
                  ? "bg-emas text-ink shadow"
                  : "border border-line bg-ink-2 text-cream-dim hover:text-cream"
              )}
            >
              <span>Semua ({orders.length})</span>
            </button>
          </div>

          <button
            onClick={() => fetchOrders()}
            className="flex items-center gap-1.5 text-xs text-cream-dim hover:text-cream"
          >
            <RefreshCwIcon className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Orders Grid */}
        {loading && orders.length === 0 ? (
          <div className="py-16 text-center text-muted">Memuat daftar pesanan...</div>
        ) : displayedOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line py-16 text-center">
            <p className="font-display text-lg text-cream-dim">Tidak ada pesanan dalam status ini.</p>
            <p className="mt-1 text-xs text-muted">Pesanan baru atau yang selesai dimasak akan muncul otomatis di sini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedOrders.map((order) => (
              <WaiterOrderCard
                key={order.id}
                order={order}
                onServeOrder={handleServeOrder}
              />
            ))}
          </div>
        )}
      </main>

      {/* Auth Modal Guard */}
      <StaffAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          setStaffUser(user)
          setSelectedBranchId(user.branch_id)
          setShowAuthModal(false)
          fetchOrders(user.branch_id)
        }}
      />
    </div>
  )
}
