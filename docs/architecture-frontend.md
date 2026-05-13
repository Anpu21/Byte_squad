# Frontend architecture

> Loaded on demand from [`CLAUDE.md`](../CLAUDE.md).

Full folder tree in [`folder-structure.md`](./folder-structure.md).

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

**Types organisation.** All shared types live under `frontend/src/types/`, organised into 15 domain folders (`accounting/`, `admin/`, `analytics/`, `api/`, `auth/`, `branch/`, `customer-requests/`, `inventory/`, `notifications/`, `pos/`, `product/`, `shop/`, `stock-transfers/`, `ui/`, `user/`). One interface per `<kebab-name>.type.ts` file, re-exported via per-domain `index.ts` and a top-level barrel. **Always import from `@/types`** — never reach into a domain folder. See [`folder-structure.md`](./folder-structure.md) for the canonical pattern.

**`useConfirm` is split.** The hook + context live in `hooks/useConfirm.ts` (no JSX); the provider component lives in `hooks/ConfirmProvider.tsx`. They were split to satisfy `react-refresh/only-export-components` so Vite Fast Refresh works on the provider file.

**Testing.** Vitest + React Testing Library + jsdom. Setup in `src/test/setup.ts` (auto-cleanup + jest-dom matchers). Run with `pnpm run test` (single pass) or `pnpm run test:watch`. Co-locate tests next to the unit (`<file>.test.ts(x)`).
