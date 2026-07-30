import { useEffect, useState } from "react"
import type { Dish } from "@/types"
import { cn } from "@/utils/cn"
import dishFish from "@/assets/dish-fish.jpg"

const gradients = [
  "from-emas/20 via-ink-3 to-ink",
  "from-bata/20 via-ink-3 to-ink",
  "from-emas/10 via-bata/10 to-ink-3",
  "from-cream/5 via-ink-3 to-ink",
  "from-emas/15 via-ink-2 to-ink-3",
  "from-bata/15 via-ink-3 to-ink-2",
  "from-amber-800/20 via-ink-3 to-ink",
]

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
  const rest = dishes.filter((d) => d.id !== featured?.id)

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
            <div className="flex min-h-64 flex-col justify-center p-8 sm:p-12">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emas/40 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-emas">
                ✦ Unggulan
              </span>
              <h2 className="mt-5 font-display text-4xl leading-tight text-cream sm:text-5xl">{featured.name}</h2>
              <p className="mt-4 max-w-md leading-relaxed text-cream-dim">{featured.description}</p>
              <div className="mt-7 flex items-baseline gap-1">
                <span className="text-xs text-cream-dim">Rp</span>
                <span className="font-display text-4xl text-gold">{featured.price}</span>
                <span className="text-xs text-cream-dim">.000</span>
              </div>
              <a href="#reservasi" className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-emas px-6 py-3 text-sm font-semibold text-ink transition hover:bg-emas-bright">
                Pesan hidangan ini →
              </a>
            </div>
            <div className="relative min-h-48 overflow-hidden lg:min-h-full">
              <img src={dishFish} alt={featured.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent lg:bg-gradient-to-r" />
              <span className="absolute bottom-5 left-6 font-aksara text-6xl text-cream/10">{featured.aksara_no}</span>
            </div>
          </div>
        )}

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((dish, i) => (
            <div key={dish.id} className="group overflow-hidden rounded-[2rem] border border-line bg-ink-2/50 transition hover:border-emas/40">
              <div className={cn("relative h-48 bg-gradient-to-br", gradients[i % gradients.length])}>
                <span className="absolute bottom-3 left-4 font-aksara text-5xl text-cream/10">{dish.aksara_no}</span>
                {dish.tag && (
                  <span className="absolute right-3 top-3 rounded-full border border-bata/40 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-bata">
                    {dish.tag}
                  </span>
                )}
              </div>
              <div className="flex flex-col p-5 sm:p-6">
                <h3 className="font-display text-2xl text-cream transition group-hover:text-emas">{dish.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-cream-dim">{dish.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-cream-dim">Rp</span>
                    <span className="font-display text-2xl text-gold">{dish.price}</span>
                    <span className="text-xs text-cream-dim">.000</span>
                  </div>
                  <a
                    href="#reservasi"
                    className="rounded-full border border-emas/30 px-4 py-2 text-xs font-semibold text-emas transition hover:bg-emas hover:text-ink"
                  >
                    Pesan
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
