# Homepage Order CTAs & Navigation Entry Points Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add prominent, brand-aligned entry points and call-to-action buttons for the `/order` flow across the Navbar, Hero, Menu section, and Menu page.

**Architecture:**
- Update [`src/data.ts`](file:///d:/Project%20Hub/sembilu-restaurant/src/data.ts) to include `"Pesan"` in the main navigation links.
- Update [`src/components/Nav.tsx`](file:///d:/Project%20Hub/sembilu-restaurant/src/components/Nav.tsx) with a `"Pesan Online"` button alongside `"Reservasi"` in both desktop and mobile views.
- Update [`src/components/Hero.tsx`](file:///d:/Project%20Hub/sembilu-restaurant/src/components/Hero.tsx) to feature a primary `"Pesan Makanan →"` button linking to `/order`.
- Update [`src/components/Menu.tsx`](file:///d:/Project%20Hub/sembilu-restaurant/src/components/Menu.tsx) to redirect `"Pesan hidangan ini →"` to `/order` and add order buttons.
- Update [`src/pages/MenuPage.tsx`](file:///d:/Project%20Hub/sembilu-restaurant/src/pages/MenuPage.tsx) so menu browsers can click to order.

**Tech Stack:** React 19, TypeScript, React Router, Tailwind CSS.

**Spec / Reference:**
- Issue #15: `Customer order flow has no entry point or CTA buttons on the public homepage`
- [`CONTEXT.md`](file:///d:/Project%20Hub/sembilu-restaurant/CONTEXT.md)

## Global Constraints

- Preserve Sembilu "Candlelit Heirloom" visual styling and hierarchy.
- Seamless navigation using standard React Router links (`/order`) and anchor jumps.
- Verify 0 TypeScript errors and clean production build.

---

### Task 1: Add Order CTAs to Navbar & Hero Section

**Files:**
- Modify: `src/data.ts:4-10`
- Modify: `src/components/Nav.tsx`
- Modify: `src/components/Hero.tsx`

**Interfaces:**
- Produces: Navigation links and CTA buttons pointing to `/order`

- [ ] **Step 1: Update `src/data.ts` and `src/components/Nav.tsx`**
  - Add `{ label: "Pesan", href: "/order" }` to `nav`.
  - In `Nav.tsx`, add a `"Pesan Online"` button (styled with gold border/fill) next to `"Reservasi Meja"`.
  - In mobile menu drawer, include `"Pesan Online"` CTA button.

- [ ] **Step 2: Update `src/components/Hero.tsx`**
  - Update hero action buttons:
    - Primary: `"Pesan Sekarang →"` linking to `/order`
    - Secondary: `"Reservasi Meja"` linking to `#reservasi`
    - Tertiary / link: `"Lihat Sajian"` linking to `#sajian`

- [ ] **Step 3: Verify TypeScript and build**
Run: `npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add src/data.ts src/components/Nav.tsx src/components/Hero.tsx
git commit -m "feat(ui): add Pesan Online buttons to Navbar and Hero section"
```

---

### Task 2: Connect Menu Section and MenuPage to `/order`

**Files:**
- Modify: `src/components/Menu.tsx`
- Modify: `src/pages/MenuPage.tsx`

**Interfaces:**
- Produces: Direct order action buttons on signature and full menu dish cards

- [ ] **Step 1: Update `src/components/Menu.tsx`**
  - Change `"Pesan hidangan ini →"` link to `href="/order"`.
  - Add a `"Mulai Pesanan Online →"` CTA button in the menu section footer alongside `"Lihat menu lengkap →"`.

- [ ] **Step 2: Update `src/pages/MenuPage.tsx`**
  - Add a sticky or prominent `"Pesan Menu Online →"` CTA button and order links for dish items on the full menu page.

- [ ] **Step 3: Verify TypeScript and build**
Run: `npx tsc --noEmit && npm run build && npx vitest run`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add src/components/Menu.tsx src/pages/MenuPage.tsx
git commit -m "feat(ui): connect menu sections and MenuPage to order flow"
```

---

## Verification Plan

### Automated Tests & Typecheck
1. Type check: `npx tsc --noEmit`
2. Build verification: `npm run build`
3. Backend test suite: `npx vitest run`

### Manual Verification
1. Open `http://localhost:5173`.
2. Verify "Pesan Online" in Navbar links to `/order`.
3. Verify "Pesan Sekarang" in Hero links to `/order`.
4. Verify "Pesan hidangan ini" in Menu section links to `/order`.
