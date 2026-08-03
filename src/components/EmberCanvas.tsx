import { useEffect, useRef } from "react";

/**
 * Generative ember / spice-dust field — evokes charcoal grill and
 * sambal warmth. Performance-capped, DPR-aware, and静止 under
 * prefers-reduced-motion.
 */
export function EmberCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let raf = 0;
    let particles: {
      x: number;
      y: number;
      r: number;
      vy: number;
      vx: number;
      a: number;
      tw: number;
      hue: number;
      phase: number;
    }[] = [];

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const make = (initial: boolean) => ({
      x: rand(0, width),
      y: initial ? rand(0, height) : height + rand(0, 60),
      r: rand(0.6, 2.3),
      vy: rand(-0.34, -0.07),
      vx: rand(-0.1, 0.1),
      a: rand(0.05, 0.5),
      tw: rand(0.004, 0.02),
      hue: rand(36, 47),
      phase: rand(0, Math.PI * 2),
    });

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(58, Math.floor((width * height) / 30000));
      particles = Array.from({ length: count }, () => make(true));
    };

    let t = 0;
    const step = () => {
      t += 1;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y += p.vy;
        p.x += p.vx + Math.sin(t * 0.01 + p.phase + p.y * 0.02) * 0.18;
        const flick = 0.5 + 0.5 * Math.sin(t * p.tw + p.phase);
        const alpha = p.a * flick;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, ${58 + p.r * 4}%, ${alpha})`;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, ${alpha * 0.9})`;
        ctx.shadowBlur = 9;
        ctx.fill();
        if (p.y < -12 || p.x < -30 || p.x > width + 30) {
          Object.assign(p, make(false));
        }
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(step);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    if (reduced) {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 62%, ${p.a})`;
        ctx.fill();
      }
    } else {
      raf = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
}
