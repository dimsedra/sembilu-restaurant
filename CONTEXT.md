# Sembilu — Domain Glossary

## Rendering strategy

The site is a **client-side SPA** built with Vite + React 19. No SSR/SSG framework (no Next.js). SEO needs are minimal (restaurant site), and the existing setup is proven.

## Design philosophy

### Brand-first design
Every design choice must enhance the brand positioning, vibe, and how the brand wants to be perceived. The brand is the lens through which all decisions are filtered.

### Second-idea rule
The first idea is the happy path / solution of least resistance. The real solution starts from the 2nd or 3rd idea, not the 1st.

### Opinionated
Design must feel unique to this brand only — nothing else in the world should look like it belongs here.

### Form–function balance
Function is never sacrificed for form. The design strikes a careful balance between beauty and usability.

### Low cognitive load
Clean layouts with generous whitespace. Information is not packed densely. Each piece of content gets room to breathe so the audience actually pays attention.

### Breathable spacing
Sizing and hierarchy direct the user's attention. One piece of information at a time, presented with proper spatial relationships.

### Curated flow
Spacing designs the user journey — guiding the user through one piece of information at a time in a deliberate, curated sequence.

### First-impression stickiness
The first few seconds decide the lens through which the user perceives the brand. The opening must be incredibly sticky and implicitly opinionated to set the right context.

### Design moat
Use WebGL or other front-end libraries to create brand-opinionated differentiation that cannot be easily replicated.

## Audiences

The system serves two distinct audiences from the same project:

- **Customer-facing** — the public website: menu browsing, ordering, table reservation, live food tracking. This is what the current homepage mockup represents.
- **Staff-facing** — the internal operations system: incoming reservations, table orders, kitchen display system (KDS), order status management. Used by waiters, chefs, and managers.

Both share the same database and real-time data. The staff side is not a separate project — it's the same codebase with different routes and an auth gate.

## Routing

Customer routes (no auth required):
- `/` — landing/marketing page (current homepage with scroll sections)
- `/menu` — full menu browsing
- `/reserve` — reservation flow
- `/order` — ordering flow
- `/track/:orderId` — live food monitoring

Staff routes (auth required):
- `/staff` — dashboard overview
- `/staff/orders` — incoming orders, status management
- `/staff/kitchen` — kitchen display (what to cook, what's done)
- `/staff/reservations` — reservation calendar

## Backend

Custom TypeScript backend using **Express** (chosen deliberately for learning over Hono/Fastify/tRPC). Database access via **knex** query builder. No BaaS or serverless.

## Staff Authentication

Staff members (waiters, chefs, managers) authenticate via `POST /api/staff/login` with email and password. Passwords are hashed using `bcryptjs`. On successful login, the server returns a stateless JSON Web Token (JWT) signed with `JWT_SECRET`. The token payload contains `{ staff_id, role, branch_id }` and expires after 8 hours. Protected staff endpoints (`/api/staff/*`) require an `Authorization: Bearer <token>` header, verified by Express auth middleware.

## Kitchen Display System (KDS)


A real-time screen in the kitchen showing incoming orders grouped by table. Chefs mark items as "cooking" → "done." Status changes push instantly to the waiter's view. This is the core of the "live food monitoring" feature — it's for both the customer (tracking their order) and the kitchen (managing the queue).

## Design system reference

The mockup homepage is the source of truth for the design system:
- **Palette**: "Candlelit Heirloom" — ink (#14110d), ink-2 (#1b1610), ink-3 (#241c13), line (#392c1e), cream (#f4ead3), cream-dim (#cbbf9c), emas (#c9a24b), emas-bright (#e7c57a), bata (#b84a30), bata-deep (#8a2e1f), muted (#a48f6e)
- **Typography**: Fraunces (display serif), Manrope (body sans), Noto Sans Javanese (aksara script)
- **Atmosphere**: Film grain overlay, ember particles, kawung batik medallions, scroll-reveal animations, slow decorative motion
- **Tone**: "Bukan fusion. Bukan usang. Hanya Jawa." — proud, traditional, anti-trend
