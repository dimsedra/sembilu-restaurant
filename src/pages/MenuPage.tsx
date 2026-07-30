import { useEffect, useState } from "react"
import type { Dish } from "@/types"

export function MenuPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dishes")
      .then((r) => r.json())
      .then((data) => {
        setDishes(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-ink"><p className="text-cream-dim">Memuat sajian...</p></div>

  const featured = dishes.find((d) => d.tag === "Unggulan")

  return (
    <div className="min-h-screen bg-ink pt-24">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="mb-4 flex items-center gap-3 text-emas">
          <span className="font-aksara text-2xl leading-none">꧒</span>
          <span className="h-px w-7 bg-emas/50" />
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.42em] text-cream-dim">Sajian</span>
        </div>
        <h1 className="font-display text-4xl leading-[1.04] tracking-[-0.01em] text-cream sm:text-5xl md:text-6xl">
          Tiap hidangan adalah pernyataan —{" "}
          <span className="text-gold">bukan adaptasi.</span>
        </h1>

        {featured && (
          <div className="mt-14 grid items-stretch gap-8 overflow-hidden rounded-[2rem] border border-line bg-ink-2/60 lg:grid-cols-2">
            <div className="flex flex-col justify-center p-8 sm:p-12">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emas/40 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-emas">
                ✦ Unggulan
              </span>
              <h2 className="mt-5 font-display text-4xl leading-tight text-cream sm:text-5xl">
                {featured.name}
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-cream-dim">
                {featured.description}
              </p>
              <div className="mt-7 flex items-baseline gap-1">
                <span className="text-xs text-cream-dim">Rp</span>
                <span className="font-display text-4xl text-gold">{featured.price}</span>
                <span className="text-xs text-cream-dim">.000</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-line">
          <div className="border-b border-line/60 px-6 py-5 sm:px-10">
            <h3 className="font-display text-2xl text-cream">Sajian Andalan</h3>
            <p className="mt-1 text-sm text-cream-dim">Harga dalam ribuan Rupiah (Rp '000).</p>
          </div>
          <ul>
            {dishes.map((dish) => (
              <li key={dish.id} className="group border-b border-line/50 px-6 py-6 transition hover:bg-ink-2/50 last:border-b-0 sm:px-10">
                <div className="flex items-baseline">
                  <span className="mr-3 font-aksara text-lg text-emas/70">{dish.aksara_no}</span>
                  <h4 className="font-display text-xl text-cream transition group-hover:text-emas sm:text-2xl">{dish.name}</h4>
                  {dish.tag && (
                    <span className="ml-3 rounded-full border border-bata/40 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-bata">{dish.tag}</span>
                  )}
                  <span className="leader" />
                  <span className="font-display text-xl text-gold sm:text-2xl">{dish.price}</span>
                </div>
                <p className="mt-1.5 pl-8 text-sm leading-relaxed text-cream-dim sm:text-[0.95rem]">{dish.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
