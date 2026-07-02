# Customer Management — Implementation Plan

> Status: **PLAN — awaiting review. No code written yet.**
> Author target: commit each phase as `Dineshs737 <dinesh77saarck@gmail.com>` (no Claude co-author), one architectural change per PR/phase.

## 1. Why

LedgerPro already has rich customer-*adjacent* features — loyalty, khata/store-credit, customer groups, pickup orders, reviews, storefront profile — but every one lives in its **own silo with zero cross-links**, and there is **no customer master, no unified list, and no 360 profile**.

A "customer" is really three disjoint records stitched only by an *unenforced* phone:

| Identity | Table | Keyed by | groups/orders/reviews? |
|---|---|---|---|
| Registered | `users` (role=CUSTOMER) | `user.id` | ✅ |
| Walk-in | `loyalty_customers` | `phone` | ❌ |
| Khata holder | `credit_accounts` | `branch + phone` | ❌ |

`sales` even carries three separate customer columns (`customerUserId`, `loyaltyCustomerId`, `creditAccountId`).

## 2. Decisions (locked)

1. **Identity = stitch by phone now.** No canonical `customers` master table / FK migration. Instead a small **`customer_profiles` side-table keyed by normalized phone** holds the *management* metadata (tags, notes, segment, status, merge alias). Aggregation reads join the 3 sources by normalized phone at query time.
2. **First scope = everything:** unified list + 360 profile · edit/deactivate/merge · tags/notes/segments · analytics (LTV/RFM/churn).
3. **Audience = Admin (cross-branch) + Manager (branch-scoped)** — mirrors the loyalty/credit RBAC pattern.

Deferred (explicitly **not** in first scope): customer→staff **communication/broadcast** UI, storefront **address book**, self-service credit view, and the full canonical-master migration.

## 3. Approach — identity resolution

```
                     normalizePhone(phone)  ── reuse the SL-phone helper
                     used by loyalty & credit enroll (+94 / 0 handling)
                                    │
   users(role=CUSTOMER) ───┐        ▼
   loyalty_customers ──────┼──►  customerKey =
   credit_accounts ────────┘       phone(normalized)  when present
                                    else  "u:<userId>" (phone-less registered)
                                    │
                          LEFT JOIN customer_profiles (by customerKey)
                                    │
                                    ▼
                    one unified Customer row / 360 view
```

- **`customerKey`** is the stable id used in URLs (`/customers/:key`) and as the `customer_profiles` PK-ish key. Digits = phone; `u:<uuid>` = phone-less registered user.
- A registered user **with** a phone that matches a walk-in/khata is unified automatically. Collisions / missing phones are the known risk (see §7); the explicit **merge/link** action (Phase 3) resolves them.
- **Reuse existing scalar link columns** already on the entities (`LoyaltyAccount.userId` XOR `loyaltyCustomerId`, `CreditAccount.userId`/`loyaltyCustomerId`) for real linking — no new FK schema needed.

## 4. Phasing

| Phase | Delivers | BE | FE |
|---|---|---|---|
| **0** | Foundation: `customers` module, `customer_profiles` table, phone-normalize + resolver | ✅ | shared types |
| **1** | Unified Customers **directory** (list + search/filter/paginate) | ✅ | ✅ nav + page |
| **2** | Customer **360 profile** + jump-to-customer from orders/sales | ✅ | ✅ |
| **3** | **Lifecycle**: edit (incl. walk-in), deactivate/reactivate, merge/link | ✅ | ✅ |
| **4** | **Tags · notes · segments** | ✅ | ✅ |
| **5** | **Analytics**: LTV · RFM · churn/retention · spend trend | ✅ | ✅ |

Each phase is independently shippable, green (tsc + tests + eslint + Docker boot), and committed separately.

---

## Phase 0 — Foundation

**Backend** (`backend/src/modules/customers/`, Repository Pattern per `rules.md` §8):
- `entities/customer-profile.entity.ts` — table `customer_profiles`: `id` (uuid), `customerKey` (varchar, **unique** `@Index`), `tags` (`text[]`/jsonb, default `[]`), `notes` (text, nullable), `segment` (varchar, nullable), `status` (`'active' | 'blocked'`, default active), `displayName` (nullable override), `linkedUserId` (uuid nullable — manual merge alias), `createdByUserId`, timestamps.
- `migrations/<ts>-CreateCustomerProfiles.ts` — create table + unique index (timestamp > current max).
- `customers.repository.ts` — the **aggregation reads** (raw QueryBuilder unions across `users`/`loyalty_customers`/`credit_accounts`, joined to `customer_profiles`); + a small `customer-profiles.repository.ts` for profile CRUD.
- `lib/normalize-phone.util.ts` — **reuse** the existing SL-phone normalize/validate helper (pull it into a shared util if it currently lives inside loyalty/credit).
- `customers.module.ts`, `customers.service.ts` (skeleton), `types/*.type.ts`.
- `common/routes/app.routes.ts` — add `CUSTOMERS` block (`BASE:'customers'`, `PROFILE`, `TAGS`, `NOTES`, `SEGMENT`, `STATUS`, `LINK`, `ANALYTICS`).

**Frontend:** `types/customers/` skeleton + barrel; `services/customers.service.ts`, `lib/queryKeys/customers.ts` skeleton.

**Tests:** `normalize-phone.util.spec.ts`; `customerKey` resolution unit test.

---

## Phase 1 — Unified Customers directory

**Endpoint:** `GET /api/v1/customers` — `@Roles(ADMIN, MANAGER)`, **manager branch-scoped** (filter on `actor.branchId`), admin cross-branch. Query: `search` (name/phone/email), `type` (registered|walk-in|khata|all), `segment`, `tag`, `status`, `branchId` (admin), `page`, `limit`, `sort`. Returns paginated unified rows: `customerKey`, `displayName`, `phone`, `email`, `types[]` (badges), `homeBranch`, `loyaltyPoints`, `creditBalance`, `ordersCount`, `lifetimeSpend`, `lastSeenAt`, `tags`, `status`.
- Reuse `common/pagination/` utils. Aggregation via the Phase-0 repository (roster count + page + per-key rollups, mirroring the branch-analytics 3-query pattern).

**Frontend** (`features/customers/`):
- `FRONTEND_ROUTES.CUSTOMERS = '/customers'`; route wiring under People; **new sidebar entry** People › Customers (`config/navigation`).
- `CustomersPage.tsx` + `CustomersTable.tsx` (DataTable) + `CustomersFilters.tsx` (type/segment/tag/status/branch) + server `Pagination` + KPI strip (total customers, new this period, active khata, avg LTV).
- `hooks/useCustomersPage.ts` (URL-synced filters + `useQuery`), `services/customers.service.ts`, `lib/queryKeys/customers.ts`, `types/customers/*`.

**Tests:** service unit (branch-scope, filters); `CustomersTable`/filters render; aggregation repo shape.

---

## Phase 2 — Customer 360 profile

**Endpoint:** `GET /api/v1/customers/:key` — `@Roles(ADMIN, MANAGER)`, branch-scoped for managers. Returns the composed profile: identity records found (registered/walk-in/khata), contact, **KPIs** (LTV, order count, AOV, last purchase, loyalty balance, credit balance/limit), and **recent** slices (last N orders, last N sales, last N loyalty ledger, last N reviews, group memberships).
- Heavy/full lists (full statement, full loyalty history) are **lazy-loaded by the existing endpoints** (`/credit-accounts/:id/statement`, `/loyalty/customers/:id/history`, `/customer-orders`…) — the 360 payload stays lean.

**Frontend:**
- `FRONTEND_ROUTES.CUSTOMER_DETAIL = '/customers/:key'`; `CustomerDetailPage.tsx` = `WorkspacePage` tabbed shell: **Overview** (KPIs + identity + tags/notes) · **Orders** · **Loyalty** · **Credit/Khata** · **Groups** · **Reviews**. Reuse chart primitives for the spend sparkline.
- **Jump-to-customer**: add links from `StaffOrderDetailsModal` (customer-orders), the POS/sales customer, and the loyalty/credit tables → `/customers/:key`.

**Tests:** 360 service composition (KPIs, recent slices, branch-scope 403); `CustomerDetailPage` render (tabs, KPIs, empty states).

---

## Phase 3 — Lifecycle: edit · deactivate · merge

- **Edit:** registered → existing `PATCH /users/:id`; khata → existing `PATCH /credit-accounts/:id`; **walk-in `LoyaltyCustomer` → NEW `PATCH /loyalty/customers/:id`** (the one missing edit path). Unified edit UX in the 360 header.
- **Deactivate/reactivate:** `PATCH /customers/:key/status` writes `customer_profiles.status`. Governs the hub + storefront actions. *(Sub-decision: also block login for registered customers via a `User.isActive` guard — default OFF this phase, flag for you.)*
- **Merge/link:** `POST /customers/:key/link` — associate a walk-in/khata record with a registered user by writing the **existing** scalar link columns (`loyalty_account.userId`, `credit_account.userId`) inside a transaction + record the alias on `customer_profiles`. FE: a "Link / merge" action on the 360 with a picker + confirm (`useConfirm`).

**Tests:** walk-in edit; status toggle + branch-scope; link/merge transaction (wallet/khata re-key, idempotent, audit).

---

## Phase 4 — Tags · notes · segments

- `PATCH /customers/:key/tags`, `PATCH /customers/:key/notes`, `PATCH /customers/:key/segment` (all → `customer_profiles`). "Segment" = a named saved-filter applied in the list (start tag-based; a `customer_segments` table is a clean later add if rules get complex).
- FE: tag editor + notes panel on the 360 Overview; segment/tag chips as filters in the Phase-1 list.

**Tests:** tag add/remove, notes persist, segment filter narrows the list.

---

## Phase 5 — Analytics (LTV · RFM · churn)

- **Per-customer:** spend-over-time series + LTV + AOV on the 360 (reuse `components/charts`).
- **Cohort:** `GET /api/v1/customers/analytics` — RFM buckets (recency/frequency/monetary), churn/retention (lapsed vs active by last-purchase window), top customers by LTV. Admin cross-branch / manager branch-scoped.
- FE: a **Customers › Insights** tab — RFM matrix, retention curve, LTV leaderboard (DonutChart/BarChart/MultiLineChart primitives).

**Tests:** RFM bucketing pure fn; churn window; analytics service branch-scope.

---

## 6. Cross-cutting conventions

- **Backend:** Repository Pattern (repository ↔ service ↔ controller); routes only via `APP_ROUTES`; **filter on `actor.branchId` for managers** (security); class-validator DTOs; NestJS exceptions; one-thing-per-file; index new hot columns via entity `@Index` + a migration (dev `DB_SYNC` + prod migration, matching names).
- **Frontend:** import types only from `@/types`; SPA nav (`<Link>`/`useNavigate`), never `window.location`; `<Modal>` + `useConfirm()`; TanStack Query for server state; reuse `DataTable`, `Pagination`/`usePagination` (10/pg), `Segmented`, `Select`, `KpiCard`, chart primitives, `WorkspacePage` tabs; files ≤200 lines (enforced).
- **Verify each phase (Docker):** `docker exec -w /app ledgerpro-backend pnpm exec tsc/jest/eslint` + restart + route/index check; `ledgerpro-frontend` tsc + vitest + eslint + restart (WSL2 HMR) + hard refresh.
- **Commit per phase** as Dineshs737; branch off `integration/all-local` (feature branch e.g. `feat/customer-management`).

## 7. Risks & mitigations

- **Phone collisions / missing phone** (the whole identity approach) → `customerKey` falls back to `u:<userId>`; explicit merge/link (Phase 3) fixes false-splits; list flags "no phone". Document the limitation; the `customer_profiles` alias makes a future canonical migration non-breaking.
- **360 payload bloat** → lean summary + lazy tabs via existing endpoints.
- **Deep OFFSET on large customer bases** → cap `limit` ≤100; keyset pagination later if needed.
- **RBAC leak** → manager branch-scope enforced in the service for *every* customers endpoint; covered by tests.
- **Merge is destructive** → transactional, `useConfirm`, audit trail; start with additive linking (no row deletion).

## 8. Open sub-decisions for you

1. **Deactivate = block login too?** (block registered customer's storefront login vs. hub-status only). Default proposed: hub-status only in Phase 3.
2. **Do Phases 4 (tags/segments) + 5 (analytics) now, or ship 1–3 first** and follow with 4–5? (Both are in scope; this is only sequencing.)
3. **Communication + storefront address book** — confirmed deferred to a later effort? (Not in first scope.)
