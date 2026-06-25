# Admin dashboard redesign — "ShopPOS Overview" (shipped)

A redesign of the **admin** dashboard body into a business-performance cockpit,
imported from a Claude Design project ("ShopPOS Dashboard.dc.html") but rebuilt on
**our** Ledger UI Kit tokens — the design's violet accent maps to `--primary`, and
multi-series charts use the brand-aligned `CHART_COLORS`. **No rebrand.** Admin
only (cashier/worker dashboards untouched). Branch `feat/pos-mrp-units-table`
(Anpu21).

## What's on the page

- **6 KPIs** — Total Revenue (week), Gross Profit, Net Profit, Avg Order Value,
  Total Orders (+pending note), Loyalty Members. Sparklines only where a real
  daily series exists (revenue, orders); other metrics show a delta/note, never a
  fabricated trend. Missing sources fall back to an em-dash, not a zero.
- **Row 2** — per-branch **Revenue Trend** (multi-line), **Revenue by Branch**
  (donut), **Top Products** (progress bars).
- **Row 3** — **Sales by Payment Method** (donut), **Expense Breakdown** (donut),
  **Inventory Summary** (2×2 tiles).
- **Row 4** — **Recent Transactions** (table w/ branch + status pill),
  **Profitability Analysis** (3 stats + bar chart).

The old KPI/sales-overview/recent-activity/transfer cards and the embedded admin
overview were removed from the dashboard (they remain on their own pages).

## Data — fan-out, not a mega-endpoint

The page model (`features/admin-dashboard/hooks/useDashboardPage.ts`) composes
**three** queries; cross-domain composition lives in React, not a fat backend
orchestrator:

- `GET /pos/admin-dashboard` — extended (read-only, **no schema change**) with
  `salesByPaymentMethod`, `revenueByBranch`, `dailyBreakdownByBranch` (multi-line),
  `inventorySummary`, `pendingOrders`. The sales aggregations are derived
  in-service from the already-loaded week transactions, so donut slices always
  reconcile with the week KPIs. Per-branch aggregations are branch-scoped for
  MANAGER (admin = system-wide).
- `GET /accounting/profit-loss` (existing) — gross/net profit, margins,
  `expenses.byCategory`. Powers the profit KPIs, the expense donut and the
  profitability panel.
- `GET /admin/loyalty/dashboard` (existing) — `totalMembers`.

**Why fan-out:** the P&L and loyalty endpoints are ADMIN-only while
`/pos/admin-dashboard` also allows MANAGER. Inlining them would leak those
modules' authorization into the POS service; fan-out keeps each module's `@Roles`
authoritative and reuses existing services/hooks + cache keys.

## New / changed frontend layer

- `components/charts/DonutChart.tsx` (net-new, + test), `MultiLineChart.tsx`
  (net-new sibling of the single-series `AreaChart`), `chart-palette.ts` (the
  canonical `CHART_COLORS`; `branch-comparison/lib/chart-config.ts` now re-exports
  it). All brand-token fills + `useTheme()` so dark mode recolours.
- `KpiCard` gains additive `note` + `sparkHeight`; `StatusPill` learns
  `paid`/`unpaid`/`partially_paid`.
- A shared `branchColors` map keys each branch to one palette colour across the
  trend lines and the revenue donut. Payment methods use a fixed order so colours
  don't shuffle when a method has zero sales.

## Out of scope / deferred

- **Date-range / period selectors are cosmetic (v1)** — the window is fixed
  (week for sales, month-to-date for P&L); a real range picker needs range params
  on every aggregation.
- **"Add Sale"** only SPA-navigates to `/pos` (the POS page owns the branch
  guard); no sale is submitted from the dashboard.
- Dashboard i18n stays hardcoded EN (matches prior state); a later `t()` pass is
  mechanical since strings are centralised in the widgets.

## Verification

`pnpm verify` green on the frontend (typecheck + lint 0 errors + 474 tests +
build); backend `nest build` + 146 pos tests green; the admin endpoint returns
all five new fields against seed data (slices reconcile to the week revenue).
