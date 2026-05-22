# LedgerPro

<sub>Supermarket POS, inventory, and accounting platform</sub>

> A modern full-stack point-of-sale and inventory platform for multi-branch supermarkets. Cashiers ring up sales, managers track stock and request inter-branch transfers, admins oversee everything across branches.

---

## Tech Stack

| Layer    | Technology                                                                                              |
|----------|---------------------------------------------------------------------------------------------------------|
| Frontend | React 19 · Vite 7 · TypeScript · Tailwind CSS 4 (`@theme` design tokens) · Geist + Geist Mono · Redux Toolkit · TanStack React Query · Recharts · socket.io-client · jsPDF · xlsx · react-hot-toast · lucide-react |
| Backend  | NestJS 11 · TypeORM · Passport JWT · bcrypt · socket.io · Nodemailer                                    |
| Database | PostgreSQL 16                                                                                           |
| DevOps   | Docker Compose · GitHub Actions · pnpm 10.33.2                                                          |

---

## Features

- **Multi-branch POS** — Cashiers process sales with barcode scanning, payment selection (Cash / Card / Mobile), and discount support.
- **Inventory Management** — Per-branch stock levels with category-specific low-stock thresholds and live status badges.
- **Inter-Branch Stock Transfers** ✨ — Managers request stock from other branches; admin reviews and approves with a per-branch surplus picker; source manager ships, destination manager receives. Stock moves transactionally with pessimistic locking. Every state transition is timestamped and attributed.
- **Admin Hub** — Consolidated *Branches* page with Overview, Manage, and Compare tabs. *Transfers* review queue with per-status filters.
- **Role-Based Access Control** — Three roles (Admin, Manager, Cashier) with route guards on both backend and frontend.
- **Real-Time Notifications** — Socket.io gateway pushes notifications for low stock, transfer state changes, and system events; persistent list with type filters and a dedicated detail view.
- **PDF & Excel Exports** — One-click export for inventory, transactions, ledger, expenses, and P&L. PDFs styled for print; Excel files preserve numeric cells so `=SUM(...)` works in Sheets/Excel.
- **Profit & Loss / Ledger / Expenses** — Branch-scoped financial reporting with date ranges.
- **Profile Management** — Avatar upload, password change, branch info for all users.
- **Email Notifications** — Welcome emails with auto-generated temp passwords for new users.
- **Auto Seeding** — Idempotent seeder creates branches, users, supermarket products, inventory, transactions, expenses, and sample stock transfers on first boot.
- **Reproducible Builds** — Exact-pinned dependency versions, `save-exact` `.npmrc`, and `pnpm-lock.yaml` checked in.
- **Design System (May 2026 redesign)** — Sage/slate palette built on the brand color `#19183B`, full light + dark theme support with a one-click toggle, Geist + Geist Mono typography, and a tokenized component library (KPI cards, sparklines, status pills, segmented controls, page headers, and more).

---

## Design System

The frontend is built on  Every color, font, radius, and shadow flows through CSS variables defined in [frontend/src/index.css](frontend/src/index.css), and is exposed to Tailwind via the `@theme` directive so pages can write `bg-surface`, `text-text-1`, `border-border-strong` instead of hardcoded hex literals.

### Theme tokens

| Token              | Light                  | Dark                          |
|--------------------|------------------------|-------------------------------|
| `--canvas`         | `#F5F8F7`              | `#0E0D24`                     |
| `--surface`        | `#FFFFFF`              | `#19183B`                     |
| `--text-1`         | `#19183B` (deep navy)  | `#E7F2EF`                     |
| `--primary`        | `#19183B`              | `#A1C2BD` (light sage)        |
| `--accent`         | `#4A8073` (sage)       | `#A1C2BD`                     |
| `--warning`        | `#B7791F`              | `#E0B872`                     |
| `--danger`         | `#B4342E`              | `#E08680`                     |
| `--info`           | `#2F6594`              | `#8FB5D6`                     |

Brand palette: `#19183B` (primary navy), `#708993` (slate), `#A1C2BD` (sage), `#E7F2EF` (cloud).

### Theme toggle

`useTheme()` hook in [frontend/src/hooks/useTheme.ts](frontend/src/hooks/useTheme.ts) flips `<html data-theme="light|dark">` and persists the choice to `localStorage`. A pre-React inline script in [frontend/index.html](frontend/index.html) applies the saved preference before paint to prevent flash. The toggle button is mounted in the dashboard topbar, customer header, and auth layout.

### UI primitives

All under [frontend/src/components/ui/](frontend/src/components/ui/) — re-paint and reuse rather than building one-off styles:

`Button` · `Card` · `Input` · `Modal` · `Pill` · `StatusPill` · `Avatar` · `Logo` · `KpiCard` · `Spark` · `PageHeader` · `Segmented` · `Stepper` · `EmptyState` · `Toolbar` · `ThemeToggle`

### Charts

[frontend/src/components/charts/AreaChart.tsx](frontend/src/components/charts/AreaChart.tsx) and [BarChart.tsx](frontend/src/components/charts/BarChart.tsx) wrap Recharts and read CSS variables for stroke, fill, grid, and tooltip — so charts auto-reskin on theme toggle.

### Token migration script

[frontend/scripts/migrate-tokens.mjs](frontend/scripts/migrate-tokens.mjs) is a one-shot codemod that converts hardcoded Tailwind literals (`bg-[#0a0a0a]`, `text-slate-400`, `border-white/10`, status colors `emerald/rose/amber/blue`) to design tokens across `src/pages` and `src/components`. Run it with `node scripts/migrate-tokens.mjs` from the `frontend/` folder. Used during the migration; safe to re-run if new dark literals slip in via PRs.

---

## Documentation

| File                                                                       | Description                                                                                |
|----------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| [docs/use-case-diagram.puml](docs/use-case-diagram.puml)                   | PlantUML source of the project's use case diagram (6 actors · 10 packages · ~50 use cases) |
| [docs/branch-relationships.md](docs/branch-relationships.md)               | Branch-to-user-to-inventory relationship notes                                             |
| [docs/super-admin-features.md](docs/super-admin-features.md)               | Admin-portal feature breakdown                                                             |
| [DOCKER.md](DOCKER.md)                                                     | Docker / deployment notes                                                                  |

To re-render the use case diagram, paste the `.puml` source into [PlantUML online](https://www.plantuml.com/plantuml/uml/) or run it through any PlantUML-compatible renderer (Kroki, plantuml.jar, IDE extensions).

---

## Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended path — everything runs in containers)
- Or for local dev without Docker: **Node.js 22** and **pnpm 10.33.2** (install via `corepack enable` then `corepack prepare pnpm@10.33.2 --activate`)

### 1. Clone

```bash
git clone https://github.com/Anpu21/Byte_squad.git
cd Byte_squad
```

### 2. Environment

Copy the example env file and fill in any values you want to change:

```bash
cp .env.development.example .env.development
```

Key variables:

| Variable                 | Description                                     | Default                          |
|--------------------------|-------------------------------------------------|----------------------------------|
| `PORT`                   | Backend HTTP port                               | `3000`                           |
| `CORS_ORIGIN`            | Allowed frontend origin                         | `http://localhost:5173`          |
| `DB_HOST`                | PostgreSQL host                                 | `postgres` (Docker service name) |
| `DB_PORT`                | PostgreSQL port                                 | `5432`                           |
| `DB_USERNAME`            | DB user                                         | `ledgerpro`                      |
| `DB_PASSWORD`            | DB password                                     | `ledgerpro_dev`                  |
| `DB_NAME`                | DB name                                         | `ledgerpro_dev`                  |
| `DB_SYNC`                | Auto-create schema (dev only — never in prod)   | `true`                           |
| `JWT_SECRET`             | JWT signing secret                              | `your-jwt-secret-here`           |
| `JWT_EXPIRES_IN`         | Token lifetime in seconds                       | `86400` (24h)                    |
| `MAIL_HOST` / `MAIL_PORT`| SMTP host / port                                | `smtp.gmail.com` / `587`         |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP credentials (Gmail App Password)  | —                                |
| `SEED_ADMIN_*`           | Override the bootstrap admin (email, name, etc.)| see `.env.development.example`   |
| `VITE_API_URL`           | Frontend → backend URL                          | `http://localhost:3000/api/v1`   |

### 3a. Run with Docker (recommended)

```bash
docker compose up -d --build
```

| Service  | URL                       |
|----------|---------------------------|
| Frontend | http://localhost:5173     |
| Backend  | http://localhost:3000     |
| Postgres | localhost:5432            |

The seed runs automatically on first boot and creates branches, users, products, inventory, transactions, ledger, expenses, notifications, and sample stock transfers (see [Seed Data](#seed-data) below).

> **Tip — fresh demo data:** if you've changed the seed and want it re-applied, drop the postgres volume:
> ```bash
> docker compose down -v && docker compose up -d
> ```

### 3b. Run Locally (without Docker)

```bash
# Backend
cd backend
pnpm install
pnpm run start:dev

# Frontend (separate terminal)
cd frontend
pnpm install
pnpm run dev
```

Both packages have their own `pnpm-lock.yaml` and `.npmrc` (`save-exact=true`). Use `pnpm install --frozen-lockfile` to guarantee the exact dependency tree from the lockfile (this is what CI does).

---

## Default Accounts

All seeded users have `isFirstLogin: false` and `isVerified: true` — ready to use immediately.

| Role     | Email                              | Password      | Branch           |
|----------|------------------------------------|---------------|------------------|
| Admin    | `admin@ledgerpro.com`              | `Admin@123`   | Main Branch      |
| Admin    | `admin2@ledgerpro.com`             | `Admin@123`   | Downtown Branch  |
| Manager  | `manager.main@ledgerpro.com`       | `Manager@123` | Main Branch      |
| Manager  | `manager@ledgerpro.com`            | `Manager@123` | Downtown Branch  |
| Manager  | `manager.suburban@ledgerpro.com`   | `Manager@123` | Suburban Branch  |
| Cashier  | `cashier@ledgerpro.com`            | `Cashier@123` | Main Branch      |
| Cashier  | `cashier2@ledgerpro.com`           | `Cashier@123` | Downtown Branch  |
| Cashier  | `cashier3@ledgerpro.com`           | `Cashier@123` | Suburban Branch  |

> **Development credentials only.** Change passwords before deploying to production.

---

## Seed Data

The auto-seeder runs on `OnModuleInit`. Each section is **idempotent** — re-running won't duplicate records.

| Data                | What's seeded                                                                 |
|---------------------|--------------------------------------------------------------------------------|
| Branches            | 3 (Main · Downtown · Suburban)                                                 |
| Users               | 8 (2 admins, 3 managers, 3 cashiers)                                           |
| Products            | 46 supermarket items across 9 categories (Beverages, Dairy, Bakery, Produce, Pantry, Snacks, Frozen, Household, Personal Care) |
| Inventory           | Per-branch stock with category-specific thresholds. **Suburban is intentionally understocked** so the transfer flow has natural starting conditions. |
| Transactions        | ~7 days of POS history per cashier                                             |
| Ledger Entries      | 10 entries across all 3 branches                                               |
| Expenses            | 9 entries (Rent, Utilities, Cold Chain, Spoilage, Marketing, Equipment, etc.) |
| Notifications       | 9 sample notifications (low stock, transfer, system, alert)                    |
| Stock Transfers     | 5 sample transfers — one in each state: PENDING, APPROVED, IN_TRANSIT, COMPLETED, REJECTED |

---

## User Roles

| Role      | Access                                                                                                       |
|-----------|--------------------------------------------------------------------------------------------------------------|
| `admin`   | Full system-wide access — manage users, branches, products, view all dashboards, approve/reject stock transfers, see all branches' data |
| `manager` | Branch-scoped — manage their own branch's inventory, file transfer requests, ship/receive transfers, view their branch's performance dashboard |
| `cashier` | POS only — process sales, view their own transaction history and dashboard                                  |

Role-based home pages:
- **Admin** / **Manager** → Admin Dashboard
- **Cashier** → Cashier Dashboard

---

## Key Workflows

### Stock Transfer Lifecycle

```
manager (low stock)        admin             source manager       destination manager
       │                     │                     │                       │
       ▼                     │                     │                       │
   PENDING ──── approve ───▶│                     │                       │
       │                     ▼                     │                       │
       │                APPROVED ──── ship ──────▶│                       │
       │                     │                     ▼                       │
       │                     │                IN_TRANSIT ─── receive ────▶│
       │                     │                     │                       ▼
       │                     │                     │                  COMPLETED
       └──── reject ───▶ REJECTED                  └──── (admin can cancel pre-ship)
```

- Stock decrements at **ship** and increments at **receive** — both transactional with `pessimistic_write` locks so concurrent POS sales can't oversell.
- Every state change creates a notification for the relevant party (admins on creation, managers on approval/ship/receive/cancel).
- Audit columns capture *who* and *when* for each step.

### Notifications

Notifications are persisted in Postgres and pushed in real-time via socket.io (`/notifications` namespace). The frontend listens for live updates and shows a toast + updates the bell badge. Click any notification to open the detail page; transfer-related notifications deep-link to `/transfers/:id`.

### Exports

Inventory, transactions, ledger, expenses, and P&L can be exported as PDF (styled for print) or Excel (numeric cells preserved). Heavy export libraries (`jspdf`, `xlsx`) are lazy-loaded so the initial bundle stays small.

---

## API Routes

All routes are under `/api/v1` and require JWT unless marked **Public**.

| Module                | Route                                          | Methods                | Roles                       |
|-----------------------|------------------------------------------------|------------------------|-----------------------------|
| **Auth**              | `/auth/login`                                  | POST                   | Public                      |
|                       | `/auth/verify-otp`                             | POST                   | Public                      |
|                       | `/auth/change-password`                        | POST                   | Any authenticated           |
|                       | `/auth/refresh`                                | POST                   | Any authenticated           |
| **Users**             | `/users`                                       | GET, POST              | Admin                       |
|                       | `/users/profile`, `/users/profile/avatar`      | GET, PATCH, POST       | Any authenticated           |
|                       | `/users/:id`, `/users/:id/resend-credentials`, `/users/:id/reset-password` | GET, PATCH, DELETE, POST | Admin |
| **Branches**          | `/branches`                                    | GET, POST              | All / Admin                 |
|                       | `/branches/my-performance`                     | GET                    | Admin · Manager             |
|                       | `/branches/:id`, `/branches/:id/toggle-active` | GET, PATCH, DELETE     | Admin                       |
| **Admin Portal**      | `/admin/overview`                              | GET                    | Admin                       |
|                       | `/admin/branches`, `/admin/admins`, `/admin/users` | GET                | Admin                       |
|                       | `/admin/comparison`                            | POST                   | Admin                       |
| **Products**          | `/products`, `/products/:id`                   | GET, POST, PATCH, DELETE | Admin · Manager           |
|                       | `/products/categories`                         | GET                    | Any authenticated           |
|                       | `/products/barcode/:barcode`                   | GET                    | Any authenticated           |
| **Inventory**         | `/inventory`, `/inventory/branch/:branchId`    | GET, POST              | All                         |
|                       | `/inventory/low-stock`                         | GET                    | All                         |
|                       | `/inventory/:id/stock`                         | PATCH                  | Admin · Manager             |
| **POS**               | `/pos/transactions`, `/pos/transactions/:id`   | GET, POST              | Cashier · Admin · Manager   |
|                       | `/pos/my-dashboard`, `/pos/my-transactions`    | GET                    | Cashier · Admin · Manager   |
|                       | `/pos/admin-dashboard`, `/pos/daily-report`    | GET                    | Admin · Manager             |
| **Accounting**        | `/accounting/ledger`, `/accounting/ledger/summary` | GET, POST          | Admin                       |
|                       | `/accounting/expenses`, `/accounting/expenses/:id` | GET, POST, PATCH, DELETE | Admin                 |
|                       | `/accounting/profit-loss`                      | GET                    | Admin                       |
| **Stock Transfers** ✨ | `/stock-transfers`                             | GET, POST              | Admin (list) · Admin · Manager (create) |
|                       | `/stock-transfers/my-requests`, `/stock-transfers/incoming` | GET       | Admin · Manager             |
|                       | `/stock-transfers/:id`                         | GET                    | Admin · Manager             |
|                       | `/stock-transfers/:id/source-options`          | GET                    | Admin                       |
|                       | `/stock-transfers/:id/approve`, `/reject`, `/cancel` | PATCH            | Admin                       |
|                       | `/stock-transfers/:id/ship`, `/receive`        | PATCH                  | Admin · Manager             |
| **Notifications**     | `/notifications`, `/notifications/:id`         | GET                    | Any authenticated           |
|                       | `/notifications/:id/read`, `/notifications/read-all` | PATCH            | Any authenticated           |
| **WebSocket**         | `/notifications` namespace (socket.io)         | —                      | Authenticated socket        |

---

## Project Structure

```
Byte_squad/
├── .env.development.example     # Template — copy to .env.development
├── docker-compose.yml
├── README.md                    # This file
├── DOCKER.md                    # Docker / deployment notes
│
├── docs/                        # Architecture & design docs
│   ├── use-case-diagram.puml    # PlantUML source for the use case diagram
│   ├── branch-relationships.md
│   └── super-admin-features.md
│
├── .github/workflows/           # CI: backend, frontend, docker, deploy
│
├── backend/                     # NestJS API
│   ├── Dockerfile               # Multi-stage (development · build · production)
│   ├── package.json             # Exact-pinned deps · pnpm 10.33.2
│   ├── pnpm-lock.yaml
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── common/
│       │   ├── config/          # DB, JWT, app configs
│       │   ├── enums/           # UserRole, NotificationType, TransferStatus, …
│       │   ├── guards/          # JwtAuthGuard, RolesGuard
│       │   ├── decorators/      # @CurrentUser, @Roles
│       │   ├── filters/         # HTTP exception filter
│       │   ├── interceptors/    # Response transform
│       │   ├── pipes/           # Validation pipes
│       │   ├── routes/          # Centralised APP_ROUTES
│       │   └── seeds/           # Idempotent seeder (supermarket data)
│       └── modules/
│           ├── auth/            # JWT login, OTP, change password
│           ├── users/           # User CRUD, profile, avatar
│           ├── branches/        # Branch CRUD + my-performance
│           ├── products/        # Product catalogue + barcode lookup
│           ├── inventory/       # Per-branch stock
│           ├── pos/             # Transactions, dashboards
│           ├── accounting/      # Ledger, expenses, P&L
│           ├── notifications/   # Notification entity + REST + socket.io gateway
│           ├── admin-portal/    # Cross-branch admin queries
│           ├── stock-transfers/ # ✨ Inter-branch transfer state machine
│           └── email/           # Nodemailer
│
└── frontend/                    # React + Vite SPA
    ├── Dockerfile               # Multi-stage (dev · build · nginx prod)
    ├── nginx.conf               # Production SPA + caching headers
    ├── package.json             # Exact-pinned deps · pnpm 10.33.2
    ├── pnpm-lock.yaml
    ├── index.html               # FOUC theme script + Google Fonts preconnect
    ├── scripts/
    │   └── migrate-tokens.mjs   # One-shot codemod: dark literals → design tokens
    └── src/
        ├── App.tsx              # Providers, Toaster (theme-aware)
        ├── index.css            # Design tokens (@theme + :root + [data-theme="dark"])
        ├── constants/           # Enums (UserRole, TransferStatus, …), routes
        ├── layouts/             # DashboardLayout · AuthLayout · CustomerLayout
        ├── routes/              # AppRouter, ProtectedRoute, PublicRoute, routeMeta (breadcrumbs)
        ├── pages/
        │   ├── auth/            # Login, Signup, OTP, ChangePassword
        │   ├── dashboard/       # Admin & Cashier dashboards
        │   ├── users/           # UserManagement, Profile
        │   ├── pos/             # POS terminal + Transactions + ScanRequest
        │   ├── inventory/       # InventoryList, ProductForm
        │   ├── accounting/      # Ledger, Expenses, ProfitLoss
        │   ├── notifications/   # NotificationsList + Detail
        │   ├── branches/        # BranchManagement, BranchPerformance
        │   ├── transfers/       # ✨ TransferRequests, NewTransferRequest, TransferDetail
        │   ├── shop/            # Customer storefront (Catalog, Cart, Checkout, MyRequests)
        │   ├── requests/        # CustomerRequests (staff fulfillment)
        │   └── admin/           # BranchesHub (tabbed), AdminTransfers, BranchComparison
        ├── components/
        │   ├── ui/              # 🎨 Design-system primitives (Button, Card, Input, Modal,
        │   │                    #   Pill, StatusPill, Avatar, Logo, KpiCard, Spark,
        │   │                    #   PageHeader, Segmented, Stepper, EmptyState, Toolbar,
        │   │                    #   ThemeToggle)
        │   ├── charts/          # AreaChart, BarChart, SalesChart (CSS-var themed)
        │   ├── common/          # ExportMenu, shared bits
        │   ├── notifications/   # Bell dropdown, list utilities
        │   ├── shop/            # CartDrawer
        │   └── transfers/       # ✨ TransferStatusPill
        ├── services/            # Axios + per-module clients
        ├── hooks/               # useAuth, useTheme, useBreadcrumbs, useInventory, …
        ├── lib/                 # exportUtils (PDF + Excel), formatters, cn()
        ├── store/               # Redux: auth + shopCart slices
        └── types/               # Shared TypeScript interfaces
```

---

## Development

### Useful commands (run from `backend/` or `frontend/`)

| Command                          | Purpose                                  |
|----------------------------------|------------------------------------------|
| `pnpm install --frozen-lockfile` | Install exactly the lockfile             |
| `pnpm run start:dev` (backend)   | NestJS in watch mode                     |
| `pnpm run dev` (frontend)        | Vite dev server                          |
| `pnpm run lint`                  | ESLint with `--fix`                      |
| `pnpm run build`                 | Production build                         |
| `pnpm run test`                  | Jest (backend)                           |
| `pnpm run seed:admin` (backend)  | Run the admin seed manually              |
| `pnpm run migrate:roles` (backend) | One-off legacy role-rename migration   |

### CI

GitHub Actions runs on push/PR:

- `.github/workflows/backend-ci.yml` — pnpm install → lint → test → build
- `.github/workflows/frontend-ci.yml` — pnpm install → lint → typecheck → build

Both workflows use `pnpm/action-setup@v4` pinned to **10.33.2** and `actions/setup-node@v4` with `cache: pnpm`.

### Adding a Dependency

`save-exact=true` is set in both `.npmrc` files, so `pnpm add <pkg>` writes an exact version to `package.json`. To pin a specific version, use `pnpm add <pkg>@1.2.3`.

---

## Docker

See [DOCKER.md](./DOCKER.md) for full deployment notes (multi-stage builds, production images, env-var handling, security checklist). For day-to-day development:

| Command                           | Purpose                                         |
|-----------------------------------|-------------------------------------------------|
| `docker compose up -d --build`    | Start dev stack (rebuild after dep changes)     |
| `docker compose up -d`            | Start dev stack (cached layers)                 |
| `docker compose logs -f backend`  | Tail backend logs                               |
| `docker compose exec backend sh`  | Shell into the backend container                |
| `docker compose restart`          | Restart **all** containers (frontend, backend, postgres) |
| `docker compose restart backend`  | Restart a single service (swap `backend` for `frontend` or `postgres`) |
| `docker compose down && docker compose up -d` | Full stop + start (use after editing `docker-compose.yml` or `.env`) |
| `docker compose up -d --force-recreate backend` | Recreate one container from scratch without rebuilding the image |
| `docker compose down`             | Stop containers (keep volumes)                  |
| `docker compose down -v`          | Stop containers **and drop the postgres volume** (resets all data — re-seeds on next `up`) |

> **When to use which restart**
> - **Code change** (backend/frontend `src/`): no restart needed — both services run in watch mode with bind mounts.
> - **Dependency change** (`package.json`): `docker compose up -d --build` to rebuild the image.
> - **Env change** (`.env`): `docker compose down && docker compose up -d` — `restart` alone won't reload env vars.
> - **Container looks stuck / port stuck:** `docker compose restart <service>`.

---

## License

MIT
