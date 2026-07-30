import React, { useMemo, useState } from "react"
import { locations } from "@/data"
import { cn } from "@/utils/cn"
import { Kawung, Reveal, SectionHeading } from "@/components/primitives"

const cities = locations.map((l) => l.city)
const branchIdMap: Record<string, number> = { Tegal: 1, Slawi: 2, Semarang: 3, Jakarta: 4 }
const slots = ["11:30", "12:30", "18:00", "19:00", "19:30", "20:00"]
const today = new Date().toISOString().slice(0, 10)

const orderItems = [
  { id: "ikan", name: "Ikan Bakar Pantura", price: 89 },
  { id: "ayam", name: "Ayam Kampung Lengkuas", price: 68 },
  { id: "nasi", name: "Nasi Tutug Oncom", price: 38 },
  { id: "es", name: "Es Gembira", price: 32 },
]

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-cream-dim">{label}</span>
      {children}
    </label>
  )
}

const inputCls = "w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-sm text-cream transition focus:border-emas [color-scheme:dark]"

export function Reserve() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [branch, setBranch] = useState(cities[0])
  const [date, setDate] = useState(today)
  const [time, setTime] = useState(slots[3])
  const [pax, setPax] = useState(2)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const [counts, setCounts] = useState<Record<string, number>>({ ikan: 1 })
  const total = useMemo(() => orderItems.reduce((s, it) => s + (counts[it.id] || 0) * it.price, 0), [counts])
  const qty = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts])

  const branchId = branchIdMap[branch]

  const handleSubmit = async () => {
    if (!name || !phone) {
      setResult({ ok: false, message: "Nama dan nomor telepon harus diisi" })
      return
    }
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          branch_id: branchId,
          date,
          time: time + ":00",
          party_size: pax,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({
          ok: true,
          message: `Terima kasih ${data.customer.name}! Reservasi untuk ${pax} tamu di SEMBILU ${branch}, ${fmtDate(date)} pukul ${time} telah dikonfirmasi.`,
        })
      } else {
        setResult({ ok: false, message: data.error || "Gagal reservasi" })
      }
    } catch {
      setResult({ ok: false, message: "Gagal terhubung ke server" })
    }
    setSubmitting(false)
  }

  const fmtDate = (d: string) => {
    try {
      return new Date(d + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })
    } catch {
      return d
    }
  }

  return (
    <section id="reservasi" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32">
      <Kawung className="spin-slow pointer-events-none absolute -right-28 top-10 h-72 w-72 text-emas/[0.05]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            numeral="꧕"
            kicker="Reservasi"
            title={<>Pesan tempat, atau <span className="text-gold">pesan makanan.</span></>}
            intro="Dua jalan menuju meja SEMBILU. Reservasi langsung di sini, atau susun pesanan untuk antar & ambil."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* Booking */}
          <Reveal>
            <div className="h-full rounded-[2rem] border border-line bg-ink-2/50 p-7 sm:p-9">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-2xl sm:text-3xl">Reservasi Meja</h3>
                  <p className="mt-1 text-sm text-cream-dim">Amankan meja Anda dalam 30 detik.</p>
                </div>
                <span className="rounded-full border border-emas/40 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-emas">Gratis</span>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-4">
                <Field label="Nama" className="col-span-2">
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" className={inputCls} />
                </Field>
                <Field label="Telepon" className="col-span-2 sm:col-span-1">
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812-xxxx-xxxx" className={inputCls} />
                </Field>
                <Field label="Cabang" className="col-span-2 sm:col-span-1">
                  <select value={branch} onChange={(e) => setBranch(e.target.value)} className={inputCls}>
                    {cities.map((c) => (
                      <option key={c} value={c} className="bg-ink">SEMBILU {c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Tanggal" className="col-span-2 sm:col-span-1">
                  <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Waktu">
                  <select value={time} onChange={(e) => setTime(e.target.value)} className={inputCls}>
                    {slots.map((s) => (
                      <option key={s} value={s} className="bg-ink">{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Tamu">
                  <select value={pax} onChange={(e) => setPax(Number(e.target.value))} className={inputCls}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n} className="bg-ink">{n} orang</option>
                    ))}
                  </select>
                </Field>
              </div>

              {result && (
                <div className={cn("mt-6 rounded-2xl border p-5", result.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-bata/30 bg-bata/5")}>
                  <p className={cn("text-sm leading-relaxed", result.ok ? "text-emerald-300/90" : "text-bata")}>{result.message}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-6 w-full rounded-full bg-emas px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-emas-bright disabled:opacity-50"
              >
                {submitting ? "Memproses..." : "Konfirmasi Reservasi"}
              </button>
            </div>
          </Reveal>

          {/* Order preview */}
          <Reveal delay={120}>
            <div className="flex h-full flex-col rounded-[2rem] border border-line bg-ink-2/50 p-7 sm:p-9">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-2xl sm:text-3xl">Pesan Online</h3>
                  <p className="mt-1 text-sm text-cream-dim">Antar atau ambil sendiri.</p>
                </div>
                <span className="rounded-full border border-line px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-cream-dim">Pratinjau</span>
              </div>

              <ul className="mt-6 flex-1 space-y-2">
                {orderItems.map((it) => {
                  const n = counts[it.id] || 0
                  return (
                    <li key={it.id} className="flex items-center justify-between rounded-xl border border-line/60 bg-ink px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-sm text-cream">{it.name}</div>
                        <div className="text-xs text-muted">Rp {it.price}.000</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" aria-label={`Kurang ${it.name}`} onClick={() => setCounts((c) => ({ ...c, [it.id]: Math.max(0, n - 1) }))} className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-cream-dim transition hover:border-emas hover:text-emas">−</button>
                        <span className="w-4 text-center text-sm tabular-nums text-cream">{n}</span>
                        <button type="button" aria-label={`Tambah ${it.name}`} onClick={() => setCounts((c) => ({ ...c, [it.id]: n + 1 }))} className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-cream-dim transition hover:border-emas hover:text-emas">+</button>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <p className="mt-3 text-xs text-cream-dim">+ 9 sambal gratis di setiap pesanan.</p>

              <div className="mt-5 flex items-center justify-between border-t border-line pt-5">
                <div>
                  <div className="text-xs uppercase tracking-wider text-cream-dim">Total · {qty} item</div>
                  <div className="font-display text-2xl text-gold">Rp {total}.000</div>
                </div>
                <button type="button" disabled={total === 0} className="rounded-full bg-emas px-6 py-3 text-sm font-semibold text-ink transition hover:bg-emas-bright disabled:opacity-40">
                  Mulai Pesanan →
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
