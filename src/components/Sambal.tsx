import { useEffect, useState } from "react"
import sambalImg from "@/assets/sambal.jpg"
import { cn } from "@/utils/cn"
import { Reveal, SectionHeading } from "@/components/primitives"

type Sambal = {
  id: number
  aksara_no: string
  name: string
  heat: number
  note: string
}

function Heat({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`Tingkat pedas ${level} dari 3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn("h-1.5 w-1.5 rotate-45", i <= level ? "bg-bata" : "bg-line")}
        />
      ))}
    </span>
  )
}

export function Sambal() {
  const [sambals, setSambals] = useState<Sambal[]>([])

  useEffect(() => {
    fetch("/api/sambals")
      .then((r) => r.json())
      .then(setSambals)
  }, [])

  return (
    <section id="sambal" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            numeral="꧓"
            kicker="Sambal"
            title={
              <>
                SEMBILU ≈ sembilan. <span className="text-gold">Sembilan sambal.</span>
              </>
            }
            intro="Di Tegal, sambal bukan pelengkap — ia alasan datang. Sembilan resep, ditumbuk tangan di atas cobek batu setiap pagi."
          />
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-line">
              <img
                src={sambalImg}
                alt="Sembilan mangkuk sambal berbeda tersusun rapi"
                className="aspect-[5/4] w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                <span className="font-display text-2xl text-cream">9 sambal</span>
                <span className="text-xs uppercase tracking-[0.2em] text-cream-dim">ditumbuk pagi ini</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            {sambals.length > 0 && (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {sambals.map((s) => (
                  <li key={s.id} className="group rounded-2xl border border-line bg-ink-2/50 p-4 transition hover:border-emas/50 hover:bg-ink-2">
                    <div className="flex items-center justify-between">
                      <span className="font-aksara text-base text-emas/70">{s.aksara_no}</span>
                      <Heat level={s.heat} />
                    </div>
                    <h3 className="mt-2 font-display text-lg text-cream transition group-hover:text-emas">{s.name}</h3>
                    <p className="mt-1 text-[0.8rem] leading-snug text-cream-dim">{s.note}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-6 text-sm text-cream-dim">
              Pilih satu, atau pilih semua —{" "}
              <a href="#reservasi" className="font-semibold text-emas underline-offset-4 hover:underline">
                gratis di setiap pesanan
              </a>
              .
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
