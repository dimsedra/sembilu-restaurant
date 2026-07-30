import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AKSARA } from "@/data"
import { cn } from "@/utils/cn"
import { Nav } from "@/components/Nav"
import { Hero } from "@/components/Hero"
import { Story } from "@/components/Story"
import { Menu } from "@/components/Menu"
import { Sambal } from "@/components/Sambal"
import { Locations } from "@/components/Locations"
import { Reserve } from "@/components/Reserve"
import { Footer } from "@/components/Footer"
import { MenuPage } from "@/pages/MenuPage"

function MarqueeBand() {
  const items = [
    AKSARA,
    "Sajian Jawa",
    "Tegal · sejak 1987",
    "Sembilan sambal",
    "Bukan fusion",
    "Hanya Jawa",
  ]
  const Row = () => (
    <div className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <span key={i} className="flex items-center">
          <span
            className={cn(
              "px-6",
              i === 0
                ? "font-aksara text-lg text-emas"
                : "text-sm uppercase tracking-[0.3em] text-cream-dim"
            )}
          >
            {it}
          </span>
          <span className="text-emas/40">✦</span>
        </span>
      ))}
    </div>
  )
  return (
    <div className="overflow-hidden border-y border-line bg-ink-2/60 py-4">
      <div className="marquee-track">
        <Row />
        <Row />
      </div>
    </div>
  )
}

function HomePage() {
  return (
    <div className="grain relative min-h-screen bg-ink">
      <Nav />
      <main>
        <Hero />
        <MarqueeBand />
        <Story />
        <Menu />
        <Sambal />
        <Locations />
        <Reserve />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
      </Routes>
    </BrowserRouter>
  )
}
