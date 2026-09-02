import { useEffect, useState, useMemo, useCallback, useRef } from "react"
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
  ChefHatIcon,
  BellIcon,
  BellOffIcon,
  WifiIcon,
  WifiOffIcon,
  UserIcon,
  LogOutIcon,
  RefreshCwIcon,
} from "../components/staff/icons"
import { StaffAuthModal } from "../components/staff/StaffAuthModal"
import {
  KDSAggregateBar,
  KDSOrder,
} from "../components/staff/KDSAggregateBar"
import { KDSTicketCard } from "../components/staff/KDSTicketCard"

export const KDS_BRANCHES = [
  { id: 1, name: "Tegal" },
  { id: 2, name: "Solo" },
  { id: 3, name: "Yogyakarta" },
]

export type KDSFilterTab = "all" | "pending" | "cooking" | "done"

export function KDSPage() {
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

  // Audio alert mute toggle (persisted in localStorage)
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sembilu_kds_muted") === "true"
    } catch {
      return false
    }
  })

  // Filter tabs & Aggregator dish selection
  const [selectedTab, setSelectedTab] = useState<KDSFilterTab>("all")
  const [selectedDish, setSelectedDish] = useState<string | null>(null)
  const [newOrderFlashId, setNewOrderFlashId] = useState<number | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<any>(null)

  // Toggle sound
  const handleToggleSound = () => {
    setIsMuted((prev) => {
      const next = !prev
      try {
        localStorage.setItem("sembilu_kds_muted", String(next))
      } catch {
        // Ignored
      }
      return next
    })
  }

  // Logout handler
  const handleLogout = () => {
    clearStaffAuth()
    setStaffUser(null)
    setShowAuthModal(true)
    setOrders([])
  }

  // Fetch orders from REST API
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

      if (res.status === 401 || res.status === 403) {
        // Auth expired or forbidden
        clearStaffAuth()
        setStaffUser(null)
        setShowAuthModal(true)
        setLoading(false)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Gagal memuat daftar pesanan dapur.")
      }

      const data: KDSOrder[] = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || "Gagal menghubungi server.")
    } finally {
      setLoading(false)
    }
  }, [selectedBranchId])

  // Login success callback
  const handleAuthSuccess = (staff: StaffUser) => {
    setStaffUser(staff)
    setShowAuthModal(false)
    if (staff.branch_id) {
      setSelectedBranchId(staff.branch_id)
    }
    fetchOrders(staff.branch_id || selectedBranchId)
  }

  // Initial fetch on mount or branch change
  useEffect(() => {
    if (getStaffToken()) {
      fetchOrders(selectedBranchId)
    }
  }, [fetchOrders, selectedBranchId])

  // WebSocket Live Connection
  useEffect(() => {
    if (!getStaffToken()) return

    let isSubscribed = true

    const connectWebSocket = () => {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return
      }

      try {
        const host = (typeof window !== "undefined" && window.location.hostname) ? window.location.hostname : "localhost"
        const socket = new WebSocket(`ws://${host}:3001`)
        wsRef.current = socket

        socket.onopen = () => {
          if (!isSubscribed) return
          setWsConnected(true)
        }

        socket.onclose = () => {
          if (!isSubscribed) return
          setWsConnected(false)
          // Attempt auto-reconnect after 3s
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isSubscribed) connectWebSocket()
          }, 3000)
        }

        socket.onerror = () => {
          if (!isSubscribed) return
          setWsConnected(false)
        }

        socket.onmessage = (event) => {
          if (!isSubscribed) return
          try {
            const data = JSON.parse(event.data)

            if (data.event === "order_created") {
              // 1. Play dual-tone brass kitchen bell chime
              playKitchenBell(isMuted)

              // 2. Trigger arrival flash
              if (data.orderId) {
                setNewOrderFlashId(data.orderId)
                setTimeout(() => setNewOrderFlashId(null), 3000)
              }

              // 3. Refresh orders from server to ensure full dish & sambal joins
              fetchOrders(selectedBranchId)
            } else if (data.event === "order_updated") {
              if (data.orderId) {
                setOrders((prevOrders) =>
                  prevOrders.map((ord) => {
                    if (ord.id !== data.orderId) return ord

                    // If order status changed to served, update it
                    const newStatus = data.status || ord.status

                    // Update items if provided in payload
                    let updatedItems = ord.items || []
                    if (data.items && Array.isArray(data.items)) {
                      updatedItems = updatedItems.map((item) => {
                        const matching = data.items.find((i: any) => i.id === item.id)
                        return matching ? { ...item, status: matching.status } : item
                      })
                    }

                    return {
                      ...ord,
                      status: newStatus,
                      items: updatedItems,
                    }
                  })
                )
              }
            }
          } catch (e) {
            console.error("KDS WebSocket message parse error:", e)
          }
        }
      } catch (err) {
        console.error("KDS WebSocket connection error:", err)
        setWsConnected(false)
      }
    }

    connectWebSocket()

    return () => {
      isSubscribed = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [isMuted, fetchOrders, selectedBranchId])

  // Single Item Status Transition Handler
  const handleUpdateItemStatus = async (
    orderId: number,
    itemId: number,
    newStatus: string
  ) => {
    // 1. Optimistic local state update
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord
        const updatedItems = (ord.items || []).map((it) =>
          it.id === itemId ? { ...it, status: newStatus } : it
        )
        // Check if all items are now done
        const allDone = updatedItems.every((it) => it.status === "done")
        const updatedOrderStatus =
          newStatus === "cooking" && ord.status === "pending"
            ? "cooking"
            : allDone
              ? "done"
              : ord.status

        return {
          ...ord,
          status: updatedOrderStatus,
          items: updatedItems,
        }
      })
    )

    // 2. Server API request
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        console.error("Gagal memperbarui item status:", errData.error)
        // Revert by re-fetching
        fetchOrders(selectedBranchId)
      }
    } catch (err) {
      console.error("Network error updating item status:", err)
      fetchOrders(selectedBranchId)
    }
  }

  // Batch Update Handler for all eligible items in a ticket
  const handleBatchUpdate = async (
    orderId: number,
    newStatus: "cooking" | "done"
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId)
    if (!targetOrder || !targetOrder.items) return

    const eligibleItems = targetOrder.items.filter((item) => {
      const itemStat = item.status || "pending"
      if (newStatus === "cooking") return itemStat === "pending"
      if (newStatus === "done") return itemStat !== "done" && itemStat !== "served"
      return false
    })

    // Run updates concurrently
    await Promise.all(
      eligibleItems.map((it) => handleUpdateItemStatus(orderId, it.id, newStatus))
    )
  }

  // Mark Entire Order as Served Handler
  const handleMarkServed = async (orderId: number) => {
    // 1. Optimistic removal / update
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId ? { ...ord, status: "served" } : ord
      )
    )

    // 2. Server API request
    try {
      const res = await fetch(`/api/staff/orders/${orderId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "served" }),
      })

      if (!res.ok) {
        fetchOrders(selectedBranchId)
      }
    } catch (err) {
      console.error("Error marking order served:", err)
      fetchOrders(selectedBranchId)
    }
  }

  // Filter and Sort Orders:
  // - Exclude served, paid, and cancelled orders
  // - Sort FIFO (oldest first by created_at or id)
  const activeOrders = useMemo(() => {
    return orders
      .filter((o) => o.status !== "served" && o.status !== "paid" && o.status !== "cancelled")
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : a.id
        const timeB = b.created_at ? new Date(b.created_at).getTime() : b.id
        return timeA - timeB
      })
  }, [orders])

  // Counts for tabs
  const tabCounts = useMemo(() => {
    let pendingCount = 0
    let cookingCount = 0
    let doneCount = 0

    for (const ord of activeOrders) {
      const items = ord.items || []
      const hasPending = items.some((i) => (i.status || "pending") === "pending")
      const hasCooking = items.some((i) => i.status === "cooking")
      const allDone = items.length > 0 && items.every((i) => i.status === "done")

      if (hasPending) pendingCount++
      if (hasCooking) cookingCount++
      if (allDone || ord.status === "done") doneCount++
    }

    return {
      all: activeOrders.length,
      pending: pendingCount,
      cooking: cookingCount,
      done: doneCount,
    }
  }, [activeOrders])

  // Filtered orders based on selectedTab and selectedDish
  const filteredOrders = useMemo(() => {
    return activeOrders.filter((ord) => {
      const items = ord.items || []

      // 1. Tab Filter
      if (selectedTab === "pending") {
        const hasPending = items.some((i) => (i.status || "pending") === "pending")
        if (!hasPending) return false
      } else if (selectedTab === "cooking") {
        const hasCooking = items.some((i) => i.status === "cooking")
        if (!hasCooking) return false
      } else if (selectedTab === "done") {
        const isDone = (items.length > 0 && items.every((i) => i.status === "done")) || ord.status === "done"
        if (!isDone) return false
      }

      // 2. Dish Filter from All-Day bar (if applied)
      if (selectedDish) {
        const hasDish = items.some(
          (i) => i.dish_name?.toLowerCase() === selectedDish.toLowerCase()
        )
        if (!hasDish) return false
      }

      return true
    })
  }, [activeOrders, selectedTab, selectedDish])

  return (
    <div className="min-h-screen bg-[#14110d] text-[#f4ead3] flex flex-col selection:bg-[#c9a24b] selection:text-[#14110d]">
      {/* Auth Modal Guard */}
      <StaffAuthModal
        isOpen={showAuthModal}
        onSuccess={handleAuthSuccess}
      />

      {/* 1. Sticky Header Bar */}
      <header className="sticky top-0 z-40 bg-[#1b1610]/95 backdrop-blur-md border-b border-[#392c1e] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand Logo & Aksara */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#241c13] border border-[#c9a24b]/40 text-[#c9a24b] shadow-inner">
                <ChefHatIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif font-bold text-lg tracking-wide text-[#f4ead3]">
                    SEMBILU
                  </h1>
                  <span className="text-[#c9a24b] font-medium text-xs">·</span>
                  <span className="text-xs uppercase font-mono tracking-wider text-[#cbbf9c] font-semibold">
                    DAPUR OPERASIONAL
                  </span>
                </div>
                <span className="font-aksara text-xs text-[#c9a24b]/80 tracking-widest block">
                  {AKSARA}
                </span>
              </div>
            </div>

            {/* Mobile Actions Right */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSound}
                aria-label={isMuted ? "Bunyikan Suara" : "Bisukan Suara"}
                className={cn(
                  "p-2 rounded-xl border transition-colors cursor-pointer",
                  isMuted
                    ? "bg-[#241c13] text-[#a48f6e] border-[#392c1e]"
                    : "bg-[#c9a24b]/20 text-[#e7c57a] border-[#c9a24b]/40"
                )}
              >
                {isMuted ? <BellOffIcon className="w-5 h-5" /> : <BellIcon className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={() => fetchOrders(selectedBranchId)}
                title="Segarkan Antrean"
                className="p-2 rounded-xl bg-[#241c13] border border-[#392c1e] text-[#cbbf9c] hover:text-[#c9a24b] transition-colors cursor-pointer"
              >
                <RefreshCwIcon className={cn("w-5 h-5", loading && "animate-spin text-[#c9a24b]")} />
              </button>
            </div>
          </div>

          {/* Center / Right controls */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5">
            {/* Quick Link to Waiter Screen */}
            <a
              href="/staff/orders"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-cream-dim hover:text-cream hover:border-emas transition"
            >
              Layar Waiter / Floor
            </a>

            {/* Branch Selector */}
            <div className="flex items-center gap-1.5 bg-[#241c13] border border-[#392c1e] px-2.5 py-1 rounded-xl text-xs">
              <span className="text-[#a48f6e] font-mono uppercase text-[10px]">Cabang:</span>
              <select
                aria-label="Pilih Cabang"
                value={selectedBranchId}
                onChange={(e) => {
                  const newBranch = Number(e.target.value)
                  setSelectedBranchId(newBranch)
                  fetchOrders(newBranch)
                }}
                className="bg-transparent text-[#f4ead3] font-semibold focus:outline-none cursor-pointer"
              >
                {KDS_BRANCHES.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#1b1610] text-[#f4ead3]">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Live WebSocket Status Badge */}
            <div
              data-testid="ws-status-badge"
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-medium border",
                wsConnected
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40"
                  : "bg-[#b84a30]/15 text-[#d9534f] border-[#b84a30]/40"
              )}
            >
              {wsConnected ? (
                <>
                  <WifiIcon className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Live Dapur</span>
                </>
              ) : (
                <>
                  <WifiOffIcon className="w-3.5 h-3.5 text-[#d9534f]" />
                  <span>Terputus</span>
                </>
              )}
            </div>

            {/* Desktop Audio Alert Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              aria-label={isMuted ? "Bunyikan Suara" : "Bisukan Suara"}
              className={cn(
                "hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer select-none",
                isMuted
                  ? "bg-[#241c13] text-[#a48f6e] border-[#392c1e] hover:border-[#c9a24b]/40"
                  : "bg-[#c9a24b]/15 text-[#e7c57a] border-[#c9a24b]/40 hover:bg-[#c9a24b]/25 shadow-sm"
              )}
            >
              {isMuted ? (
                <>
                  <BellOffIcon className="w-4 h-4 text-[#a48f6e]" />
                  <span>Suara Mati</span>
                </>
              ) : (
                <>
                  <BellIcon className="w-4 h-4 text-[#c9a24b]" />
                  <span>Suara Aktif</span>
                </>
              )}
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchOrders(selectedBranchId)}
              title="Segarkan Antrean"
              aria-label="Segarkan Antrean"
              className="hidden md:inline-flex items-center justify-center p-2 rounded-xl bg-[#241c13] border border-[#392c1e] text-[#cbbf9c] hover:text-[#c9a24b] hover:border-[#c9a24b]/40 transition-colors cursor-pointer"
            >
              <RefreshCwIcon className={cn("w-4 h-4", loading && "animate-spin text-[#c9a24b]")} />
            </button>

            {/* Staff Info & Logout */}
            {staffUser && (
              <div className="flex items-center gap-2 bg-[#241c13] border border-[#392c1e] px-2.5 py-1 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-[#cbbf9c]">
                  <UserIcon className="w-3.5 h-3.5 text-[#c9a24b]" />
                  <span className="font-semibold text-[#f4ead3] max-w-[90px] sm:max-w-[120px] truncate">
                    {staffUser.name}
                  </span>
                  <span className="text-[10px] uppercase font-mono text-[#a48f6e] hidden sm:inline">
                    ({staffUser.role})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Keluar (Logout)"
                  aria-label="Keluar Staf"
                  className="p-1 rounded text-[#a48f6e] hover:text-[#b84a30] hover:bg-[#14110d] transition-colors cursor-pointer"
                >
                  <LogOutIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Tabs Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-[#392c1e]/60 flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedTab("all")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none",
              selectedTab === "all"
                ? "bg-[#c9a24b] text-[#14110d] shadow-sm font-bold"
                : "bg-[#241c13] text-[#cbbf9c] border border-[#392c1e] hover:border-[#c9a24b]/40 hover:text-[#f4ead3]"
            )}
          >
            <span>Semua Aktif</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded font-mono text-[10px]",
                selectedTab === "all" ? "bg-[#14110d]/20 text-[#14110d]" : "bg-[#14110d] text-[#a48f6e]"
              )}
            >
              {tabCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab("pending")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none",
              selectedTab === "pending"
                ? "bg-[#c9a24b] text-[#14110d] shadow-sm font-bold"
                : "bg-[#241c13] text-[#cbbf9c] border border-[#392c1e] hover:border-[#c9a24b]/40 hover:text-[#f4ead3]"
            )}
          >
            <span>Menunggu</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded font-mono text-[10px]",
                selectedTab === "pending" ? "bg-[#14110d]/20 text-[#14110d]" : "bg-[#14110d] text-[#a48f6e]"
              )}
            >
              {tabCounts.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab("cooking")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none",
              selectedTab === "cooking"
                ? "bg-[#c9a24b] text-[#14110d] shadow-sm font-bold"
                : "bg-[#241c13] text-[#cbbf9c] border border-[#392c1e] hover:border-[#c9a24b]/40 hover:text-[#f4ead3]"
            )}
          >
            <span>Sedang Dimasak</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded font-mono text-[10px]",
                selectedTab === "cooking" ? "bg-[#14110d]/20 text-[#14110d]" : "bg-[#14110d] text-[#a48f6e]"
              )}
            >
              {tabCounts.cooking}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab("done")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none",
              selectedTab === "done"
                ? "bg-[#c9a24b] text-[#14110d] shadow-sm font-bold"
                : "bg-[#241c13] text-[#cbbf9c] border border-[#392c1e] hover:border-[#c9a24b]/40 hover:text-[#f4ead3]"
            )}
          >
            <span>Siap Saji</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded font-mono text-[10px]",
                selectedTab === "done" ? "bg-[#14110d]/20 text-[#14110d]" : "bg-[#14110d] text-[#a48f6e]"
              )}
            >
              {tabCounts.done}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-[#b84a30]/15 border border-[#b84a30]/40 text-[#f4ead3] flex items-center justify-between gap-3">
            <span className="text-sm">{error}</span>
            <button
              type="button"
              onClick={() => fetchOrders(selectedBranchId)}
              className="text-xs font-mono font-bold uppercase underline hover:text-[#c9a24b] cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* 2. "All-Day" Batch Cooking Strip */}
        <section aria-label="Batch Cooking Summary">
          <KDSAggregateBar
            orders={activeOrders}
            selectedDish={selectedDish}
            onFilterDish={setSelectedDish}
          />
        </section>

        {/* 3. Digital Ticket Rail Grid */}
        <section aria-label="Digital Ticket Rail">
          {loading && orders.length === 0 ? (
            <div className="py-24 text-center">
              <div className="inline-block animate-spin text-3xl text-[#c9a24b] mb-3">
                ✦
              </div>
              <p className="text-sm font-mono text-[#cbbf9c]">
                Memuat antrean tiket dapur...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            /* Clear Empty State */
            <div
              data-testid="kds-empty-state"
              className="rounded-3xl border border-[#392c1e] bg-[#1b1610]/80 p-12 text-center max-w-xl mx-auto backdrop-blur my-8"
            >
              <div className="mb-3 font-aksara text-4xl text-[#c9a24b]/70">
                ꧋
              </div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#241c13] border border-[#c9a24b]/40 text-[#c9a24b] mb-4 shadow-lg">
                <ChefHatIcon className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl text-[#f4ead3] font-medium">
                Dapur Bersih · Tidak Ada Antrean Pesanan
              </h2>
              <p className="text-sm text-[#cbbf9c] mt-2 max-w-md mx-auto">
                {selectedDish
                  ? `Tidak ada pesanan aktif yang berisi menu "${selectedDish}".`
                  : selectedTab !== "all"
                    ? `Tidak ada pesanan dalam kategori tab "${selectedTab}".`
                    : "Semua pesanan telah dimasak dan disajikan. Menunggu pesanan baru masuk..."}
              </p>
              {selectedDish && (
                <button
                  type="button"
                  onClick={() => setSelectedDish(null)}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#241c13] border border-[#c9a24b]/40 text-[#c9a24b] text-xs font-semibold hover:bg-[#c9a24b]/20 transition-all cursor-pointer"
                >
                  Hapus Filter Menu
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 items-start">
              {filteredOrders.map((order) => {
                const isNewFlash = newOrderFlashId === order.id
                return (
                  <KDSTicketCard
                    key={order.id}
                    order={order}
                    highlightDish={selectedDish}
                    onUpdateItemStatus={handleUpdateItemStatus}
                    onBatchUpdate={handleBatchUpdate}
                    onMarkServed={handleMarkServed}
                    className={cn(
                      "transition-all duration-300",
                      isNewFlash && "ring-4 ring-emerald-400 animate-pulse scale-[1.02]"
                    )}
                  />
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
