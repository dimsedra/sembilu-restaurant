# ADR-0002: Express as the backend framework

We chose **Express** over Hono, Fastify, and tRPC as the TypeScript backend framework.

**Context:** Hono had the best feature set for a restaurant ops system (built-in WebSocket, JWT, Zod, RPC). But the goal of this project is learning, not shipping fast. Express forces the developer to explicitly add and configure every piece (WebSocket, auth, validation) rather than getting them for free. This builds understanding of how each piece works.

**Considered options:** Hono (easier, but hides complexity), Fastify (JSON Schema learning overhead), tRPC (best type safety, but monorepo assumption).

**Consequence:** We'll add WebSocket via `ws` or `socket.io`, auth via `passport` or custom JWT middleware, and validation via `zod` — each as a deliberate learning step. The project will have more files and more explicit wiring, but every line will be understood.
