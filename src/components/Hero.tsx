import heroImg from "@/assets/hero.jpg";
import { AKSARA } from "@/data";
import { EmberCanvas } from "@/components/EmberCanvas";
import { Kawung } from "@/components/primitives";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden"
    >
      {/* Background image */}
      <img
        src={heroImg}
        alt="Hidangan Jaya SEMBILU: cobek sambal, ikan bakar, nasi, dan emping di bawah cahaya lilin"
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      {/* Overlays for legibility + mood */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-ink/40" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 80% 20%, transparent 30%, rgba(20,17,13,0.55) 100%)",
        }}
      />

      {/* Embers */}
      <EmberCanvas className="absolute inset-0 h-full w-full" />

      {/* Giant aksara watermark */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none font-aksara leading-none text-cream/[0.04]"
        style={{ fontSize: "42vw" }}
      >
        {AKSARA}
      </span>

      {/* Corner Kawung medallions */}
      <Kawung className="spin-slow pointer-events-none absolute -right-24 -top-24 h-80 w-80 text-emas/10" />
      <Kawung className="spin-rev pointer-events-none absolute -bottom-32 -left-28 h-72 w-72 text-emas/[0.06]" />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-cream-dim">
            <span className="font-aksara text-base text-emas">{AKSARA}</span>
            <span className="h-3 w-px bg-emas/40" />
            <span>Sajian Jawa</span>
            <span className="h-1 w-1 rounded-full bg-emas/60" />
            <span>Tegal</span>
            <span className="h-1 w-1 rounded-full bg-emas/60" />
            <span>Sejak 1987</span>
          </div>

          <h1 className="mt-7 font-display leading-[0.95] tracking-[-0.02em]">
            <span className="block text-cream/70 italic text-4xl sm:text-6xl lg:text-7xl">
              Bukan fusion.
            </span>
            <span className="block text-cream/70 italic text-4xl sm:text-6xl lg:text-7xl">
              Bukan usang.
            </span>
            <span className="text-gold mt-2 block text-6xl not-italic sm:text-8xl lg:text-[7.5rem]">
              Hanya Jawa.
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base leading-relaxed text-cream-dim sm:text-lg">
            SEMBILU merayakan masakan rumah Pantura Tegal — sambal yang
            ditumbuk pagi hari di atas cobek batu, ikan segar dari pesisir, dan
            resep yang menolak dilupakan.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#reservasi"
              className="group inline-flex items-center gap-2 rounded-full bg-emas px-7 py-3.5 text-sm font-semibold text-ink transition hover:bg-emas-bright"
            >
              Reservasi Meja
              <span className="transition group-hover:translate-x-0.5">→</span>
            </a>
            <a
              href="#sajian"
              className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-7 py-3.5 text-sm font-semibold text-cream transition hover:border-emas hover:text-emas"
            >
              Lihat Sajian
            </a>
          </div>

          <div className="mt-10 flex items-center gap-3 text-xs text-cream-dim">
            <span className="text-base text-emas">★★★★★</span>
            <span>4,9 dari 2.300+ tamu</span>
            <span className="h-3 w-px bg-line" />
            <span>9 sambal ditumbuk tiap pagi</span>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#kisah"
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-cream-dim transition hover:text-emas sm:flex"
      >
        <span className="text-[0.65rem] uppercase tracking-[0.3em]">Gulir</span>
        <span className="relative h-10 w-px overflow-hidden bg-line">
          <span className="scroll-line absolute left-0 top-0 h-4 w-px bg-emas" />
        </span>
      </a>
    </section>
  );
}
