import { useEffect, useState } from "react"
import dishFish from "@/assets/dish-fish.jpg"
import type { Dish } from "@/types"
import { Reveal, SectionHeading } from "@/components/primitives"

export function Menu() {
  const [dishes, setDishes] = useState<Dish[]>([])

  useEffect(() => {
    fetch("/api/dishes")
      .then((r) => r.json())
      .then(setDishes)
  }, [])

  const featured = dishes.find((d) => d.tag === "Unggulan")

  return (
    <section
      id="sajian"
      className="relative scroll-mt-24 border-t border-line/60 bg-ink-2/40 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            numeral="꧒"
            kicker="Sajian"
            title={
              <>
                Tiap hidangan adalah pernyataan —{" "}
                <span className="text-gold">bukan adaptasi.</span>
              </>
            }
            intro="Bahan segar dari pesisir Pantura, dibumbui sesuai resep keluarga. Menu kami berbentuk ringkas dengan sengaja: agar setiap rasa mendapat ruang."
          />
        </Reveal>

        {featured && (
          <Reveal delay={80}>
            <div className="mt-14 grid items-stretch gap-8 overflow-hidden rounded-[2rem] border border-line bg-ink-2/60 lg:grid-cols-2">
              <div className="relative min-h-64 overflow-hidden lg:min-h-full">
                <img
                  src={dishFish}
                  alt="Ikan Bakar Pantura di atas daun pisang dengan sambal"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent lg:bg-gradient-to-r" />
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-12">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emas/40 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-emas">
                  ✦ Unggulan
                </span>
                <h3 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">
                  {featured.name}
                </h3>
                <p className="mt-4 max-w-md leading-relaxed text-cream-dim">
                  {featured.description}
                </p>
                <div className="mt-7 flex items-baseline gap-1">
                  <span className="text-xs text-cream-dim">Rp</span>
                  <span className="font-display text-4xl text-gold">{featured.price}</span>
                  <span className="text-xs text-cream-dim">.000</span>
                </div>
                <a
                  href="#reservasi"
                  className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-emas px-6 py-3 text-sm font-semibold text-ink transition hover:bg-emas-bright"
                >
                  Pesan hidangan ini →
                </a>
              </div>
            </div>
          </Reveal>
        )}

        <Reveal delay={120}>
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-line">
            <div className="border-b border-line/60 px-6 py-5 sm:px-10">
              <h3 className="font-display text-2xl text-cream">
                Sajian Andalan
              </h3>
              <p className="mt-1 text-sm text-cream-dim">
                Harga dalam ribuan Rupiah (Rp '000).
              </p>
            </div>
            {dishes.length > 0 && (
              <ul>
                {dishes.map((dish) => (
                  <li
                    key={dish.id}
                    className="group border-b border-line/50 px-6 py-6 transition hover:bg-ink-2/50 last:border-b-0 sm:px-10"
                  >
                    <div className="flex items-baseline">
                      <span className="mr-3 font-aksara text-lg text-emas/70">
                        {dish.aksara_no}
                      </span>
                      <h4 className="font-display text-xl text-cream transition group-hover:text-emas sm:text-2xl">
                        {dish.name}
                      </h4>
                      {dish.tag && (
                        <span className="ml-3 rounded-full border border-bata/40 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-bata">
                          {dish.tag}
                        </span>
                      )}
                      <span className="leader" />
                      <span className="font-display text-xl text-gold sm:text-2xl">
                        {dish.price}
                      </span>
                    </div>
                    <p className="mt-1.5 pl-8 text-sm leading-relaxed text-cream-dim sm:text-[0.95rem]">
                      {dish.description}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
