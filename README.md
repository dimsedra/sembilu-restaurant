# Sembilu Restaurant Operating System

Sembilu is a full-stack restaurant operating system designed for a high-concept traditional Javanese dining establishment. The system unifies front-of-house guest interactions (menu discovery, table reservations, digital ordering, and live status tracking) with back-of-house operations (kitchen display systems, order lifecycle management, and table seating).

---

## 1. Project Context and Philosophy

### Culinary and Brand Philosophy
The restaurant operates under the brand identity: *"Bukan fusion. Bukan usang. Hanya Jawa."* It emphasizes authentic Javanese recipes, heritage ingredients, and nine distinct regional sambal varieties rather than modern fusion adaptations.

### Visual Design System ("Candlelit Heirloom")
The user interface follows an opinionated design system:
- **Palette**: Dark ink backgrounds (`#14110d`, `#1b1610`), warm cream typography (`#f4ead3`, `#cbbf9c`), antique gold accents (`#c9a24b`), and terracotta highlights (`#b84a30`).
- **Typography**: Fraunces (display serif), Manrope (functional body sans), and Noto Sans Javanese (Aksara script).
- **Atmosphere**: Canvas grain textures, animated ember particles, and breathable spacing designed for low cognitive load.
- **Iconography**: Custom, scalable SVG iconography with zero dependency on platform-specific emojis.

---

## 2. System Architecture

The project is structured as a single monorepo housing both customer-facing and staff-facing interfaces, backed by a unified Express API and PostgreSQL database.

```
+-------------------------------------------------------------------------+
|                        Client Layer (React 19 SPA)                      |
|                                                                         |
|  [ Customer Realm ]                                 [ Staff Realm ]     |
|  - Home & Story (/)                                 - KDS Tablet        |
|  - Full Menu (/menu)                                  (/staff/kitchen)  |
|  - Table Order Flow (/order)                        - POS & Billing     |
|  - Live Order Tracker (/track/:orderId)             - QR Generator      |
|  - Reservations (/reserve)                          - Table Management  |
+------------------------------------+------------------------------------+
                                     | REST & WebSocket
                                     v
+-------------------------------------------------------------------------+
|                        Backend Layer (Express 5 TS)                     |
|                                                                         |
|  - REST Endpoints (/api/dishes, /api/orders, /api/staff/*)              |
|  - Role-based JWT Auth Middleware (Waiter, Chef, Manager)                |
|  - Reservation-Table Conflict & Grace Period Validator                  |
|  - Native WebSocket Broadcast Engine (ws)                               |
+------------------------------------+------------------------------------+
                                     | Knex.js Query Builder
                                     v
+-------------------------------------------------------------------------+
|                        Database Layer (PostgreSQL)                      |
|                                                                         |
|  - branches, tables, dishes, sambals                                    |
|  - customers, reservations, orders, order_items, staff                  |
+-------------------------------------------------------------------------+
```

### Core Architectural Decisions
- **Client SPA**: React 19 + Vite + Tailwind CSS v4. Clean client-side rendering with instant transitions between views.
- **Custom Express Backend**: Express 5 with TypeScript and Knex.js query builder, maintaining explicit schema control, transactional integrity, and custom migration pipelines.
- **Real-Time Reactive Event Loop**: A native WebSocket server (`ws`) runs alongside the HTTP server on the same port, broadcasting order creation and status changes instantly to connected clients without polling overhead.
- **Multi-Branch Data Isolation**: Staff accounts and operational queries are scoped to their respective branch (`branch_id`), with managerial override capabilities for multi-branch monitoring.

---

## 3. Key Features

### Implemented Features

#### Customer-Facing
- **Homepage and Storytelling (`/`)**: Brand storytelling, interactive menu previews, sambal heat spectrum, location selector, and table booking triggers.
- **Menu Catalog (`/menu`)**: Categorized food and beverage listings with detailed spice notes and pricing.
- **Table Ordering Flow (`/order`)**: Branch and table selection with automated table validation. Supports item customizations, notes, and specific sambal selections.
- **Walk-in vs. Reserved Table Validation**: Orders placed at reserved tables (Tables 10-12) are verified against active confirmed reservations for the customer's phone number within a buffered time window (+/- 15 minutes). Walk-in tables (Tables 1-9) remain freely accessible.
- **Live Food Tracker (`/track/:orderId`)**: Real-time progress timeline (`pending` -> `cooking` -> `done` -> `served`) synchronized over WebSocket.

#### Staff and Kitchen Operations
- **Staff Authentication (`POST /api/staff/login`)**: Secure password hashing with bcrypt, stateless JWT issuance, and role-based permissions (`waiter`, `chef`, `manager`).
- **Kitchen Display System (`/staff/kitchen` and `/staff/kds`)**:
  - **Digital Ticket Rail**: Multi-order responsive grid showing active table tickets side-by-side in FIFO order.
  - **"All-Day" Batch Cooking Aggregator**: Live header summary aggregating total pending and cooking dish quantities across all active tickets (e.g., "5x Bebek Goreng Sembilu") with single-tap filtering.
  - **Single-Tap Progression**: Item-level status transitions from pending to cooking and done.
  - **Synthesized Audio Alert**: Dual-tone brass chime synthesized directly via the Web Audio API on new order arrival (with mute control).
  - **Elapsed Urgency Timer**: Live counters that visually shift color based on wait duration (<10m gold, 10-20m amber, >20m red).
  - **Quick Kitchen Access**: 1-click preset authentication modal for tablet environments.
- **Table and Reservation Management APIs**: Endpoints for managing table availability, booking schedules, and guest check-ins.

### Roadmap and Planned Modules
- **Table QR Code Stand Generator (`/staff/qr`)**: Printable table stand generator with encoded branch and table URLs (Issue #17).
- **Cashier POS and Settlement (`/staff/pos`)**: Bill calculation, payment processing, and order finalization (Issue #18).
- **Advance Food Pre-Ordering**: Optional pre-selection of dishes during the reservation booking step (Issue #19).

---

## 4. Technology Stack

### Frontend
- React 19
- TypeScript
- Vite 8
- Tailwind CSS v4
- React Router v7
- Web Audio API (native synthesized audio)

### Backend
- Node.js (v20+)
- Express 5
- TypeScript / tsx
- Knex.js
- PostgreSQL
- `ws` (native WebSocket implementation)
- `jsonwebtoken` & `bcryptjs`

### Testing and Tooling
- Vitest 4
- Supertest 7
- Testing Library (React)

---

## 5. Local Setup and Installation

### Prerequisites
- Node.js (version 20 or higher recommended)
- npm (version 10 or higher)
- PostgreSQL (version 15 or higher running locally or via Docker)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dimsedra/sembilu-restaurant.git
   cd sembilu-restaurant
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the project root:
   ```env
   PORT=3001
   DATABASE_URL=postgres://postgres:password@localhost:5432/sembilu
   JWT_SECRET=your-development-jwt-secret
   ```

4. **Initialize the database:**
   Ensure PostgreSQL is running and the database `sembilu` exists:
   ```bash
   # Run Knex schema migrations
   npm run migrate
   ```

5. **Start the development environment:**
   ```bash
   npm run dev
   ```
   This command concurrently launches:
   - Client development server on `http://localhost:5173`
   - Express API and WebSocket server on `http://localhost:3001`

---

## 6. Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both client (Vite) and backend (tsx watch) concurrently |
| `npm run dev:client` | Runs the Vite frontend development server |
| `npm run dev:server` | Runs the Express backend server with hot-reload via tsx |
| `npm run migrate` | Executes all pending Knex database migrations |
| `npm test` | Runs the Vitest test suite |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run build` | Compiles TypeScript and builds the production frontend bundle |
| `npm run preview` | Previews the production build locally |

---

## 7. Default Accounts and Branch Data

### Restaurant Branches
- **Branch 1**: Tegal (Alun-Alun Tegal, Jl. Pancasila No. 12)
- **Branch 2**: Solo (Jl. Slamet Riyadi No. 88)
- **Branch 3**: Yogyakarta (Jl. Malioboro No. 45)

### Pre-configured Staff Accounts
Default test password for all accounts is `password123`:

| Role | Name | Email | Branch |
| :--- | :--- | :--- | :--- |
| Chef | Budi | `budi@sembilu.com` | Tegal (Branch 1) |
| Waiter | Wati | `wati@sembilu.com` | Tegal (Branch 1) |
| Manager | Teguh | `teguh@sembilu.com` | Tegal (Branch 1) |

---

## 8. Directory Structure

```
sembilu-restaurant/
|-- docs/
|   |-- adr/                    # Architecture Decision Records
|   |-- agents/                 # Domain models and triage rules
|   +-- superpowers/plans/      # Feature implementation specs and plans
|-- server/
|   |-- migrations/             # Knex schema migrations
|   |-- routes/                 # Express route handlers and route tests
|   |-- seeds/                  # Baseline seed datasets
|   |-- db.ts                   # Knex database connection
|   |-- index.ts                # Server entry point
|   +-- websocket.ts            # WebSocket server and event broadcasting
|-- src/
|   |-- assets/                 # Brand assets and graphics
|   |-- components/             # Reusable UI components
|   |   +-- staff/              # KDS and staff-specific components & SVG icons
|   |-- pages/                  # Top-level view routes (Menu, Order, Track, KDS)
|   |-- utils/                  # Shared utilities (auth, formatting, audio)
|   |-- App.tsx                 # Route declarations
|   +-- main.tsx                # Application entry point
|-- package.json
|-- tsconfig.json
+-- vite.config.ts
```

---

## 9. License

This project is open source and available under the [MIT License](LICENSE).
