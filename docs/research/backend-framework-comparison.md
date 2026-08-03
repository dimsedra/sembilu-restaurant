# Backend Framework Comparison

A primary-source comparison of TypeScript backend frameworks for the Sembilu restaurant system.

## At a glance

| Feature | Hono | Express | Fastify | tRPC |
|---|---|---|---|---|
| **Description** | Small, simple, ultrafast web framework built on Web Standards | Fast, unopinionated, minimalist web framework for Node.js | Fast and low overhead web framework with powerful plugin architecture | End-to-end typesafe APIs made easy |
| **GitHub stars** | ~31,502 | ~69,264 | ~36,865 | ~40,469 |
| **npm weekly downloads** | ~52.8M | ~125.2M | ~10.4M | ~4.7M (@trpc/server) |
| **TypeScript support** | First-class | Via `@types/express` | First-class (typings built-in) | First-class (core feature) |
| **WebSocket / real-time** | Built-in WebSocket helper (CF Workers, Deno, Bun, Node.js) | None built-in (use `ws` / `socket.io` externally) | `@fastify/websocket` official plugin (ws@8) | Built-in subscriptions via WS or SSE, auto-reconnect |
| **Type sharing (FE/BE)** | RPC feature via `typeof` app | None (manual type sharing) | Type Providers (TypeBox, json-schema-to-ts) | End-to-end type safety, no code generation |
| **Validation** | Zod / Standard Schema via middleware | None built-in (use zod/joi in middleware) | JSON Schema (Ajv v8), custom validators | Zod (recommended), any Standard Schema |
| **Auth middleware** | Built-in JWT, Bearer, Basic auth | Via third-party middleware (passport, etc.) | Via plugins (`@fastify/jwt`, `@fastify/auth`) | Via middleware + context |
| **Ecosystem** | Large (edge runtimes, many adapters) | Largest (mature, vast middleware) | Large (297+ plugins, official ecosystem) | Adapters for Express, Fastify, Next.js, etc. |
| **Learning curve** | Low (familiar API, Web Standards) | Low (minimal API, huge community) | Medium (JSON Schema, plugin system) | Medium (requires monorepo, full-stack TS) |

---

## Hono

**What it is:** "Hono - means flame🔥 in Japanese - is a small, simple, and ultrafast web framework built on Web Standards. It works on any JavaScript runtime: Cloudflare Workers, Fastly Compute, Deno, Bun, Vercel, Netlify, AWS Lambda, Lambda@Edge, and Node.js." — [hono.dev](https://hono.dev)

**Key features relevant to restaurant ops:**

- **TypeScript support:** First-class. Written in TypeScript, full type inference.
- **WebSocket / real-time:** Built-in `upgradeWebSocket()` helper supporting Cloudflare Workers, Deno, Bun, and Node.js (via `@hono/node-server` + `ws`). Supports RPC-mode for typed WebSocket clients. — [hono.dev/docs/helpers/websocket](https://hono.dev/docs/helpers/websocket)
- **Auth middleware:** Built-in JWT, Bearer, Basic auth middleware. — [hono.dev/docs/middleware/builtin/jwt](https://hono.dev/docs/middleware/builtin/jwt)
- **Validation:** Manual validator, `@hono/zod-validator`, and Standard Schema validator (works with Zod, Valibot, ArkType). — [hono.dev/docs/guides/validation](https://hono.dev/docs/guides/validation)
- **CORS, CSRF, secure headers:** All built-in. — [hono.dev/docs/middleware/builtin/cors](https://hono.dev/docs/middleware/builtin/cors)
- **Type safety / FE-BE sharing:** RPC feature exports `typeof app` to the client via `hc()` — full type inference of inputs, outputs, and status codes. — [hono.dev/docs/guides/rpc](https://hono.dev/docs/guides/rpc)

**GitHub:** 31,502 stars, 1,195 forks — [github.com/honojs/hono](https://github.com/honojs/hono)
**npm:** 52,822,543 weekly downloads — [npmjs.com/package/hono](https://www.npmjs.com/package/hono)

**Learning curve:** Low. Familiar API (routing similar to Express), built on Web Standards (Request/Response), good documentation.

---

## Express

**What it is:** "Fast, unopinionated, minimalist web framework for Node.js" — [expressjs.com](https://expressjs.com)

**Key features relevant to restaurant ops:**

- **TypeScript support:** Via `@types/express`. Route params are inferred from path strings (Express 5.x). — [expressjs.com/en/5x/guide/routing](https://expressjs.com/en/5x/guide/routing)
- **WebSocket / real-time:** None built-in. Must use `ws` library or `socket.io` as a separate layer.
- **Auth middleware:** Extensive third-party ecosystem: `passport`, `express-session`, cookie-session, etc. — [expressjs.com/en/resources/middleware](https://expressjs.com/en/resources/middleware)
- **Validation:** None built-in. Use `joi`, `zod`, `express-validator` in custom middleware.
- **CORS:** `cors` middleware available. — [expressjs.com/en/resources/middleware/cors](https://expressjs.com/en/resources/middleware/cors)
- **Type safety / FE-BE sharing:** None. Types must be manually shared (e.g., via a shared types package).

**GitHub:** 69,264 stars, 24,399 forks — [github.com/expressjs/express](https://github.com/expressjs/express)
**npm:** 125,202,136 weekly downloads — [npmjs.com/package/express](https://www.npmjs.com/package/express)

**Learning curve:** Low. Minimal API, largest community, most tutorials. Well-known pattern.

---

## Fastify

**What it is:** "Fast and low overhead web framework, for Node.js. Highly focused on providing the best developer experience with the least overhead and a powerful plugin architecture." — [fastify.dev](https://fastify.dev)

**Key features relevant to restaurant ops:**

- **TypeScript support:** First-class typings built-in, generic type parameters for routes (Body, Querystring, Params, Headers, Reply). — [fastify.dev/docs/latest/Reference/TypeScript](https://fastify.dev/docs/latest/Reference/TypeScript/)
- **WebSocket / real-time:** Official `@fastify/websocket` plugin, built on `ws@8`. Supports hooks before WebSocket connection, error handling, and injectWS for testing. — [github.com/fastify/fastify-websocket](https://github.com/fastify/fastify-websocket)
- **Auth middleware:** Via plugins: `@fastify/jwt`, `@fastify/auth`, `@fastify/session`, `@fastify/cookie`.
- **Validation:** JSON Schema-based (Ajv v8), compiles schemas into performant functions. Supports custom validators (joi, yup). Type Providers for TypeBox, json-schema-to-ts, and Zod (third-party). — [fastify.dev/docs/latest/Reference/Validation-and-Serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)
- **CORS:** `@fastify/cors` plugin.
- **Type safety / FE-BE sharing:** Type Providers (`@fastify/type-provider-typebox`, `@fastify/type-provider-json-schema-to-ts`) connect JSON Schema types to TypeScript. Not as seamless as tRPC/Hono for cross-FE/BE sharing.
- **Performance:** Claims up to 30k req/s. — [fastify.dev](https://fastify.dev)

**GitHub:** 36,865 stars, 2,908 forks — [github.com/fastify/fastify](https://github.com/fastify/fastify)
**npm:** 10,433,256 weekly downloads — [npmjs.com/package/fastify](https://www.npmjs.com/package/fastify)

**Learning curve:** Medium. Plugin encapsulation model, JSON Schema knowledge helpful, but very well documented with 297+ plugins.

---

## tRPC

**What it is:** "Move Fast and Break Nothing. End-to-end typesafe APIs made easy." — tRPC allows building fully typesafe APIs without code generation or runtime bloat. It is not a standalone server — it runs inside an HTTP host (Express, Fastify, Next.js, standalone Node.js, etc.). — [trpc.io](https://trpc.io)

**Key features relevant to restaurant ops:**

- **TypeScript support:** Core feature. Types flow from server procedures to client automatically via TypeScript inference. No code generation. — [trpc.io/docs](https://trpc.io/docs)
- **WebSocket / real-time:** Built-in subscriptions via WebSocket (wsLink) or Server-sent Events (httpSubscriptionLink). Supports automatic reconnection with `tracked()` event IDs, heartbeat keep-alive, and graceful shutdown. — [trpc.io/docs/server/subscriptions](https://trpc.io/docs/server/subscriptions), [trpc.io/docs/server/websockets](https://trpc.io/docs/server/websockets)
- **Auth middleware:** Via tRPC middleware. Context function extracts user from request headers; middleware guards procedures. Supports `TRPCError` for typed error codes (UNAUTHORIZED, FORBIDDEN, etc.). — [trpc.io/docs/server/authorization](https://trpc.io/docs/server/authorization)
- **Validation:** Uses Zod (or any Standard Schema) for input/output validation on procedures. — [trpc.io/docs/server/validators](https://trpc.io/docs/server/validators)
- **CORS:** Relies on the underlying HTTP adapter (Express/Fastify/standalone).
- **Type safety / FE-BE sharing:** Maximum possible. Client imports `AppRouter` type and gets full autocomplete, parameter types, and response types. Refactoring server propagates type errors to client instantly. — [trpc.io/docs](https://trpc.io/docs)
- **Adapters:** Standalone Node.js, Express, Fastify, Next.js, AWS Lambda, Fetch (edge). — [trpc.io/docs/server/adapters](https://trpc.io/docs/server/adapters)

**GitHub:** 40,469 stars, 1,647 forks — [github.com/trpc/trpc](https://github.com/trpc/trpc)
**npm:** 4,679,175 weekly downloads (@trpc/server) — [npmjs.com/package/@trpc/server](https://www.npmjs.com/package/@trpc/server)

**Learning curve:** Medium. Requires understanding of TypeScript generics, Zod, and a monorepo setup for best results. Documentation is excellent, and adapters make integration straightforward.
