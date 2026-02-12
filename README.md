# ByteBooks – Business Accounting Software

> Offline-first accounting software built with React, NestJS, and SQLite, with future PostgreSQL sync support.

---

## 🏗️ Tech Stack

| Layer      | Technology                                |
|------------|-------------------------------------------|
| Frontend   | React 18, Redux Toolkit, TypeScript, Tailwind CSS v4, Vite |
| Backend    | NestJS 11, TypeORM, Passport JWT          |
| Database   | SQLite (local, `better-sqlite3`), PostgreSQL (future sync) |
| Desktop    | Electron                                  |

## 📁 Project Structure

```
Byte_squad/
├── backend/
│   └── src/
│       ├── database/
│       │   ├── database.module.ts        # TypeORM SQLite config
│       │   └── seeds/
│       │       └── admin-seed.ts         # Default admin seeder
│       ├── features/
│       │   └── auth/
│       │       ├── auth.module.ts
│       │       ├── auth.service.ts
│       │       ├── auth.controller.ts
│       │       ├── dto/
│       │       │   ├── login.dto.ts
│       │       │   └── register.dto.ts
│       │       ├── entities/
│       │       │   └── user.entity.ts
│       │       ├── guards/
│       │       │   ├── jwt-auth.guard.ts
│       │       │   └── roles.guard.ts
│       │       ├── decorators/
│       │       │   └── roles.decorator.ts
│       │       └── strategies/
│       │           └── jwt.strategy.ts
│       └── shared/
│           ├── routes.ts                 # Shared API route constants
│           └── enums/
│               └── role.enum.ts
├── frontend/
│   └── src/
│       ├── components/
│       │   └── ProtectedRoute.tsx
│       ├── features/
│       │   ├── auth/
│       │   │   ├── authApi.ts
│       │   │   ├── authSlice.ts
│       │   │   └── pages/
│       │   │       └── LoginPage.tsx
│       │   └── dashboard/
│       │       └── pages/
│       │           └── DashboardPage.tsx
│       ├── shared/
│       │   ├── routes.ts                 # Shared API route constants
│       │   └── constants/
│       │       └── roles.ts
│       └── store/
│           └── index.ts
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+

### 1. Backend Setup

```bash
cd backend
npm install
npm run seed      # Creates default admin user
npm run start:dev # Starts NestJS on http://localhost:3000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev       # Starts Vite dev server on http://localhost:5173
```

## 🔐 Default Credentials

| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `admin123` |

> ⚠️ **Change these credentials immediately in production.**

## 👥 User Roles

| Role       | Permissions                    |
|------------|--------------------------------|
| Admin      | Full access, can create users  |
| Accountant | Accounting operations          |
| Cashier    | Cash register operations       |

Only **Admin** users can create new user accounts via `POST /api/auth/register`.

## 🔌 API Endpoints

| Method | Endpoint              | Auth      | Description             |
|--------|-----------------------|-----------|-------------------------|
| POST   | `/api/auth/login`     | Public    | Authenticate user       |
| POST   | `/api/auth/register`  | Admin     | Create a new user       |
| GET    | `/api/auth/profile`   | Protected | Get current user profile|

## 🗄️ Database

- **Local:** SQLite (`data.sqlite` created automatically in `backend/`)
- **Future:** PostgreSQL — entity definitions use PostgreSQL-compatible column types. To switch, update `type` and `database` in `database.module.ts`.

## 📝 License

UNLICENSED – Byte Squad
