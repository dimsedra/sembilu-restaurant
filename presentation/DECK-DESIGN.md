# Deck Design Specifications

## 1. Aesthetic Profile
- **Theme**: Candlelit Heirloom (Warisan Tradisi & Modern Tech Execution)
- **Mood / Tone**: Warm, authoritative, authentic Javanese culinary heritage paired with sleek, high-precision engineering and executive clarity.
- **Aspect Ratio**: 16:9 Full-Bleed (100vw x 100vh / 16in x 9in Print)

---

## 2. Design Tokens (:root)

```css
:root {
  /* Background Layers */
  --bg-primary: #14110d;
  --bg-surface: #1b1610;
  --bg-surface-elevated: #241c13;
  --bg-overlay: rgba(20, 17, 13, 0.85);

  /* Borders & Dividers */
  --border-color: #392c1e;
  --border-subtle: rgba(201, 162, 75, 0.15);
  --border-focus: #c9a24b;

  /* Typography Colors */
  --text-primary: #f4ead3;
  --text-secondary: #cbbf9c;
  --text-muted: #a48f6e;

  /* Accent & Brand Colors */
  --accent-gold: #c9a24b;
  --accent-gold-bright: #e7c57a;
  --accent-gold-glow: rgba(201, 162, 75, 0.25);
  --accent-bata: #b84a30;
  --accent-bata-deep: #8a2e1f;
  --accent-bata-glow: rgba(184, 74, 48, 0.25);

  /* Status Colors */
  --color-success: #4ea872;
  --color-warning: #e7c57a;
  --color-danger: #b84a30;

  /* Elevation Shadows & Glows */
  --shadow-card: 0 12px 32px -8px rgba(0, 0, 0, 0.6);
  --glow-gold: 0 0 24px rgba(201, 162, 75, 0.18);
  --glow-bata: 0 0 24px rgba(184, 74, 48, 0.18);
}
```

---

## 3. Typography Specifications

- **Display & Headings**: `'Fraunces'`, Georgia, serif (Weights: 400, 600, 700; Optical sizes: 9..144)
- **Body & Metrics**: `'Manrope'`, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif (Weights: 400, 500, 600, 700)
- **Code & Monospace**: `'JetBrains Mono'`, 'Fira Code', 'Courier New', monospace
- **Google Fonts Import URL**:
  `https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap`

---

## 4. Full-Bleed Layout Invariants

- Viewport fits `100vw` by `100vh` edge-to-edge.
- Zero outer margin, zero border-radius on slide root `<section class="slide">`.
- Internal content breathing room managed through `.slide-content` padding (`3.5rem 5rem`).
