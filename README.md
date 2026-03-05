# 📒 LedgerPro — Business Accounting Software

> A modern, full-stack point-of-sale and accounting platform built for multi-branch businesses.

---

## ⚡ Tech Stack

| Layer     | Technology                                           |
|-----------|------------------------------------------------------|
| Frontend  | React 18 · Vite · Redux Toolkit · React Router · Tailwind CSS |
| Backend   | NestJS 11 · TypeORM · Passport JWT · bcrypt          |
| Database  | PostgreSQL (Supabase-hosted, development)             |
| DevOps    | Docker Compose · GitHub Actions                      |

---

## 🔑 Default Admin Account

The application automatically seeds a default admin user on first startup.

| Field    | Value                 |
|----------|-----------------------|
| Email    | `admin@ledgerpro.com` |
| Password | `Admin@123`           |
| Role     | `admin`               |

> ⚠️ **Change the default password after your first login.** These credentials are for development/initial setup only.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Docker & Docker Compose** (for containerised development)
- A **PostgreSQL** database (or use the pre-configured Supabase instance)

### 1. Clone the Repository

```bash
git clone https://github.com/Anpu21/Byte_squad.git
cd Byte_squad
```

### 2. Environment Variables

Copy and customise the development env file:

```bash
cp .env.development .env.development.local   # optional override
```

Key variables in `.env.development`:

| Variable        | Description                          | Default                  |
|-----------------|--------------------------------------|--------------------------|
| `PORT`          | Backend server port                  | `3000`                   |
| `CORS_ORIGIN`   | Allowed frontend origin              | `http://localhost:5173`  |
| `DB_HOST`       | PostgreSQL host                      | Supabase pooler          |
| `DB_PORT`       | PostgreSQL port                      | `5432`                   |
| `DB_USERNAME`   | Database user                        | —                        |
| `DB_PASSWORD`   | Database password                    | —                        |
| `DB_NAME`       | Database name                        | `postgres`               |
| `DB_SYNC`       | Auto-sync schema (dev only)          | `true`                   |
| `JWT_SECRET`    | JWT signing secret                   | `dev-secret-change-me…`  |
| `JWT_EXPIRES_IN`| Token lifetime in seconds            | `86400` (24 h)           |

### 3a. Run with Docker (Recommended)

```bash
docker compose up --build
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:3000        |

The admin seed runs automatically on startup — check the logs for:
```
🌱 Seeding default admin account...
✅ Default admin user created: admin@ledgerpro.com
```

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

### 4. Manual Admin Seed (Optional)

If you need to re-seed the admin user manually:

```bash
cd backend
npm run seed:admin
```

---

## 🔐 Login

**Endpoint:** `POST /api/v1/auth/login`

```json
{
  "email": "admin@ledgerpro.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOi...",
  "user": {
    "id": "uuid",
    "email": "admin@ledgerpro.com",
    "firstName": "System",
    "lastName": "Admin",
    "role": "admin",
    "branchId": "uuid",
    "isFirstLogin": true,
    "isVerified": true
  }
}
```

---

## 🗂️ Project Structure

```
Byte_squad/
├── .env.development          # Shared environment variables
├── docker-compose.yml        # Docker orchestration
├── DOCKER.md                 # Docker-specific docs
│
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── main.ts                       # App entry point
│   │   ├── app.module.ts                 # Root module
│   │   ├── common/
│   │   │   ├── config/                   # DB, JWT, App configs
│   │   │   ├── enums/                    # UserRole, PaymentMethod, etc.
│   │   │   ├── guards/                   # JWT auth guard
│   │   │   ├── decorators/               # Custom decorators
│   │   │   ├── filters/                  # HTTP exception filter
│   │   │   ├── interceptors/             # Response transform
│   │   │   ├── pipes/                    # Validation pipes
│   │   │   ├── routes/                   # Centralised route constants
│   │   │   └── seeds/                    # Admin seeder
│   │   └── modules/
│   │       ├── auth/                     # Authentication (JWT + bcrypt)
│   │       ├── users/                    # User management
│   │       ├── branches/                 # Branch management
│   │       ├── products/                 # Product catalogue
│   │       ├── inventory/                # Stock tracking
│   │       ├── pos/                      # Point-of-sale transactions
│   │       ├── accounting/               # Ledger & expenses
│   │       └── notifications/            # Real-time notifications
│   └── package.json
│
└── frontend/                 # React + Vite SPA
    ├── src/
    └── package.json
```

---

## 📡 API Routes Overview

| Module         | Route                        | Methods             |
|----------------|------------------------------|---------------------|
| Auth           | `/api/v1/auth/login`         | POST                |
| Auth           | `/api/v1/auth/verify-otp`    | POST                |
| Auth           | `/api/v1/auth/change-password` | POST              |
| Users          | `/api/v1/users`              | GET, POST           |
| Users          | `/api/v1/users/:id`          | GET, PATCH, DELETE  |
| Branches       | `/api/v1/branches`           | GET, POST           |
| Branches       | `/api/v1/branches/:id`       | GET, PATCH, DELETE  |
| Products       | `/api/v1/products`           | GET, POST           |
| Products       | `/api/v1/products/:id`       | GET, PATCH, DELETE  |
| Inventory      | `/api/v1/inventory`          | GET                 |
| POS            | `/api/v1/pos/transactions`   | GET, POST           |
| Accounting     | `/api/v1/accounting/ledger`  | GET, POST           |
| Accounting     | `/api/v1/accounting/expenses`| GET, POST           |
| Notifications  | `/api/v1/notifications`      | GET                 |

---

## 👥 User Roles

| Role         | Description                              |
|--------------|------------------------------------------|
| `admin`      | Full system access, manage users/branches |
| `manager`    | Branch-level management                  |
| `accountant` | Financial reports, ledger, expenses      |
| `cashier`    | POS transactions                         |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is **UNLICENSED** — private use only.
