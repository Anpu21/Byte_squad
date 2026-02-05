# SmartBiz ERP

A modern, offline-first desktop ERP application for SMEs with double-entry accounting, inventory management, barcode billing, and multi-branch support.

##  Features

### Accounting
-  Double-entry bookkeeping with strict debit=credit validation
-  Chart of Accounts with hierarchical ledger groups  
-  Multi-voucher support (Journal, Payment, Receipt, Sales, Purchase)
-  Immutable posted vouchers with audit trail
-  Real-time ledger balance updates

### Reporting
-  Trial Balance
-  Profit & Loss Statement  
-  Balance Sheet
-  Day Book

### Inventory
-  Item master with categories
-  Stock movement tracking
-  Barcode scanning support
-  Multiple valuation methods (FIFO, LIFO, Average)

### Security
-  JWT authentication with refresh tokens
-  Role-based access control (RBAC)
-  AES-256 encrypted backups
-  Password hashing with bcrypt

## 🛠️ Tech Stack

### Backend (NestJS)
- TypeScript, NestJS, TypeORM
- SQLite (offline) / PostgreSQL (cloud backup)
- Passport.js for authentication

### Frontend (Electron + React)
- TypeScript, React 18, Vite
- Redux Toolkit for state management
- HashRouter for Electron compatibility
- Modern CSS with glassmorphism design

##  Installation

### Prerequisites
- Node.js 20+
- npm or yarn

### Backend Setup
```bash
cd smartbiz-backend
npm install
cp .env.example .env
npm run dev
```

### Frontend Setup
```bash
cd smartbiz-frontend
npm install
npm run electron:dev
```

### Build Windows Executable
```bash
cd smartbiz-frontend
npm run build
# Output: smartbiz-frontend/release/SmartBiz ERP.exe
```

##  Project Structure

```
Byte_squad/
├── smartbiz-backend/
│   ├── src/
│   │   ├── config/          # App & database config
│   │   ├── database/        # TypeORM setup, entities
│   │   ├── common/          # Guards, filters, decorators
│   │   └── modules/
│   │       ├── auth/        # JWT authentication
│   │       ├── users/       # User management
│   │       ├── companies/   # Multi-company support
│   │       ├── ledgers/     # Chart of accounts
│   │       ├── vouchers/    # Accounting engine
│   │       ├── inventory/   # Stock management
│   │       ├── payments/    # Payment tracking
│   │       ├── reports/     # Financial reports
│   │       └── backup/      # Encrypted backup/restore
│   └── test/
├── smartbiz-frontend/
│   ├── electron/            # Electron main/preload
│   └── src/
│       ├── app/             # Entry point, global CSS
│       ├── features/        # Feature-based modules
│       │   ├── auth/
│       │   └── dashboard/
│       ├── shared/          # Shared components, constants
│       ├── store/           # Redux store
│       └── routes/          # App routing
└── docker-compose.yml
```

##  Default Credentials

```
Username: admin
Password: password123
```

## License