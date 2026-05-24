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

**Types organisation.** All shared types live under `frontend/src/types/`, organised into 15 domain folders (`accounting/`, `admin/`, `analytics/`, `api/`, `auth/`, `branch/`, `customer-requests/`, `inventory/`, `notifications/`, `pos/`, `product/`, `shop/`, `stock-transfers/`, `ui/`, `user/`). One interface per `<kebab-name>.type.ts` file, re-exported via per-domain `index.ts` and a top-level barrel. **Always import from `@/types`** — never reach into a domain folder. See [`folder-structure.md`](./folder-structure.md) for the canonical pattern. The `pos/` folder carries the Shanel-shaped types: `sale`, `sale-item`, `sale-payment`, `sale-payment-status`, `sale-status`, `sale-type`, `payment-method`, `price-level`, `search-product-row`, `product-unit-row`, `inventory-quantity`, `recent-sale-row`, `invoice-number-response`, `create-sale-payload`, `customer-search-row`, `multi-tender-bag`.

**`useConfirm` is split.** The hook + context live in `hooks/useConfirm.ts` (no JSX); the provider component lives in `hooks/ConfirmProvider.tsx`. They were split to satisfy `react-refresh/only-export-components` so Vite Fast Refresh works on the provider file.

**Testing.** Vitest + React Testing Library + jsdom. Setup in `src/test/setup.ts` (auto-cleanup + jest-dom matchers). Run with `pnpm run test` (single pass) or `pnpm run test:watch`. Co-locate tests next to the unit (`<file>.test.ts(x)`).

---

## POS workspace (cashier checkout)

`frontend/src/features/pos/` is the Shanel-shaped cashier workspace ported in May 2026. The page entry is `pages/pos/PosPage.tsx`; the canonical plan lives at `docs/superpowers/plans/2026-05-23-cashier-pos-shanel-port.md`.

### Nine sections (mirror Shanel)

Each section is a folder under `features/pos/components/`:

1. **`item-table/`** — search input, results dropdown, sticky cart table, per-line numeric cells (qty / price / discount / total), unit dropdown, price-level toggle (`RETAIL` / `WHOLESALE`).
2. **`customer-info/`** — walk-in default plus a `PosCustomerPickerModal` typeahead and a snapshot card (balance, last-purchase summary).
3. **`information-box/`** — invoice number, cashier name, branch, date / time.
4. **`invoice-total/`** — running subtotals, line discounts, sale-level discount input, tax line, change preview, grand total.
5. **`payment-method/`** — `PosPaymentMethod` segmented control (`CASH` / `CHEQUE` / `BANK_TRANSFER` / `CREDIT` / `MULTIPLE`).
6. **`payment-forms/`** — one mounted form per active tender (`PosCashTenderForm`, `PosChequeForm`, `PosBankTransferForm`, `PosCreditForm`), the `PosKeepBalanceToggle` overpayment switch, `PosPaymentBanners` for validation hints, and `PosTenderSummary` to surface the multi-tender math.
7. **`action-buttons/`** — `PosActionButtons` row of F-key shortcuts (charge, save draft, void, reprint, new sale).
8. **`recent-sale/`** — `PosRecentSaleSidebar` lists the cashier's last N sales with reprint affordance.
9. **`bill-template/`** — `PosBillTemplate` + `PosBillItemRows` + `PosBillTotalsBlock` + `PosBillPreviewModal` + `PosPrintHost` portal-to-body. The bill renders to a hidden subtree inside `document.body`; `@media print` isolates it so only the bill prints.

### Hook surface (`features/pos/hooks/`)

- **Cart + page state**: `usePosCart` (dedup productId+unitId, recompute line totals), `usePosPageState` (selected price level, customer, active tender, idempotency key reset).
- **Reads**: `usePosProductSearch`, `usePosProductUnits`, `usePosProductInventory`, `usePosRecentSales`, `usePosInvoiceNumber`, `usePosCustomerSearch`, `usePosSaleById`.
- **Writes**: `usePosCreateSale`, `usePosVoidSale`, `usePosMarkPrinted`.
- **Input / orchestration**: `usePosBarcodeScan` (window-level scan capture that ignores input focus), `usePaymentSubmit` (multi-tender validate + submit), `usePrintReceipt` (renders into `PosPrintHost` and triggers `window.print()`).

### TanStack Query keys

All POS keys live under `queryKeys.pos.*` in `frontend/src/lib/queryKeys.ts`: `searchProducts(q, limit)`, `productUnits(productId)`, `productInventory(productId)`, `productInventoryAll()`, `recentSales(limit)`, `recentSalesAll()`, `invoiceNumber()`, `customerSearch(q, limit)`, `saleById(saleId)`. Mutations invalidate `productInventoryAll`, `recentSalesAll`, and `invoiceNumber` so the sidebar, current cart line stock, and next invoice preview stay accurate.

### Print pipeline

`PosPrintHost` is a portal mounted at `document.body` so that `@media print` can collapse all other DOM to `display: none` and only render the bill subtree. Stylesheet at `components/bill-template/pos-bill-template.css`. Verified manually — Playwright not yet installed.

### Multi-tender frontend math

`frontend/src/features/pos/lib/multi-tender.ts` mirrors the backend `MultiTenderCalculatorService` so the UI can show tendered total, change, and `keepBalance` overpayment **before** submission. Covered by `multi-tender.test.ts`.

### Manual E2E

The scripted Playwright spec is parked at `frontend/e2e/cashier-pos.spec.ts.todo` pending the Playwright install. The manual smoke scenario is documented at `frontend/e2e/README.md`.
