# Feature Plan — Suppliers & Purchases (GRN)

> Phase 1 of the BUSY 21 gap-analysis roadmap. **Staff-only** (user-confirmed): suppliers are
> records, not users — no supplier login, role, or portal. All screens live in an Admin/Manager
> "Purchases" workspace. Tax/VAT and banking features are explicitly out of scope.

## Goal

Implement the BUSY 21 purchase cycle in LedgerPro: supplier master → (optional) purchase order →
**GRN / purchase voucher** (stock IN + cost capture + supplier bill, bill-by-bill) → payments
adjusted against specific bills → purchase returns (debit notes) → payables outstanding + ageing.

Today stock enters via adjustments and `Product.costPrice` is hand-typed. After this phase, every
unit of stock has a supplier, a cost, a batch, and a bill behind it — and COGS/P&L (which already
reads `cost_price`, `accounting.service.ts:211-225`) becomes real.

---

## Data model (new tables, all via TypeORM migrations in `backend/src/migrations/`)

### `suppliers`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| name | varchar(160) | required |
| contact_name / phone / email / address | varchar, nullable | |
| credit_term_days | int, default 30 | due-date = grnDate + termDays |
| opening_balance | decimal(12,2), default 0 | owed at onboarding (counts into outstanding) |
| status | enum Active/Inactive | |
| user_id | uuid, nullable | **portal-ready, unused now** |
| notes, created_by_user_id, timestamps | | |

Suppliers are global (not branch-scoped) — branches buy from the same vendors; GRNs carry the branch.

### `purchase_orders` + `purchase_order_items` (lightweight, optional step)
PO: id, po_number, supplier_id, branch_id, status `Draft → Sent → Received | Cancelled`,
expected_date, notes, created_by. Items: product_id, quantity, unit_cost. No stock/ledger effect.
A PO can be loaded into the GRN entry screen (lines prefilled) and is marked Received on conversion.

### `grns` + `grn_items` (the purchase voucher — also the supplier bill)
GRN header: id, grn_number (`GRN-YYYY-NNNNNN`), supplier_id, branch_id, purchase_order_id (nullable),
supplier_invoice_no (their paper invoice), grn_date, due_date, sub_total, discount_amount,
grand_total, **paid_amount (default 0), payment_status `Unpaid | Partially_Paid | Paid`**,
status `Received | Voided`, notes, created_by, timestamps.

GRN item: product_id, quantity (base units), unit_cost, line_total, batch_no (nullable),
expiry_date (nullable).

> Design choice: the GRN **is** the bill (1:1), so bill-by-bill = payment allocations against GRNs.
> No separate `supplier_bills` table — fewer moving parts, same BUSY semantics.

### `supplier_payments` + `supplier_payment_allocations`
Payment: id, payment_number, supplier_id, branch_id, amount, method (Cash/Bank — existing
`PaymentMethod` enum values only, nothing new), paid_at, notes, created_by.
Allocation: payment_id, grn_id, amount — each allocation bumps `grn.paid_amount` and recomputes
`payment_status`. Sum(allocations) must equal payment.amount (server-validated). Allocating against
`opening_balance` is allowed via a nullable grn_id ("opening balance" bucket).

### `purchase_returns` + `purchase_return_items` (debit note)
Header: return_number, grn_id, supplier_id, branch_id, total, reason, created_by. Items: product_id,
quantity, unit_cost. Effect: stock OUT (`StockMovement: 'Return'`, refType `'PurchaseReturn'`),
reduces the GRN's outstanding (capped at unpaid remainder; excess lowers supplier outstanding via
opening-balance bucket), posts a debit ledger entry.

### `purchase_doc_counters`
Composite PK `(doc_type, year)` + `last_seq` — one table numbering GRN/PO/payment/return docs.
Allocation mirrors `InvoiceNumberService.next(year, manager)` (`pos/services/invoice-number.service.ts`):
pessimistic_write lock inside the caller's transaction.

---

## GRN receive — the transactional core

Single `dataSource.transaction(async (manager) => …)`, mirroring `pos-write.service.ts` step 6:

1. Validate supplier active, branch scope (manager → own branch only, like `actor.branchId` checks in HR).
2. Allocate `grn_number` (counter, pessimistic lock).
3. Per line item:
   a. Upsert + lock the `Inventory` row (`pessimistic_write`, as in stock-transfers receive ~line 839);
      `quantity = quantity + recvQty` via SQL expression (no float drift).
   b. **Weighted-average cost**: `newCost = (totalOnHandAllBranches × oldCost + recvQty × unitCost) / (totalOnHand + recvQty)`
      → update `Product.costPrice` (global column, so aggregate on-hand across branches).
   c. If batch_no/expiry given → insert `ProductBatch` row (entity exists: `inventory/entities/product-batch.entity.ts`).
   d. Insert `StockMovement` `{ movementType: 'Purchase', qtyIn, balanceAfter, refType: 'GRN', refId }`
      ('Purchase' already exists in the `StockMovementType` union — unused until now).
4. Insert GRN header + items; mark linked PO Received.
5. Post ledger entry via `accounting.repository.createLedgerEntryWithManager()` —
   `entryType: Purchase` (extend `LedgerEntryType` enum + migration if missing), amount = grand_total,
   reference = grn_number. (Flat ledger today; Phase 3 re-maps to chart of accounts.)

Void GRN (admin-only) mirrors `pos-void.service.ts`: reverse stock, movement `Sale_Voided`-style
counterpart, ledger reversal — **blocked if any payment is allocated**.

---

## Backend modules (Repository Pattern, mirror `modules/hr/` layout)

```
backend/src/modules/suppliers/        suppliers.{controller,service,repository}.ts, dto/, entities/supplier.entity.ts
backend/src/modules/purchases/        purchase-orders.* , grns.* , supplier-payments.* , purchase-returns.* ,
                                      purchase-doc-number.service.ts, entities/, dto/, types/, purchases.module.ts
```

- Register both in `app.module.ts`; `PurchasesModule` imports `SuppliersModule`, `InventoryModule`
  (repo reuse), `AccountingModule` (ledger), `ProductsModule`.
- `APP_ROUTES` additions (`common/routes/app.routes.ts`), nested like `HR.LEAVES`:
  `SUPPLIERS.{BASE, BY_ID}` · `PURCHASES.{ORDERS, ORDERS_BY_ID, GRNS, GRNS_BY_ID, GRNS_VOID, PAYMENTS, RETURNS, OUTSTANDING, AGEING}`.
- Roles: `@Roles(ADMIN, MANAGER)` everywhere; managers pinned to `actor.branchId` (suppliers list is
  global read; GRN/PO/payments filtered by branch for managers — same idiom as `employee-leaves.service.list`).

### Reports (service queries, no new tables)
- **Payables outstanding**: per supplier — opening_balance + Σ(grn grand_total) − Σ(returns) − Σ(payments); drill-down lists unpaid GRNs (bill-by-bill).
- **Ageing**: unpaid GRN remainders bucketed by `due_date` age: 0-30 / 31-60 / 61-90 / 90+.
- **Purchase register**: GRNs by period/supplier/branch. **Item purchase history**: last cost per product per supplier.

---

## Frontend

- `FRONTEND_ROUTES.PURCHASES = '/purchases'` → `PurchasesWorkspacePage` (pattern:
  `InventoryWorkspacePage` + `useInventoryTab`-style `usePurchasesTab` URL-param hook).
- Tabs: **Suppliers · Purchase Orders · New GRN · Bills & Payments · Ageing**.
- Sidebar nav item (DashboardLayout): label "Purchases", roles `[ADMIN, MANAGER]`, group 'Operations'.
- GRN entry grid reuses the BUSY-grid idiom from `features/pos/components/billing-grid/`
  (entry row + keyboard nav + product search via existing product search endpoints; columns:
  Item · Qty · Unit Cost · Batch No · Expiry · Amount).
- Bills & Payments: supplier picker → unpaid GRN list with checkboxes/amount inputs → record payment
  (allocation UI); table idioms from `LeavesTable`/`LeavesTableRow`.
- Types under `frontend/src/types/purchases/*.type.ts`, exported through the `@/types` barrel.
- `queryKeys.purchases.{suppliers, supplier, orders, grns, grn, outstanding, ageing}` in `lib/queryKeys.ts`.
- TanStack Query hooks per feature folder (`features/purchases/hooks/...`), mutations invalidate
  `queryKeys.purchases.all()` + `queryKeys.inventory.*` (stock changed) + accounting keys (ledger changed).

Optional (stretch, last): "Email PO to supplier" via existing `EmailService` — no new infra.

---

## Migrations & seeds

- Migrations: create the 9 tables above + extend `LedgerEntryType` enum if `Purchase` absent.
  Generate per table-group: `pnpm migration:generate` (scripts already in `backend/package.json`).
- Seed (extend `common/seeds/admin-seed.service.ts` or a new `purchases-seed.service.ts`): 2 demo
  suppliers, 1 PO, 2 GRNs (one paid, one partially paid) so ageing/outstanding screens demo instantly.

## Testing

- Jest service specs mirroring `employee-leaves.service.spec.ts` mock style:
  - doc-counter allocation (sequential, year rollover)
  - GRN receive math: inventory increment, weighted-average costPrice, batch rows, movement rows, ledger post (transaction mock as in pos specs)
  - branch scoping: manager cannot GRN/pay outside own branch (403)
  - payment allocation: over-allocation rejected; paid_amount/payment_status transitions; opening-balance bucket
  - purchase return: stock out + outstanding reduction capped; void blocked when payments exist
  - ageing bucketing edge dates
- Frontend: hook tests for `usePurchasesTab` + payment-allocation form logic; component render tests for GRN grid commit row (follow `PosBillingGrid` test patterns).

## Commit sequence (one per slice, as Anpu21)

1. `feat(suppliers): supplier master module + UI tab`
2. `feat(purchases): GRN voucher — stock in, batches, weighted cost, ledger, bill` (+ counters)
3. `feat(purchases): purchase orders (create/send/convert to GRN)`
4. `feat(purchases): supplier payments with bill-by-bill allocation + outstanding/ageing reports`
5. `feat(purchases): purchase returns (debit notes)`
6. `chore(purchases): seeds + docs`

## Verification

1. `pnpm -C backend test` (new specs) · `pnpm -C backend exec tsc --noEmit` · same for frontend (`tsc -b`, eslint, vitest).
2. `pnpm -C backend migration:run` against dev Postgres; re-run seeds.
3. Manual (chrome-devtools MCP, as Manager): create supplier → GRN with batch+expiry → stock visible in
   Inventory (+ batch in expiry report) → `Product.costPrice` updated → ledger entry present → bill shows
   Unpaid → record partial payment → ageing/outstanding update → purchase return reduces outstanding →
   P&L COGS reflects new costs. As Manager of branch B: cannot see/post branch A purchase docs.
4. `graphify update .` after implementation.
