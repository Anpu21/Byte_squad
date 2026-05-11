# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**LedgerPro** — Multi-branch supermarket POS, inventory, accounting, and customer pickup-order platform. Roles: **Admin** (cross-branch), **Manager** (branch-scoped), **Cashier** (POS only), **Customer** (storefront).

Two packages, one Postgres:

```
backend/    NestJS 11 · TypeORM · Passport JWT · socket.io · Cloudinary · Nodemailer
frontend/   Vite 7 · React 19 · TS · Tailwind 4 (@theme tokens) · Redux Toolkit · TanStack Query · socket.io-client · jsPDF · xlsx
docker-compose.yml   Postgres 16 + both apps for local dev
```

Package manager is **pnpm 10.33.2** (both packages have their own lockfile + `save-exact=true`).

---

## Skills & workflow (read first)

Before any non-trivial task, **load and apply** these Claude Code skills throughout the work — not just at review time:

- **`ui-ux-pro-max`** — every frontend change (component, layout, modal, form, page). Use it for visual hierarchy, spacing, motion, accessibility, and dark-mode parity.
- **`everything-claude-code`** — React patterns, TypeScript idioms, NestJS architecture, Docker, testing, refactor heuristics.
- **`frontend-design`** (if installed) — design tokens and component primitives.

At the start of a task, briefly state which skills apply and why. Re-check applicability when scope shifts.

**For audit / planning tasks** (e.g. "find UI issues, give me a plan"), produce a markdown deliverable first and **stop before implementing**. Don't start patching until I've reviewed the plan.

**If a fix requires backend changes from a frontend task — stop and ask.** Don't silently modify backend code.

---

## Coding standards

**All coding standards live in [`rules.md`](./rules.md).** Read it before writing or modifying any code. The rules cover:

- TypeScript (strict mode, no `any`, discriminated unions, branded IDs, enums-as-const)
- React components (naming, props, hooks, performance, forms, conditional rendering)
- TSX & layout (design tokens, mandatory UI primitives, z-index scale, accessibility, SPA navigation)
- State management (TanStack Query for server state, Redux for session-critical client state only)
- **NestJS Repository Pattern** — mandatory for all new code. Three layers: repository (DB-only), service (business logic, no TypeORM imports), controller (request/response only).
- DTOs and validation (class-validator, no optional fields without `@IsOptional()`)
- Error handling (NestJS exceptions, never raw `Error`)
- Testing, file organization, naming, commits, forbidden patterns.

When code in this repo conflicts with `rules.md`, the rule wins — the code is on its way to being fixed.

---

## Commands

Run from `frontend/` or `backend/` unless noted.

| Command | Purpose |
|---|---|
| `pnpm install --frozen-lockfile` | Install exactly what's in lockfile (CI behavior) |
| `pnpm run dev` (frontend) | Vite dev server on 5173 |
| `pnpm run start:dev` (backend) | NestJS in watch mode |
| `pnpm run build` | Production build (Vite / `nest build`) |
| `pnpm run lint` | ESLint with `--fix` |
| `pnpm run typecheck` (frontend) | `tsc --noEmit -p tsconfig.app.json` |
| `pnpm run test` (backend) | Jest |
| `pnpm run test -- <pattern>` (backend) | Run a single test file/pattern |
| `pnpm run seed:admin` (backend) | Manually run the admin seed |

**Whole stack via PM2** (config: `ecosystem.config.cjs`):

```bash
pm2 start ecosystem.config.cjs && pm2 save   # first time
pm2 start all / pm2 stop all / pm2 restart all
pm2 logs / pm2 status / pm2 monit
```

PM2 services: `byte_squad-frontend` (5173) and `byte_squad-backend` (3000). Postgres stays in Docker — `docker compose up postgres`. See `.claude/commands/pm2-*.md` for shorthand commands.

**Whole stack via Docker** (recommended for hand-off):

```bash
docker compose up -d --build       # first run
docker compose down -v             # reset Postgres volume + reseed on next up
docker compose logs -f backend
```

Frontend: http://localhost:5173 · Backend: http://localhost:3000 · Postgres: localhost:5432.

---

## Architecture — backend

**Module-per-domain** under `backend/src/modules/`: `auth`, `users`, `branches`, `products`, `inventory`, `pos`, `accounting`, `customer-requests`, `stock-transfers`, `notifications`, `admin-portal`, `email`. Cross-cutting code lives in `backend/src/common/`.

**Repository Pattern (target architecture).** New modules follow the three-layer pattern from `rules.md` §7: a separate `*.repository.ts` class owns all TypeORM calls, the service uses the repository (no TypeORM imports), and the controller is thin. Existing modules use `@InjectRepository` directly — migrate to the repository class pattern as you touch them. See `rules.md` for the canonical example.

**Auth & RBAC.** JWT strategy at `common/decorators/current-user.decorator.ts` extracts `{ id, email, role, branchId }`. Two guards always go together: `@UseGuards(JwtAuthGuard, RolesGuard)` plus `@Roles(UserRole.X, ...)`. The `@CurrentUser()` decorator pulls the validated user — use it inside handlers instead of reading `req.user` directly. **Branch-scoped endpoints filter by `actor.branchId`** for non-admins; if a manager has `branchId === null` the filter must short-circuit (else SQL `branch_id = NULL` silently returns zero rows). See `customer-requests.service.ts:listForStaff` for the canonical pattern.

**Response shape.** Every controller's return value is wrapped by the global `TransformInterceptor` (`common/interceptors/transform.interceptor.ts`) into `{ success: true, data, message: 'Success' }`. Frontend services unwrap `response.data.data`. There is no DTO/serializer layer — entities are returned directly, so any new column on an entity is automatically exposed. Don't add a sensitive field without intentionally redacting it (see `User.passwordHash` stripping in `UsersService`).

**Routes.** All paths centralised in `common/routes/app.routes.ts` under `/api/v1` prefix. Don't hand-write paths in controllers — pull from `APP_ROUTES`.

**TypeORM schema sync.** `DB_SYNC=true` in dev autocreates columns from `@Column` decorators on app boot. Production must keep `DB_SYNC=false` and apply ALTER TABLE manually (no migration folder is checked in). When you add a column to an entity, document the prod ALTER in your PR.

**Cloudinary** (`common/cloudinary/cloudinary.service.ts`) is `@Global()`. Inject `CloudinaryService` directly anywhere; no module import needed. `uploadImage(file, opts)` takes a Multer file; `uploadBuffer(buffer, opts)` takes a raw Buffer (used for backend-generated QR PNGs in `customer-requests.service`). Service falls back gracefully when env vars missing — wrap calls in try/catch so absent Cloudinary doesn't break the parent flow.

**Real-time.** `notifications.gateway.ts` exposes `broadcast(event, payload)` and `sendToUser(userId, payload)` on the `/notifications` socket.io namespace. Customer-request creation emits `customer-request:created` so manager dashboards refetch live. Notifications are also persisted in Postgres for offline replay.

**Seeding.** `common/seeds/admin-seed.service.ts` runs on `OnModuleInit`. It is idempotent — checks-by-name before inserts. Re-running is safe; reset by dropping the postgres volume.

---

## Architecture — frontend

**Routing.** `routes/AppRouter.tsx` is the single source of truth. Three layouts: `AuthLayout`, `DashboardLayout` (admin/manager/cashier), `CustomerLayout` (storefront). `ProtectedRoute` enforces `allowedRoles`; `PublicRoute` redirects logged-in users; `SmartRedirect` at `/` dispatches to the right home per role; `FirstSetupOnly` wraps `/select-branch` so customers with a branchId already set get redirected to `/shop/profile`.

**State split.** Redux Toolkit holds session-critical state only (`auth` slice, `shopCart` slice — items only, no branchId). Server data lives in TanStack Query (`['profile']`, `['customer-requests']`, `['shop-products']`, `['shop-branches-with-staff']`, etc.). When you mutate, invalidate by query key — these keys are cross-component contracts.

**Pickup-branch source of truth.** The customer's pickup branch is **always `user.branchId`** (auth slice, persisted via `userService.updateMyBranch` + `setUserBranch` action). The shopping cart does not hold a separate branch — checkout, catalog, and product pages all read `user.branchId`. Changing branches dispatches `clearShopCart()` because pricing/availability are branch-specific.

**Design system.** All colors, spacing, radii, shadows come from CSS vars in `frontend/src/index.css` exposed to Tailwind via `@theme`. **Never hand-write** `bg-[#…]`, `text-slate-*`, `border-white/10` — use semantic tokens (`bg-surface`, `text-text-1`, `border-border-strong`, `text-danger`, `text-accent`, `bg-primary-soft`, etc.). Light/dark themes are paired via `[data-theme="dark"]`; `useTheme()` flips it and persists to localStorage. A pre-React inline script in `index.html` applies the saved theme before paint to prevent FOUC. A codemod at `frontend/scripts/migrate-tokens.mjs` is safe to re-run if dark literals slip in via PRs.

**UI primitives are mandatory.** `frontend/src/components/ui/` has hardened versions of `Modal` (focus trap, ESC, scroll lock, deferred-unmount exit animation), `Input`, `Button`, `Card`, `KpiCard`, `Pill`, `StatusPill`, `Avatar`, `Logo`, `Spark`, `PageHeader`, `Segmented`, `Stepper`, `EmptyState`, `Toolbar`, `ThemeToggle`. `useConfirm()` from `hooks/useConfirm.tsx` is the project's promise-based replacement for `window.confirm()` — it returns `Promise<boolean>` and renders a themed `ConfirmDialog`.

**Z-index scale.** Defined as CSS vars (`--z-sticky 20`, `--z-dropdown 30`, `--z-overlay 40`, `--z-modal 50`, `--z-toast 60`) with matching utility classes. Use `z-modal`, `z-dropdown`, etc. — never raw `z-50`.

**Charts.** `components/charts/AreaChart.tsx` and `BarChart.tsx` wrap Recharts and read CSS variables, so they auto-reskin on theme toggle.

**Live updates.** `services/socket.service.ts` exposes a memoised `getNotificationSocket()` connected to the `/notifications` namespace. Vite dev proxies `/api` and `/socket.io` (with `ws: true`) to `BACKEND_API_URL`. Pages that need live updates subscribe in a `useEffect` and invalidate the relevant query.

**Heavy export libs (`jspdf`, `xlsx`)** are intentionally lazy-loaded by `lib/exportUtils` to keep the initial bundle small.

**`useScanDetection` hook** captures fast keystroke sequences as barcode scans at the `window` level — it ignores events when the active element is an `<input>/<textarea>/<select>/[contenteditable]` to avoid stealing user typing.

---

## Stock-transfer state machine

Pessimistic-locked, transactional, audit-tracked. Manager creates → Admin approves/rejects → source Manager ships (decrements stock) → destination Manager receives (increments stock) → COMPLETED. Admin can cancel pre-ship. Every state change emits a notification to the relevant party.

---

## Key cross-package conventions

- **Always use `APP_ROUTES` (backend) and `FRONTEND_ROUTES` (frontend)** for paths. Never hand-write.
- **Backend filter on branchId for non-admins.** Forgetting this is a security bug.
- **Frontend SPA navigation only** — `<Link>` / `useNavigate()`. Never `window.location.*`. CI typecheck and the audit codemod will catch slips.
- **No `window.confirm()`** — use `useConfirm()`.
- **No inline modal divs** — wrap with `<Modal>` from `components/ui/`.
- **Idempotency keys on POS checkout** — `X-Idempotency-Key` header guards double-submit.
- **New backend modules use the Repository Pattern** (`rules.md` §7). No `@InjectRepository` in new service files.
- **Full forbidden-patterns list:** `rules.md` §16.

---

## Default seeded accounts (dev only)

| Role | Email | Password | Branch |
|---|---|---|---|
| Admin | `admin@ledgerpro.com` | `Admin@123` | Main |
| Manager | `manager.main@ledgerpro.com` | `Manager@123` | Main |
| Cashier | `cashier@ledgerpro.com` | `Cashier@123` | Main |

Plus admin/manager/cashier accounts for Downtown and Suburban branches; full table in `README.md`.

---

## CI

`.github/workflows/backend-ci.yml` (install · lint · test · build) and `frontend-ci.yml` (install · lint · typecheck · build). Both pin `pnpm@10.33.2` via `pnpm/action-setup@v4`.