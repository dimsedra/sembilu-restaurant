import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/utils/cn";

/* Scroll-triggered reveal */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", seen && "in", className)}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/* Kawung batik medallion — four-petal flower, stroked in currentColor */
export function Kawung({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="58" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
      <circle cx="60" cy="34" r="27" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="60" cy="86" r="27" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="34" cy="60" r="27" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="86" cy="60" r="27" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="60" cy="60" r="6.5" fill="currentColor" />
    </svg>
  );
}

/* Ornamental divider: thin rule with a centered diamond */
export function Divider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-4 text-emas", className)}>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-emas/50 sm:w-28" />
      <span className="h-1.5 w-1.5 rotate-45 bg-emas" />
      <span className="h-2.5 w-2.5 rotate-45 border border-emas" />
      <span className="h-1.5 w-1.5 rotate-45 bg-emas" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-emas/50 sm:w-28" />
    </div>
  );
}

/* Consistent section heading: aksara numeral + kicker + display title */
export function SectionHeading({
  numeral,
  kicker,
  title,
  intro,
  align = "left",
}: {
  numeral: string;
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    <div className={cn(centered && "text-center")}>
      <div
        className={cn(
          "flex items-center gap-3 text-emas",
          centered && "justify-center"
        )}
      >
        <span className="font-aksara text-2xl leading-none">{numeral}</span>
        <span className="h-px w-7 bg-emas/50" />
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.42em] text-cream-dim">
          {kicker}
        </span>
      </div>
      <h2 className="mt-6 font-display text-4xl leading-[1.04] tracking-[-0.01em] sm:text-5xl md:text-6xl">
        {title}
      </h2>
      {intro && (
        <p
          className={cn(
            "mt-6 text-base leading-relaxed text-cream-dim/90 sm:text-lg",
            centered ? "mx-auto max-w-2xl" : "max-w-2xl"
          )}
        >
          {intro}
        </p>
      )}
    </div>
  );
}
