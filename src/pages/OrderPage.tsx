import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import type { Dish } from "@/types"
import { cn } from "@/utils/cn"
import dishFish from "@/assets/dish-fish.jpg"

type Sambal = { id: number; aksara_no: string; name: string; heat: number; price: number }
type CartItem = { dish: Dish; quantity: number; sambalId: number | null; sambalExtra: boolean }

const gradients = [
  "from-emas/20 via-ink-3 to-ink",
  "from-bata/20 via-ink-3 to-ink",
  "from-emas/10 via-bata/10 to-ink-3",
  "from-cream/5 via-ink-3 to-ink",
  "from-emas/15 via-ink-2 to-ink-3",
  "from-bata/15 via-ink-3 to-ink-2",
  "from-amber-800/20 via-ink-3 to-ink",
]

export function OrderPage() {
  const [params] = useSearchParams()
  const branchId = Number(params.get("branch_id")) || 0
  const tableNumber = Number(params.get("table")) || 0

  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [dishes, setDishes] = useState<Dish[]>([])
  const [sambals, setSambals] = useState<Sambal[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ orderId: number } | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/dishes?branch_id=" + branchId).then((r) => r.json()).then(setDishes)
    fetch("/api/sambals").then((r) => r.json()).then(setSambals)
  }, [branchId])

  const addToCart = (dish: Dish) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.dish.id === dish.id)
      if (existing) return prev.map((c) => c.dish.id === dish.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { dish, quantity: 1, sambalId: null, sambalExtra: false }]
    })
  }

  const updateQty = (dishId: number, delta: number) => {
    setCart((prev) => prev.map((c) => c.dish.id === dishId ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c))
  }

  const removeItem = (dishId: number) => {
    setCart((prev) => prev.filter((c) => c.dish.id !== dishId))
  }

  const setSambal = (dishId: number, sambalId: number | null) => {
    setCart((prev) => prev.map((c) => c.dish.id === dishId ? { ...c, sambalId } : c))
  }

  const toggleSambalExtra = (dishId: number) => {
    setCart((prev) => prev.map((c) => c.dish.id === dishId ? { ...c, sambalExtra: !c.sambalExtra } : c))
  }

  const totalQty = cart.reduce((s, c) => s + c.quantity, 0)
  const freeSambalCount = totalQty
  const usedSambalCount = cart.reduce((s, c) => s + (c.sambalId ? c.quantity : 0), 0)
  const extraSambalCount = cart.reduce((s, c) => s + (c.sambalExtra ? c.quantity : 0), 0)
  const dishTotal = cart.reduce((s, c) => s + c.dish.price * c.quantity, 0)
  const extraTotal = cart.reduce((s, c) => {
    if (!c.sambalExtra || !c.sambalId) return s
    const sambal = sambals.find((sm) => sm.id === c.sambalId)
    return s + (sambal?.price || 0) * c.quantity
  }, 0)
  const grandTotal = dishTotal + extraTotal

  const branches = ["", "Tegal", "Slawi", "Semarang", "Jakarta"]

  const handleSubmit = async () => {
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          branch_id: branchId,
          table_number: tableNumber,
          items: cart.map((c) => ({
            dish_id: c.dish.id,
            quantity: c.quantity,
            sambal_id: c.sambalId,
            sambal_extra: c.sambalExtra,
          })),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ orderId: data.order.id })
      } else {
        setError(data.error || "Gagal memproses pesanan")
      }
    } catch {
      setError("Gagal terhubung ke server")
    }
    setSubmitting(false)
  }

  if (result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="mx-auto max-w-md px-5 text-center">
          <div className="mb-4 font-aksara text-6xl text-emas">꧋</div>
          <h1 className="font-display text-4xl text-cream">Pesanan Diterima!</h1>
          <p className="mt-4 font-display text-2xl text-gold">#{result.orderId}</p>
          <p className="mt-2 text-cream-dim">Sembilan sambal gratis menyertaimu.</p>
          <button onClick={() => { setResult(null); setStep(2); setCart([]) }} className="mt-8 rounded-full border border-emas/40 px-6 py-3 text-sm font-semibold text-emas transition hover:bg-emas hover:text-ink">
            Pesan Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink pt-24">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        {/* Table badge */}
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-line bg-ink-2/60 px-5 py-3">
          <span className="rounded-full bg-emas/20 px-3 py-1 font-aksara text-sm text-emas">{branches[branchId] || "?"}</span>
          <span className="text-cream-dim">|</span>
          <span className="text-sm text-cream-dim">Meja <strong className="text-cream">{tableNumber}</strong></span>
          <span className="ml-auto flex gap-1 text-xs text-muted">
            {[1, 2, 3, 4].map((s) => (
              <span key={s} className={cn("h-2 w-6 rounded-full", step === s ? "bg-emas" : "bg-line")} />
            ))}
          </span>
        </div>

        {step === 1 && (
          <div className="mx-auto max-w-md">
            <h2 className="font-display text-3xl text-cream">Siapa yang makan?</h2>
            <p className="mt-2 text-sm text-cream-dim">Konfirmasi identitas untuk meja ini.</p>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-cream-dim">Nama</span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" className="w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-sm text-cream transition focus:border-emas [color-scheme:dark]" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-cream-dim">Telepon</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812-xxxx-xxxx" className="w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-sm text-cream transition focus:border-emas [color-scheme:dark]" />
              </label>
              <button disabled={!name || !phone} onClick={() => setStep(2)} className="mt-4 w-full rounded-full bg-emas px-6 py-3 text-sm font-semibold text-ink transition hover:bg-emas-bright disabled:opacity-40">
                Lanjut ke Menu →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-3xl text-cream">Pilih Sajian</h2>
            <p className="mt-2 text-sm text-cream-dim">Tap untuk menambah. Setelah selesai, atur sambal.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dishes.map((dish, i) => {
                const inCart = cart.find((c) => c.dish.id === dish.id)
                return (
                  <div key={dish.id} className={cn("overflow-hidden rounded-[2rem] border transition", inCart ? "border-emas/50" : "border-line")}>
                    <div className={cn("relative h-32 bg-gradient-to-br", gradients[i % gradients.length])}>
                      {dish.id === 1 && <img src={dishFish} alt="" className="h-full w-full object-cover opacity-50" />}
                      <span className="absolute bottom-2 left-3 font-aksara text-4xl text-cream/10">{dish.aksara_no}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-lg text-cream">{dish.name}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-cream-dim">{dish.description.slice(0, 60)}...</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-display text-lg text-gold">Rp {dish.price}.000</span>
                        {inCart ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(dish.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-cream-dim hover:border-emas hover:text-emas">−</button>
                            <span className="w-4 text-center text-sm text-cream">{inCart.quantity}</span>
                            <button onClick={() => updateQty(dish.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-cream-dim hover:border-emas hover:text-emas">+</button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(dish)} className="rounded-full bg-emas/20 px-4 py-1.5 text-xs font-semibold text-emas transition hover:bg-emas hover:text-ink">+ Tambah</button>
                        )}
                      </div>
                      {inCart && (
                        <button onClick={() => removeItem(dish.id)} className="mt-2 text-xs text-bata/70 hover:text-bata">Hapus</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(1)} className="rounded-full border border-line px-6 py-3 text-sm text-cream-dim hover:text-cream">Kembali</button>
              <button onClick={() => setStep(3)} className="rounded-full bg-emas px-6 py-3 text-sm font-semibold text-ink transition hover:bg-emas-bright">
                Atur Sambal ({cart.length} item) →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-3xl text-cream">Pilih Sambal</h2>
            <p className="mt-2 text-sm text-cream-dim">{freeSambalCount} sambal gratis — sisanya Rp 5.000–10.000.</p>
            <div className="mt-6 space-y-4">
              {cart.map((c) => (
                <div key={c.dish.id} className="rounded-2xl border border-line bg-ink-2/50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg text-cream">{c.dish.name} × {c.quantity}</h3>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                    <button
                      onClick={() => setSambal(c.dish.id, null)}
                      className={cn("rounded-xl border px-3 py-2 text-xs transition", !c.sambalId ? "border-emas/50 bg-emas/10 text-emas" : "border-line text-cream-dim hover:border-emas/30")}
                    >Tanpa</button>
                    {sambals.map((s) => {
                      const isFree = usedSambalCount <= freeSambalCount
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSambal(c.dish.id, s.id)}
                          className={cn("rounded-xl border px-3 py-2 text-xs transition", c.sambalId === s.id ? "border-emas/50 bg-emas/10 text-emas" : "border-line text-cream-dim hover:border-emas/30")}
                        >
                          <span className="block font-semibold">{s.name}</span>
                          <span className="block text-[0.6rem] text-muted">{isFree ? "Gratis" : `Rp ${s.price}.000`}</span>
                        </button>
                      )
                    })}
                  </div>
                  {c.sambalId && (
                    <button onClick={() => toggleSambalExtra(c.dish.id)} className={cn("mt-2 text-xs underline-offset-2 hover:underline", c.sambalExtra ? "text-bata" : "text-cream-dim")}>
                      {c.sambalExtra ? "✕ Batalkan sambal tambahan" : "+ Tambah sambal (Rp tersedia)"}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(2)} className="rounded-full border border-line px-6 py-3 text-sm text-cream-dim hover:text-cream">Kembali</button>
              <button onClick={() => setStep(4)} className="rounded-full bg-emas px-6 py-3 text-sm font-semibold text-ink transition hover:bg-emas-bright">Review Pesanan →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-display text-3xl text-cream">Konfirmasi Pesanan</h2>
            <div className="mt-6 space-y-3">
              {cart.map((c) => {
                const sambal = c.sambalId ? sambals.find((s) => s.id === c.sambalId) : null
                return (
                  <div key={c.dish.id} className="flex items-center justify-between rounded-xl border border-line/60 bg-ink-2/30 px-4 py-3">
                    <div>
                      <div className="font-display text-lg text-cream">{c.dish.name} × {c.quantity}</div>
                      {sambal && (
                        <div className="text-xs text-cream-dim">{sambal.name}{c.sambalExtra ? " (tambahan)" : ""}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-display text-gold">Rp {c.dish.price * c.quantity}.000</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 rounded-xl border border-line/60 bg-ink-2/30 px-4 py-3 text-sm text-cream-dim">
              <div className="flex justify-between"><span>Sambal gratis</span><span>{Math.min(usedSambalCount, freeSambalCount)} / {freeSambalCount}</span></div>
              {extraSambalCount > 0 && (
                <div className="mt-1 flex justify-between"><span>Sambal tambahan</span><span>Rp {extraTotal}.000</span></div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
              <span className="font-display text-2xl text-cream">Total</span>
              <span className="font-display text-3xl text-gold">Rp {grandTotal}.000</span>
            </div>
            {error && <div className="mt-4 rounded-xl border border-bata/30 bg-bata/5 px-4 py-3 text-sm text-bata">{error}</div>}
            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(3)} className="rounded-full border border-line px-6 py-3 text-sm text-cream-dim hover:text-cream">Kembali</button>
              <button onClick={handleSubmit} disabled={submitting} className="rounded-full bg-emas px-8 py-3 text-sm font-semibold text-ink transition hover:bg-emas-bright disabled:opacity-50">
                {submitting ? "Memproses..." : "Pesan Sekarang"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
