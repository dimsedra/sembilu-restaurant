# Mission: Zustand for State Management

## Why

You're building Sembilu — a restaurant website with reservation, ordering, and live food monitoring. The homepage mockup uses local React state, but the full app will need shared state (cart, reservation form, order tracking). You want to know whether Zustand is a better fit than React Context + useReducer, and if so, how to use it effectively.

## Success looks like

- Understand and build a full backend for Sembilu: Express, PostgreSQL, WebSocket, auth
- Design a database schema that handles orders, reservations, menu items, and branches
- Build a real-time KDS so the kitchen and waiters stay in sync
- Understand how each piece works, not just how to use it

## Constraints

- Short sessions — focused, practical lessons tied directly to the project
- No abstract theory — every concept must map to something in Sembilu
- Prefer Express (explicit, teaches more) over batteries-included frameworks

## Out of scope

- Serverless or BaaS (Supabase, Firebase, etc.)
- ORMs like Prisma — will use raw SQL or a thin query builder to learn SQL properly
- Deployment and DevOps (at least for now)
