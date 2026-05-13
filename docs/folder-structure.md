# Folder structure & file conventions

> Loaded on demand from [`CLAUDE.md`](../CLAUDE.md).

This page is the **map** of the repo — where things live, what each folder is for, and the file-naming + one-thing-per-file conventions every change must follow. The full coding rules behind these conventions are in [`rules.md`](../rules.md) (§13 File organization, §14 Naming).

---

## Repo root

```
Byte_squad/
├── backend/                  # NestJS 11 service (its own pnpm lockfile)
├── frontend/                 # Vite 7 + React 19 SPA (its own pnpm lockfile)
├── docs/                     # CLAUDE.md deep-dive index
├── docker-compose.yml        # Postgres 16 + both apps
├── ecosystem.config.cjs      # PM2 services (gitignored on prod)
├── CLAUDE.md                 # Root index — slim, always loaded
├── README.md                 # Public README
├── Rules.md / rules.md       # Engineering rules (canonical)
└── .gitattributes            # LF normalization for source files
```

There is no root `package.json` and no `pnpm-workspace.yaml`. The two packages are independent (separate lockfiles); shared dev tooling (e.g. linters) lives in each package.

---

## `backend/src/`

NestJS 11 service. Module-per-domain under `modules/`, cross-cutting code under `common/`.

```
backend/src/
├── main.ts
├── app.module.ts
├── common/
│   ├── cloudinary/           # @Global() CloudinaryService (uploadImage, uploadBuffer)
│   ├── config/               # Config schemas + factory
│   ├── decorators/           # @CurrentUser, @Public, @Roles
│   ├── enums/                # UserRole, ExpenseStatus, …
│   ├── filters/              # Global exception filters
│   ├── guards/               # JwtAuthGuard, RolesGuard
│   ├── interceptors/         # TransformInterceptor (success envelope)
│   ├── pipes/                # Validation pipes
│   ├── routes/app.routes.ts  # APP_ROUTES — single source of /api/v1 paths
│   ├── seeds/                # admin-seed.service (idempotent, runs on boot)
│   └── utils/                # random-password-generator, helpers
└── modules/
    ├── accounting/
    ├── admin-portal/
    ├── auth/
    ├── branches/
    ├── customer-requests/
    ├── email/
    ├── inventory/
    ├── notifications/
    ├── pos/
    ├── products/
    ├── shop/
    ├── stock-transfers/
    └── users/
```

### Per-module shape (canonical layout)

```
modules/<feature>/
├── <feature>.module.ts             # Nest @Module definition
├── <feature>.controller.ts         # Thin: request/response only
├── <feature>.service.ts            # Business logic, no TypeORM imports
├── <feature>.repository.ts         # All TypeORM calls (Repository Pattern §7)
├── dto/
│   ├── create-<thing>.dto.ts       # class-validator-decorated request shapes
│   └── update-<thing>.dto.ts
├── entities/
│   └── <thing>.entity.ts           # TypeORM entities, one per file
├── types/
│   ├── index.ts                    # barrel — re-exports only
│   └── <name>.type.ts              # one interface/type per file, kebab-case
└── strategies/                     # auth/ only — passport strategies
```

### Repository Pattern status (per Rules.md §7)

Modules that own their own DB tables get a `.repository.ts`:

- **Migrated:** `accounting`, `branches`, `customer-requests`, `inventory`, `notifications`, `pos`, `products`, `stock-transfers`, `users`
- **No repository (composes other modules / no DB access):** `admin-portal` (read-only aggregates), `auth` (uses `users` repo), `email` (no DB), `shop` (composes `products` + `inventory` + `branches`)

**New modules MUST follow the Repository Pattern.** Service files must not contain `@InjectRepository` or any TypeORM symbol.

---

## `frontend/src/`

Vite 7 + React 19. Tailwind 4 with `@theme`-based design tokens. Redux Toolkit for session-critical state, TanStack Query for server data.

```
frontend/src/
├── main.tsx
├── App.tsx
├── index.css                       # Design tokens (CSS vars + @theme)
├── assets/                         # Static images / SVG
├── components/
│   ├── Scanner/                    # UniversalScanner (camera barcode reader)
│   ├── auth/                       # Auth widgets
│   ├── charts/                     # AreaChart, BarChart (Recharts wrappers)
│   ├── common/                     # Shared cross-feature widgets
│   ├── notifications/              # NotificationDropdown, NotificationIcon, notificationUtils
│   ├── requests/                   # StaffRequestDetailsModal, …
│   ├── shop/                       # RequestDetailsModal, shop widgets
│   ├── transfers/                  # Stock-transfer widgets
│   └── ui/                         # MANDATORY UI primitives — see below
├── constants/
│   ├── enums.ts                    # NotificationType, UserRole, … (mirror of backend enums)
│   └── routes.ts                   # FRONTEND_ROUTES — single source of paths
├── hooks/                          # One hook per file — useAuth, useConfirm, useTheme, useNotifications, …
├── layouts/                        # AuthLayout, DashboardLayout, CustomerLayout
├── lib/                            # utils.ts, exportUtils.ts (lazy jspdf/xlsx loaders)
├── pages/                          # Route-level pages, grouped by feature folder
│   ├── accounting/
│   ├── admin/
│   ├── auth/
│   ├── branches/
│   ├── dashboard/
│   ├── inventory/
│   ├── notifications/
│   ├── pos/
│   ├── requests/
│   ├── shop/
│   ├── transfers/
│   └── users/
├── routes/
│   ├── AppRouter.tsx               # Single source of route truth
│   ├── ProtectedRoute.tsx          # allowedRoles enforcement
│   ├── PublicRoute.tsx             # Redirect logged-in users
│   ├── SmartRedirect.tsx           # Role-based home dispatch
│   └── routeMeta.ts                # Per-route metadata + helpers
├── services/                       # API + socket clients (axios wrappers)
├── store/
│   ├── index.ts                    # Redux store wiring
│   └── slices/                     # auth.slice, shopCart.slice (items only, no branchId)
├── test/
│   └── setup.ts                    # Vitest setup — jest-dom matchers + cleanup
└── types/                          # See "Frontend types" below
```

### Mandatory UI primitives (`components/ui/`)

Use these instead of hand-rolled equivalents — see Rules.md §5:

`Modal`, `Input`, `Button`, `Card`, `KpiCard`, `Pill`, `StatusPill`, `Avatar`, `Logo`, `Spark`, `PageHeader`, `Segmented`, `Stepper`, `EmptyState`, `Toolbar`, `ThemeToggle`, `ConfirmDialog`.

### Frontend types — domain-folder + barrel pattern

```
frontend/src/types/
├── index.ts                        # barrel of barrels — `export * from './<domain>'`
├── accounting/
│   ├── index.ts                    # barrel — re-exports only
│   ├── expense.type.ts
│   ├── ledger-entry.type.ts
│   └── …
├── admin/                          # 17 files
├── analytics/                      # 4 files
├── api/                            # 3 files
├── auth/                           # 6 files
├── branch/                         # 16 files
├── customer-requests/              # 6 files
├── inventory/                      # 4 files
├── notifications/                  # 3 files
├── pos/                            # 10 files
├── product/                        # 3 files
├── shop/                           # 5 files
├── stock-transfers/                # 10 files
├── ui/                             # 2 files
└── user/                           # 4 files
```

15 domain folders, ~100 type files. **Always import from `@/types`** (the top-level barrel) — never reach into `@/types/<domain>/<file>` directly.

---

## File-naming & one-thing-per-file rules

These are **enforced**, not aspirational. Every PR must follow them.

### Strict (one thing per file)

| Artifact | Rule | Example |
|---|---|---|
| Service class | One per file | `pos.service.ts` |
| Controller class | One per file | `pos.controller.ts` |
| Repository class | One per file | `pos.repository.ts` |
| Module class | One per file | `pos.module.ts` |
| TypeORM entity | One per file | `entities/transaction.entity.ts` |
| React component | One per file (.tsx) | `Modal.tsx`, `Button.tsx` |
| React hook | One per file | `hooks/useAuth.ts` |
| Interface / type | One per file (.type.ts) | `types/accounting/expense.type.ts` |
| DTO class | One per file | `dto/create-expense.dto.ts` |

### Accepted exceptions (do **not** split)

- **Component + its `Props` interface** → same `.tsx`. The `Props` is part of the component's API.
- **Compound UI components** that ship as a unit → e.g. `Card / CardHeader / CardTitle / CardContent / CardFooter` in `Card.tsx`.
- **Parent DTO + child item DTO** → e.g. `CreateTransactionDto + TransactionItemDto` co-located when the child is only used as the parent's array element type.
- **Hook + Provider** pair (split since lint-staged hook-refresh era) → `useConfirm.ts` (hook + context) + `ConfirmProvider.tsx` (component).
- **Redux slice file** → slice + thunks + actions + selectors stay together (Toolkit convention).
- **Class + a single helper interface** that the class returns or accepts → e.g. `AuthService + AuthResult`, `CloudinaryService + Options/Result`. One helper = OK; two or more = split into a `types/` folder.
- **Utility-bundle files** (`lib/utils.ts`, `lib/exportUtils.ts`) → small pure helpers + the types they need.
- **Routes / constants files** (`FRONTEND_ROUTES`, `APP_ROUTES`, `enums.ts`) → enum/const-table aggregates.

### Naming

- **Files holding a single type/interface:** `kebab-case.type.ts`. Example: `BranchPerformance` → `branch-performance.type.ts`.
- **Frontend domain types live under** `frontend/src/types/<domain>/<name>.type.ts` with a `<domain>/index.ts` barrel.
- **Backend module types live under** `modules/<feature>/types/<name>.type.ts` with a `types/index.ts` barrel.
- **Re-export only through barrels** — `index.ts` files contain `export * from './…'` lines and nothing else. Never put logic in an `index.ts`.

---

## Barrel pattern (canonical example)

`backend/src/modules/accounting/types/index.ts`:

```ts
export * from './get-expenses-options.type';
export * from './ledger-summary-raw.type';
export * from './ledger-summary.type';
// … one line per .type.ts file in the folder
```

`frontend/src/types/index.ts`:

```ts
/**
 * LedgerPro — type barrel.
 * Each domain folder has its own index.ts that re-exports per-file types.
 * One interface / type per file under <domain>/<kebab-name>.type.ts.
 */
export * from './accounting'
export * from './admin'
// …one line per domain folder
```

Consumer code:

```ts
// ✅ Use the top-level barrel
import type { IExpense, IBranchWithMeta } from '@/types';

// ❌ Don't reach into the domain folder
import type { IExpense } from '@/types/accounting/expense.type';
```

Why: the barrel is the contract. Reaching into domain files couples consumer code to the internal layout, which makes the next refactor painful.
