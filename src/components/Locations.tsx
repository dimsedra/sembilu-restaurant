import interiorImg from "@/assets/interior.jpg";
import { locations } from "@/data";
import { cn } from "@/utils/cn";
import { Reveal, SectionHeading } from "@/components/primitives";

export function Locations() {
  return (
    <section
      id="lokasi"
      className="relative scroll-mt-24 border-t border-line/60 bg-ink-2/40 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            numeral="꧔"
            kicker="Lokasi"
            title={
              <>
                Ruang yang hangat,{" "}
                <span className="text-gold">cahaya yang temaram.</span>
              </>
            }
            intro="Dari rumah pertama di Tegal hingga meja di ibu kota — suasana yang sama, sambal yang sama."
          />
        </Reveal>

        {/* Ambiance banner */}
        <Reveal delay={80}>
          <div className="mt-12 overflow-hidden rounded-[2rem] border border-line">
            <div className="relative">
              <img
                src={interiorImg}
                alt="Interior restoran SEMBILU dengan cahaya temaram dan kayu jati"
                className="h-56 w-full object-cover sm:h-72"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
              <p className="absolute bottom-5 left-6 max-w-sm font-display text-xl italic text-cream sm:text-2xl">
                “Masuk, duduk, dan biarkan cobek berputar.”
              </p>
            </div>
          </div>
        </Reveal>

        {/* Location cards */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {locations.map((loc, i) => (
            <Reveal key={loc.city} delay={i * 70}>
              <div className="group flex h-full flex-col justify-between rounded-2xl border border-line bg-ink p-7 transition hover:border-emas/40">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-aksara text-base text-emas/70">
                        {loc.no}
                      </span>
                      <h3 className="mt-1 font-display text-3xl text-cream">
                        SEMBILU <span className="text-gold">{loc.city}</span>
                      </h3>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider",
                        loc.open
                          ? "border-emerald-500/30 text-emerald-300/90"
                          : "border-amber-500/30 text-amber-300/90"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          loc.open ? "bg-emerald-400" : "bg-amber-400"
                        )}
                      />
                      {loc.open ? "Buka sekarang" : "Buka 11.00"}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-cream-dim">
                    {loc.address}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.15em] text-muted">
                    {loc.hours}
                  </p>
                </div>
                <a
                  href="#reservasi"
                  className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-emas transition group-hover:gap-3"
                >
                  Reservasi di sini →
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
