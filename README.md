# LedgerPro

<sub>Business Accounting Software</sub>

> A modern, full-stack point-of-sale and accounting platform built for multi-branch businesses.

---

## Tech Stack

| Layer    | Technology                                                                                    |
| -------- | --------------------------------------------------------------------------------------------- |
| Frontend | React 19 · Vite · TypeScript · Tailwind CSS · Redux Toolkit · TanStack React Query · Recharts |
| Backend  | NestJS 11 · TypeORM · Passport JWT · bcrypt · Nodemailer                                      |
| Database | PostgreSQL 16                                                                                 |
| DevOps   | Docker Compose · GitHub Actions                                                               |

---

## Features

- **Multi-branch POS** — Process sales transactions across multiple branches
- **Admin Dashboard** — Real-time overview with sales charts, top products, and recent transactions
- **Cashier Dashboard** — Day-to-day sales tracking for individual cashiers
- **User Management** — Admin creates users with auto-generated temp passwords sent via email
- **Role-Based Access Control** — Admin, Manager, Accountant, Cashier roles with guarded routes
- **Inventory Tracking** — Per-branch stock levels with low-stock alerts
- **Accounting** — Ledger entries, expense tracking, and profit/loss reports
- **Profile Management** — Avatar upload, password change, branch info for all users
- **Email Notifications** — Welcome emails with credentials for new users
- **Auto Seeding** — Development mode seeds branches, users, products, inventory, transactions, and financial data

---

## Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- Or: **Node.js** >= 18 and **npm** >= 9

### 1. Clone

```bash
git clone https://github.com/Anpu21/Byte_squad.git
cd Byte_squad
```

### 2. Environment Variables

Copy and customise the development env file:

```bash
cp .env.development .env.development.local   # optional override
```

Key variables:

| Variable                      | Description                 | Default                 |
| ----------------------------- | --------------------------- | ----------------------- |
| `PORT`                        | Backend server port         | `3000`                  |
| `CORS_ORIGIN`                 | Allowed frontend origin     | `http://localhost:5173` |
| `DB_HOST`                     | PostgreSQL host             | `postgres` (Docker)     |
| `DB_PORT`                     | PostgreSQL port             | `5432`                  |
| `DB_USERNAME`                 | Database user               | `ledgerpro`             |
| `DB_PASSWORD`                 | Database password           | `ledgerpro_dev`         |
| `DB_NAME`                     | Database name               | `ledgerpro_dev`         |
| `DB_SYNC`                     | Auto-sync schema (dev only) | `true`                  |
| `JWT_SECRET`                  | JWT signing secret          | `dev-secret-change-me…` |
| `JWT_EXPIRES_IN`              | Token lifetime (seconds)    | `86400` (24h)           |
| `MAIL_HOST`                   | SMTP host                   | `smtp.gmail.com`        |
| `MAIL_PORT`                   | SMTP port                   | `587`                   |
| `MAIL_USERNAME`               | SMTP username               | —                       |
| `MAIL_PASSWORD`               | SMTP app password           | —                       |
| `MAIL_FROM`                   | Sender email address        | —                       |
| `TEMP_PASSWORD_EXPIRES_HOURS` | Temp password validity      | `48`                    |

### 3a. Run with Docker (Recommended)

```bash
docker compose up --build
```

| Service  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:3000 |
| Postgres | localhost:5432        |

On first startup the seed service automatically creates branches, users, products, inventory, transactions, and financial data.

### 3b. Run Locally (Without Docker)

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## Default Accounts

All seeded users have `isFirstLogin: false` and `isVerified: true` — ready to use immediately.

| Role       | Email                      | Password      | Branch          |
| ---------- | -------------------------- | ------------- | --------------- |
| Admin      | `admin@ledgerpro.com`      | `Admin@123`   | Main Branch     |
| Manager    | `manager@ledgerpro.com`    | `Manager@123` | Main Branch     |
| Accountant | `accountant@ledgerpro.com` | `Account@123` | Main Branch     |
| Cashier    | `cashier@ledgerpro.com`    | `Cashier@123` | Main Branch     |
| Cashier 2  | `cashier2@ledgerpro.com`   | `Cashier@123` | Downtown Branch |

> **These credentials are for development only.** Change passwords before deploying to production.

---

## Seed Data

On `docker compose up`, the seed service creates:

| Data           | Count                                                |
| -------------- | ---------------------------------------------------- |
| Branches       | 2 (Main Branch, Downtown Branch)                     |
| Users          | 5 (all roles)                                        |
| Products       | 15 (Electronics, Furniture, Stationery, Accessories) |
| Inventory      | 30 (each product in each branch)                     |
| Transactions   | ~7 days of history per cashier (3-8 txns/day)        |
| Ledger Entries | 8                                                    |
| Expenses       | 5                                                    |

Seeding is **idempotent** — existing records are not duplicated on restart.

---

## User Roles

| Role         | Access                                                                     |
| ------------ | -------------------------------------------------------------------------- |
| `admin`      | Full system access — manage users, branches, products, view all dashboards |
| `manager`    | Branch-level management, admin dashboard access                            |
| `accountant` | Financial reports, ledger, expenses                                        |
| `cashier`    | POS transactions, personal sales dashboard                                 |

Each role has a **role-based home page**:

- Admin / Manager → Admin Dashboard
- Accountant → Ledger
- Cashier → Cashier Dashboard

---

## API Routes

| Module            | Route                                  | Methods            | Auth                  |
| ----------------- | -------------------------------------- | ------------------ | --------------------- |
| **Auth**          | `/api/v1/auth/login`                   | POST               | Public                |
|                   | `/api/v1/auth/verify-otp`              | POST               | Public                |
|                   | `/api/v1/auth/change-password`         | POST               | JWT                   |
|                   | `/api/v1/auth/refresh`                 | POST               | JWT                   |
| **Users**         | `/api/v1/users`                        | GET, POST          | Admin                 |
|                   | `/api/v1/users/profile`                | GET, PATCH         | JWT                   |
|                   | `/api/v1/users/profile/avatar`         | POST               | JWT                   |
|                   | `/api/v1/users/:id`                    | GET, PATCH, DELETE | Admin                 |
|                   | `/api/v1/users/:id/resend-credentials` | POST               | Admin                 |
| **Branches**      | `/api/v1/branches`                     | GET, POST          | Admin                 |
|                   | `/api/v1/branches/:id`                 | GET, PATCH, DELETE | Admin                 |
| **Products**      | `/api/v1/products`                     | GET, POST          | Admin/Manager         |
|                   | `/api/v1/products/:id`                 | GET, PATCH, DELETE | Admin/Manager         |
|                   | `/api/v1/products/barcode/:barcode`    | GET                | All                   |
| **Inventory**     | `/api/v1/inventory`                    | GET                | All                   |
|                   | `/api/v1/inventory/branch/:branchId`   | GET                | All                   |
|                   | `/api/v1/inventory/low-stock`          | GET                | All                   |
|                   | `/api/v1/inventory/:id/stock`          | PATCH              | Admin/Manager         |
| **POS**           | `/api/v1/pos/transactions`             | GET, POST          | Cashier/Admin/Manager |
|                   | `/api/v1/pos/transactions/:id`         | GET                | Cashier/Admin/Manager |
|                   | `/api/v1/pos/my-dashboard`             | GET                | Cashier/Admin/Manager |
|                   | `/api/v1/pos/admin-dashboard`          | GET                | Admin/Manager         |
| **Accounting**    | `/api/v1/accounting/ledger`            | GET, POST          | Accountant/Admin      |
|                   | `/api/v1/accounting/expenses`          | GET, POST          | Accountant/Admin      |
|                   | `/api/v1/accounting/expenses/:id`      | GET, PATCH, DELETE | Accountant/Admin      |
|                   | `/api/v1/accounting/profit-loss`       | GET                | Accountant/Admin      |
| **Notifications** | `/api/v1/notifications`                | GET                | JWT                   |
|                   | `/api/v1/notifications/:id/read`       | PATCH              | JWT                   |
|                   | `/api/v1/notifications/read-all`       | PATCH              | JWT                   |

---

## Project Structure

```
Byte_squad/
├── .env.development              # Shared environment variables
├── docker-compose.yml            # Docker orchestration
├── README.md
│
├── backend/                      # NestJS API
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── common/
│       │   ├── config/           # DB, JWT, App configs
│       │   ├── enums/            # UserRole, PaymentMethod, etc.
│       │   ├── guards/           # JWT & Roles guards
│       │   ├── decorators/       # @CurrentUser, @Roles
│       │   ├── filters/          # HTTP exception filter
│       │   ├── interceptors/     # Response transform
│       │   ├── pipes/            # Validation pipes
│       │   ├── routes/           # Centralised route constants
│       │   └── seeds/            # Auto-seeder (users, products, transactions…)
│       └── modules/
│           ├── auth/             # JWT authentication + password change
│           ├── users/            # User CRUD + profile + avatar
│           ├── branches/         # Branch management
│           ├── products/         # Product catalogue
│           ├── inventory/        # Stock tracking
│           ├── pos/              # POS transactions + dashboards
│           ├── accounting/       # Ledger & expenses
│           ├── email/            # Nodemailer email service
│           └── notifications/    # Notifications
│
└── frontend/                     # React + Vite SPA
    └── src/
        ├── constants/            # Enums, routes
        ├── layouts/              # DashboardLayout with sidebar
        ├── pages/
        │   ├── auth/             # Login, OTP, ChangePassword
        │   ├── dashboard/        # Admin & Cashier dashboards
        │   ├── users/            # UserManagement, Profile
        │   ├── pos/              # POS terminal
        │   ├── inventory/        # Inventory management
        │   └── accounting/       # Ledger & expenses
        ├── routes/               # AppRouter, ProtectedRoute
        ├── services/             # API service layers
        ├── store/                # Redux auth slice
        └── types/                # TypeScript interfaces
```

---

## License

MIT
