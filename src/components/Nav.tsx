import { useEffect, useState } from "react";
import { AKSARA, nav } from "@/data";
import { cn } from "@/utils/cn";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-line/80 bg-ink/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#top" className="group flex flex-col leading-none">
          <span className="font-aksara text-[0.62rem] tracking-wide text-emas/70 transition group-hover:text-emas">
            {AKSARA}
          </span>
          <span className="font-display text-xl tracking-[0.34em] text-cream">
            SEMBILU
          </span>
        </a>

        <div className="hidden items-center gap-9 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative text-sm font-medium text-cream-dim transition hover:text-cream"
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-emas transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#reservasi"
            className="hidden rounded-full bg-emas px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-emas-bright sm:inline-flex"
          >
            Reservasi
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Buka menu"
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-cream md:hidden"
          >
            <span className="relative block h-3 w-5">
              <span
                className={cn(
                  "absolute left-0 h-0.5 w-5 bg-current transition-all duration-300",
                  open ? "top-1.5 rotate-45" : "top-0"
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-1.5 h-0.5 w-5 bg-current transition-all duration-300",
                  open ? "opacity-0" : "opacity-100"
                )}
              />
              <span
                className={cn(
                  "absolute left-0 h-0.5 w-5 bg-current transition-all duration-300",
                  open ? "top-1.5 -rotate-45" : "top-3"
                )}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile panel */}
      <div
        className={cn(
          "overflow-hidden border-t border-line/70 bg-ink/95 backdrop-blur-md transition-all duration-500 md:hidden",
          open ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="flex flex-col gap-1 px-5 py-4">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-line/50 py-3 text-cream-dim"
            >
              <span className="font-display text-lg">{item.label}</span>
              <span className="text-emas">→</span>
            </a>
          ))}
          <a
            href="#reservasi"
            onClick={() => setOpen(false)}
            className="mt-3 rounded-full bg-emas px-5 py-3 text-center text-sm font-semibold text-ink"
          >
            Reservasi Meja
          </a>
        </div>
      </div>
    </header>
  );
}
