# LedgerPro

<sub>Supermarket POS, inventory, and accounting platform</sub>

> A modern full-stack point-of-sale and inventory platform for multi-branch supermarkets. Cashiers ring up sales, managers track stock and request inter-branch transfers, admins oversee everything across branches.

---

## Tech Stack

| Layer    | Technology                                                                                              |
|----------|---------------------------------------------------------------------------------------------------------|
| Frontend | React 19 · Vite 7 · TypeScript · Tailwind CSS · Redux Toolkit · TanStack React Query · Recharts · socket.io-client · jsPDF · xlsx · react-hot-toast |
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
    └── src/
        ├── App.tsx              # Providers, Toaster
        ├── constants/           # Enums (UserRole, TransferStatus, …), routes
        ├── layouts/             # DashboardLayout (sidebar, top bar)
        ├── routes/              # AppRouter, ProtectedRoute, PublicRoute
        ├── pages/
        │   ├── auth/            # Login, OTP, ChangePassword
        │   ├── dashboard/       # Admin & Cashier dashboards
        │   ├── users/           # UserManagement, Profile
        │   ├── pos/             # POS terminal + Transactions
        │   ├── inventory/       # InventoryList, ProductForm
        │   ├── accounting/      # Ledger, Expenses, ProfitLoss
        │   ├── notifications/   # NotificationsList + Detail
        │   ├── branches/        # BranchManagement, BranchPerformance
        │   ├── transfers/       # ✨ TransferRequests, NewTransferRequest, TransferDetail
        │   └── admin/           # BranchesHub (tabbed), AdminTransfers
        ├── components/
        │   ├── common/          # ExportMenu, shared bits
        │   ├── notifications/   # Bell dropdown, list utilities
        │   └── transfers/       # ✨ TransferStatusPill
        ├── services/            # Axios + per-module clients
        ├── hooks/               # useAuth, useInventory, useNotifications, useStockTransfers
        ├── lib/                 # exportUtils (PDF + Excel), formatters
        ├── store/               # Redux auth slice
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
| `docker compose down`             | Stop containers (keep volumes)                  |
| `docker compose down -v`          | Stop containers **and drop the postgres volume** (resets all data — re-seeds on next `up`) |

---

## License

MIT
