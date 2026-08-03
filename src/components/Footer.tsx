import { AKSARA, locations, nav } from "@/data";
import { Kawung } from "@/components/primitives";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink-2/40">
      <Kawung className="spin-rev pointer-events-none absolute -left-32 -top-24 h-80 w-80 text-emas/[0.05]" />

      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex flex-col leading-none">
              <span className="font-aksara text-sm text-emas">{AKSARA}</span>
              <span className="font-display text-2xl tracking-[0.3em] text-cream">
                SEMBILU
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream-dim">
              Masakan Jawa dari Tegal — sambal yang ditumbuk setiap pagi, dan
              resep yang menolak dilupakan.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Instagram", "TikTok", "WhatsApp"].map((s) => (
                <a
                  key={s}
                  href="#top"
                  className="rounded-full border border-line px-4 py-2 text-xs font-medium text-cream-dim transition hover:border-emas hover:text-emas"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Jelajah */}
          <div>
            <h4 className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-emas">
              Jelajah
            </h4>
            <ul className="mt-4 space-y-2.5">
              {nav.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    className="text-sm text-cream-dim transition hover:text-cream"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#reservasi"
                  className="text-sm text-cream-dim transition hover:text-cream"
                >
                  Reservasi
                </a>
              </li>
            </ul>
          </div>

          {/* Kunjungi */}
          <div>
            <h4 className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-emas">
              Kunjungi
            </h4>
            <ul className="mt-4 space-y-2.5">
              {locations.map((l) => (
                <li key={l.city}>
                  <a
                    href="#lokasi"
                    className="text-sm text-cream-dim transition hover:text-cream"
                  >
                    SEMBILU {l.city}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h4 className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-emas">
              Kontak
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-cream-dim">
              <li>
                <a href="tel:+62283000000" className="transition hover:text-cream">
                  (0283) 000-000
                </a>
              </li>
              <li>
                <a
                  href="mailto:halo@sembilu.id"
                  className="transition hover:text-cream"
                >
                  halo@sembilu.id
                </a>
              </li>
              <li className="pt-1 leading-relaxed">
                Setiap hari
                <br />
                10.00 – 23.00 WIB
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SEMBILU · Jl. Jenderal Sudirman No. 17, Tegal, Jawa Tengah.</p>
          <p className="font-aksara text-sm text-emas/70">
            {AKSARA} · Bukan fusion. Bukan usang. Hanya Jawa.
          </p>
        </div>
      </div>
    </footer>
  );
}
