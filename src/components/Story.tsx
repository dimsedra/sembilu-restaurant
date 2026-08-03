import storyImg from "@/assets/story.jpg";
import { AKSARA, stats } from "@/data";
import { Kawung, Reveal, SectionHeading } from "@/components/primitives";

export function Story() {
  return (
    <section id="kisah" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        {/* Image */}
        <Reveal className="order-2 lg:order-1">
          <div className="relative">
            <div className="absolute -inset-3 -z-10 rounded-[2.5rem] bg-gradient-to-br from-emas/15 to-transparent" />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-line">
              <img
                src={storyImg}
                alt="Tangan menumbuk sambal di atas cobek batu di dapur Jawa yang hangat"
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
            </div>
            <div className="absolute -right-4 -top-4 flex h-20 w-20 items-center justify-center rounded-full border border-emas/40 bg-ink/80 backdrop-blur">
              <Kawung className="spin-slow h-12 w-12 text-emas" />
            </div>
            <span className="absolute bottom-5 left-5 rounded-full border border-emas/30 bg-ink/70 px-4 py-2 font-aksara text-sm text-emas backdrop-blur">
              {AKSARA} · Est. 1987
            </span>
          </div>
        </Reveal>

        {/* Text */}
        <Reveal className="order-1 lg:order-2" delay={120}>
          <SectionHeading
            numeral="꧑"
            kicker="Kisah"
            title={
              <>
                Dimulai dari sebuah warteg kecil di tepi{" "}
                <span className="text-gold">Pantura</span>.
              </>
            }
          />

          <div className="mt-7 space-y-5 text-base leading-relaxed text-cream-dim sm:text-lg">
            <p>
              Tahun 1987, di sebuah warung kecil di pinggir Pantura Tegal, sebuah
              cobek batu menumbuk sambal pertama SEMBILU. Empat dekade
              kemudian, cobek itu masih berputar — hanya saja kini di dapur yang
              lebih luas, untuk meja yang lebih ramai.
            </p>
            <p>
              Kami hadir di kota-kota besar, tetapi akarnya tetap di Tegal: di
              setiap piring, di setiap sambal, di setiap teguk.
            </p>
          </div>

          <blockquote className="mt-8 border-l-2 border-emas pl-5">
            <p className="font-display text-xl italic leading-snug text-cream sm:text-2xl">
              “Kami tahu godaannya — melunturkan rasa agar terlihat
              ‘modern’. Kami menolak. Nenek kami tidak akan memaafkan itu.”
            </p>
          </blockquote>

          <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-ink-2 px-5 py-6">
                <div className="font-display text-3xl text-gold sm:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1.5 text-[0.7rem] uppercase tracking-[0.18em] text-cream-dim">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
