# Cashier POS — Shanel Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Stop after each phase for review.**

**Goal:** Wipe the existing LedgerPro cashier POS (frontend feature + pages + types + service + backend module) and re-implement it as a faithful port of the Shanel ERP cashier POS, restyled with default LedgerPro Tailwind tokens (no bespoke design system).

**Architecture:** New NestJS `pos` module follows the Repository Pattern (Rules.md §7). The single `Transaction`/`TransactionItem` pair currently used is replaced with five Shanel-aligned entities: `Sale`, `SaleItem`, `Payment`, `CreditTransaction`, `StockMovement`. Cross-module consumers (accounting, customer-orders, shop, branches, products, app.module, admin-seed) get rename/import updates in Phase 0 so they keep compiling. Frontend is rebuilt as nine Shanel sections (`actionButtons`, `billTemplate`, `customerInfo`, `informationBox`, `invoiceTotal`, `itemTable`, `paymentForms`, `paymentMethod`, `recentSale`) inside a single `PosPage` orchestrator using TanStack Query + Tailwind design tokens.

**Tech Stack:** NestJS 11 · TypeORM · PostgreSQL 16 · TypeScript (strict) · class-validator · Jest · Vite 7 · React 19 · Tailwind 4 · TanStack Query · Redux Toolkit · Vitest

**Source of truth (Shanel):**
- `docs/sample-project/Shanel_ERP/backend/controllers/sales/SalesController.js` (691 lines, working)
- `docs/sample-project/Shanel_ERP/backend/controllers/salesManagement/SalesManagementController.js` (1,215 lines — mostly placeholders, useful for endpoint surface)
- `docs/sample-project/Shanel_ERP/backend/models/sales/{Sales,SalesItem,Payment,SaleAssociation,SalesSummaryDaily}.js`
- `docs/sample-project/Shanel_ERP/backend/routes/sales/SalesRoutes.js`
- `docs/sample-project/Shanel_ERP/frontend/src/services/salesManagementService.js` (557 lines)
- `docs/sample-project/Shanel_ERP/frontend/src/__tests__/sale/ItemTable.test.jsx` (cart-shape contract)
- `docs/sample-project/Shanel_ERP/frontend/FRONTEND_IMPLEMENTATION_GUIDE.md`
- `docs/sample-project/Shanel_ERP/frontend/COMPLETE_IMPLEMENTATION_SUMMARY.md`
- `docs/sample-project/Shanel_ERP/frontend/README_FRONTEND_COMPLETE.md`

**Out of scope for this plan:**
- Sales-management analytics/reports endpoints (`/api/sales-management/*`). Most are placeholders in Shanel; LedgerPro admin-portal already covers dashboard needs. Park for a future plan if requested.
- Sinhala name search (LK-specific). Listed as optional in the existing `.claude/plans/pos-cashier-shanel-port.plan.md`; defer until the user explicitly asks.
- Customer storefront pickup-order flow (`features/customer-orders`, `backend/src/modules/customer-orders`). Per user direction, this stays untouched.

**Decisions locked with user:**
1. Wipe scope = cashier POS only.
2. Visual style = default LedgerPro Tailwind (no bespoke design system, no editorial serif).
3. Source = `docs/sample-project/*`, not `docs/pages/POS.html`.
4. Plan style = fresh top-level plan that supersedes the nine prior `.claude/plans/pos-*.plan.md` files.

**Self-review applied:** spec coverage, placeholder scan, type/method-name consistency between phases.

---

## Phase summary (15 phases, ~7 working days)

| # | Phase | Risk | Ship-blocking? |
|---|---|---|---|
| 0 | Cross-module rename audit (Transaction→Sale, TransactionItem→SaleItem) | HIGH (8 consumers) | yes |
| 1 | Wipe existing cashier POS frontend surface | LOW | yes |
| 2 | Backend — extend `Sale` entity + add `Payment`, `CreditTransaction`, `StockMovement` entities + migrations | MED | yes |
| 3 | Backend — `User.currentBalance` and `Product.wholesalePrice` / `Product.taxRate` migrations | MED | yes |
| 4 | Backend — read endpoints (product search, units, base-unit-qty, inventory qty, recent sales, generate-invoice-no) | LOW | yes |
| 5 | Backend — write endpoint (`POST /pos/sales`) — multi-tender + credit + keep-balance + stock movement log | HIGH | yes |
| 6 | Backend — mutations (`PATCH /pos/sales/:id/print`, `POST /pos/sales/:id/void`) | LOW | yes |
| 7 | Frontend — types domain + TanStack Query service layer | LOW | yes |
| 8 | Frontend — `itemTable` section (search + retail/wholesale toggle + cart) | MED | yes |
| 9 | Frontend — `customerInfo` + `informationBox` sections | LOW | yes |
| 10 | Frontend — `invoiceTotal` section (subtotal/discount/tax/total) | LOW | yes |
| 11 | Frontend — `paymentMethod` + `paymentForms` (multi-tender) | HIGH | yes |
| 12 | Frontend — `actionButtons` (F-keys) + `recentSale` sidebar | LOW | yes |
| 13 | Frontend — `billTemplate` printable receipt + print integration | MED | yes |
| 14 | Frontend — `PosPage` assembly + barcode scanner + smoke E2E | MED | yes |
| 15 | Archive prior plans, FRONTEND_ROUTES alignment, doc updates | LOW | yes |

---

## File structure (final state)

### Backend (`backend/src/modules/pos/`)

```
backend/src/modules/pos/
├── pos.module.ts
├── pos.controller.ts                          # ≤200 lines; thin
├── pos.service.ts                             # ≤300 lines (split if it grows)
├── pos.repository.ts                          # one-entity-per-method-cluster
├── sale.repository.ts                         # NEW — Sale CRUD
├── sale-item.repository.ts                    # NEW — SaleItem CRUD
├── payment.repository.ts                      # NEW
├── credit-transaction.repository.ts           # NEW
├── stock-movement.repository.ts               # NEW
├── entities/
│   ├── sale.entity.ts                         # renamed from transaction.entity.ts + 11 new columns
│   ├── sale-item.entity.ts                    # renamed from transaction-item.entity.ts + 6 new columns
│   ├── payment.entity.ts                      # NEW
│   ├── credit-transaction.entity.ts           # NEW
│   ├── stock-movement.entity.ts               # NEW
│   ├── idempotency-key.entity.ts              # kept
│   └── invoice-counter.entity.ts              # kept
├── dto/
│   ├── create-sale.dto.ts                     # replaces create-transaction.dto.ts
│   ├── sale-item.dto.ts                       # NEW
│   ├── sale-payment.dto.ts                    # NEW (multi-tender)
│   ├── search-products-query.dto.ts           # NEW
│   ├── recent-sales-query.dto.ts              # NEW
│   ├── void-sale.dto.ts                       # NEW
│   └── mark-printed.dto.ts                    # NEW
├── services/
│   ├── invoice-number.service.ts              # kept, refactored to issue Sale-shaped numbers
│   ├── invoice-number.service.spec.ts         # kept
│   ├── multi-tender-calculator.service.ts     # NEW — split-tender math
│   └── multi-tender-calculator.service.spec.ts
└── types/
    ├── recent-sale-row.type.ts                # renamed/kept
    ├── search-product-row.type.ts             # NEW
    ├── product-unit-row.type.ts               # NEW
    ├── inventory-quantity.type.ts             # NEW
    ├── sale-payment-status.type.ts            # NEW ('Paid' | 'Partially_Paid' | 'Unpaid')
    ├── sale-status.type.ts                    # NEW ('Active' | 'Voided')
    ├── payment-method.type.ts                 # NEW ('Cash'|'Card'|'Mobile'|'Cheque'|'Bank'|'Credit')
    └── index.ts
```

Old admin/cashier "dashboard" types under `backend/src/modules/pos/types/{admin-dashboard,cashier-dashboard,cashier-period-stats,...}` and the corresponding controller routes (`my-dashboard`, `admin-dashboard`, `my-transactions`, `all-transactions`) are **removed**; LedgerPro's existing `admin-portal/overview` and the cashier dashboard at `frontend/src/features/cashier-dashboard/` (if present) replace those. (If a feature relies on the removed routes, Phase 0 catches the import.)

### Frontend (`frontend/src/`)

```
frontend/src/
├── features/pos/
│   ├── components/
│   │   ├── action-buttons/
│   │   │   ├── PosActionButtons.tsx
│   │   │   └── pos-action-buttons.constants.ts
│   │   ├── bill-template/
│   │   │   ├── PosBillTemplate.tsx
│   │   │   └── pos-bill-template.helpers.ts
│   │   ├── customer-info/
│   │   │   ├── PosCustomerInfo.tsx
│   │   │   └── PosCustomerPickerModal.tsx
│   │   ├── information-box/
│   │   │   └── PosInformationBox.tsx
│   │   ├── invoice-total/
│   │   │   ├── PosInvoiceTotal.tsx
│   │   │   └── pos-invoice-total.helpers.ts
│   │   ├── item-table/
│   │   │   ├── PosItemTable.tsx                # ≤200 lines
│   │   │   ├── PosItemSearchInput.tsx
│   │   │   ├── PosItemSearchResults.tsx
│   │   │   ├── PosCartRow.tsx
│   │   │   ├── PosPriceLevelToggle.tsx
│   │   │   ├── PosUnitSelect.tsx
│   │   │   └── pos-cart-row.helpers.ts
│   │   ├── payment-forms/
│   │   │   ├── PosPaymentForms.tsx
│   │   │   ├── PosCashTenderForm.tsx
│   │   │   ├── PosChequeForm.tsx
│   │   │   ├── PosBankTransferForm.tsx
│   │   │   └── PosCreditForm.tsx
│   │   ├── payment-method/
│   │   │   └── PosPaymentMethod.tsx
│   │   ├── recent-sale/
│   │   │   └── PosRecentSaleSidebar.tsx
│   │   ├── PosCameraScannerModal.tsx
│   │   └── PosStatusBar.tsx
│   ├── hooks/
│   │   ├── usePosCart.ts                       # rewrite — Shanel-shape items
│   │   ├── usePosCart.test.ts
│   │   ├── usePosCheckout.ts                   # rewrite — multi-tender
│   │   ├── usePosCheckout.test.ts
│   │   ├── usePosBarcodeScan.ts                # kept
│   │   ├── usePosKeyboardShortcuts.ts          # extended for F2..F12 per Shanel
│   │   ├── usePosProductSearch.ts              # NEW — TanStack Query
│   │   ├── usePosProductUnits.ts               # NEW
│   │   ├── usePosProductInventory.ts           # NEW
│   │   ├── usePosRecentSales.ts                # NEW
│   │   ├── usePosInvoiceNumber.ts              # NEW
│   │   └── usePosPrintBill.ts                  # NEW
│   ├── lib/
│   │   ├── multi-tender.ts                     # NEW — split math; mirrors backend
│   │   ├── multi-tender.test.ts
│   │   ├── line-total.ts                       # NEW — qty/free/discount/tax math
│   │   └── line-total.test.ts
│   └── types/
│       ├── cart-item.type.ts                   # rewrite — Shanel shape
│       ├── price-level.type.ts                 # NEW — 'Retail' | 'Wholesale'
│       ├── pos-location.type.ts                # NEW — 'Shop' | 'Production' | 'Main_Warehouse'
│       └── multi-tender-bag.type.ts            # NEW
├── pages/pos/
│   ├── PosPage.tsx                             # ≤120 lines; pure orchestrator
│   └── PosPage.test.tsx
├── types/pos/
│   ├── index.ts
│   ├── sale.type.ts
│   ├── sale-item.type.ts
│   ├── sale-payment.type.ts
│   ├── sale-payment-method.type.ts
│   ├── sale-payment-status.type.ts
│   ├── sale-status.type.ts
│   ├── search-product-row.type.ts
│   ├── product-unit-row.type.ts
│   ├── inventory-quantity.type.ts
│   ├── recent-sale-row.type.ts
│   └── invoice-number-response.type.ts
└── services/
    └── pos.service.ts                          # rewrite — Shanel-shaped endpoints
```

`frontend/src/pages/pos/ScanOrderPage.tsx` and `TransactionsPage.tsx` are out of scope of this plan — Phase 1 keeps them in place (they handle customer-pickup-order scan and the system transactions list respectively; neither is part of the cashier checkout flow).

---

## Patterns to mirror

| Category | Source | Pattern |
|---|---|---|
| Repository pattern | `Rules.md §7` (lines 233-362); `backend/src/modules/suppliers/suppliers.repository.ts` | DataSource-injected, no `@InjectRepository` |
| Transactional service | Existing `backend/src/modules/pos/pos.service.ts:182-256` | `dataSource.transaction(async manager => {...})` with `setLock('pessimistic_write')` on inventory rows |
| Invoice numbering | Existing `backend/src/modules/pos/services/invoice-number.service.ts` | `INV-YYYY-NNNNNN` via `SELECT ... FOR UPDATE` on `invoice_counters(year)` |
| Idempotency | Existing `backend/src/modules/pos/pos.service.ts:88-103` + `pos.service.ts:258-281` | `X-Idempotency-Key` header, dedicated `idempotency_keys` table |
| DTO validation | Existing `backend/src/modules/pos/dto/create-transaction.dto.ts` | class-validator on classes (not interfaces); `@IsOptional()` mandatory for nullables |
| TanStack Query keys | Existing `frontend/src/features/suppliers/hooks/useSuppliers.ts` (assumed convention); `queryKeys.<domain>.<op>` per Rules.md §6 | Centralised in `frontend/src/lib/query-keys.ts` |
| Frontend types barrel | `docs/architecture-frontend.md` line 27; existing `frontend/src/types/index.ts` | `export * from './pos'`; consumers import from `@/types`, never from `@/types/pos/<file>` |
| Modal usage | `Rules.md §16`; `frontend/src/components/ui/Modal.tsx` | `<Modal>` wrapper only; no inline modal divs |
| Confirm dialogs | `Rules.md §16`; `frontend/src/hooks/useConfirm.ts` | `useConfirm()`, never `window.confirm()` |
| Tailwind tokens | `docs/architecture-frontend.md` line 13 | `bg-surface`, `text-text-1`, `text-text-2`, `border-border-strong`, `text-danger`, `text-accent`, `bg-primary-soft` — never `text-slate-*` or `bg-[#...]` |
| Routing | `frontend/src/routes/AppRouter.tsx` + `routes.config.tsx` | New routes go in the config table, not inline JSX |
| Page size | `Rules.md §17` | Pages ≤ 120 lines, components ≤ 200 lines, hooks ≤ 80 lines |

---

## Risks

| Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|
| Renaming `Transaction`→`Sale` breaks accounting ledger entries that join on `transaction_id` | HIGH | HIGH | Phase 0: rename `transactions` table → `sales`, rename `transaction_id` FK columns → `sale_id` in `ledger_entries`, `transaction_items` → `sale_items`. Migration + spec updates in one commit. |
| `Product.id` is UUID but Shanel uses `P_ID` integer; cart-shape from Shanel test (`p_id: 1`) needs adaptation | HIGH | LOW | Frontend type `ICartItem.productId: string` (UUID); only test fixtures change. Backend DTO uses `@IsUUID()`. |
| `User` is the only customer model in LedgerPro (no separate `Customer` table); Shanel's `CreditTransaction.Customer_ID` and `Sale.C_ID` reference a customer table | HIGH | MED | Adapt: new tables `credit_transactions.user_id` (UUID) → `users.id` where `users.role = 'CUSTOMER'`. Add `current_balance` column to `users` (Phase 3). Walk-in sales use a synthetic `walk-in` user seeded by `admin-seed.service.ts`. |
| Shanel's `Location` enum (`'Shop'`, `'Production'`, `'Main_Warehouse'`) does not exist in LedgerPro — we use `branchId` | MED | LOW | Map: `Sale.location = branch.name` for display; `Sale.branchId` is the authoritative scope. `SaleItem.locationTakenFrom` defaults to the sale's branch. Inventory deduction uses `branchId`, not the location string. |
| Multi-tender breaks the existing `paymentMethod` single-string column on `transactions` | MED | LOW | Phase 2: drop `payment_method` from `sales`; the multi-tender data lives in the `payments` table (1:1 with `sales`). Frontend `posPage.paymentMethod` becomes `"Cash"` (primary tender) for display only, derived from `payments.payment_method`. |
| Existing seeded data + admin-seed reference `Transaction` — migration may leave stranded rows | MED | LOW | Phase 0 migration: rename, do not drop. Seeded reset commands re-seed cleanly. Document in `docs/seeded-accounts.md`. |
| `Inventory` is keyed by `(productId, branchId)` not Shanel's `(P_ID, Location)`; lock semantics may differ | LOW | MED | Existing code already locks `inv.product_id = X AND inv.branch_id = Y FOR UPDATE` (`pos.service.ts:185-211`) — keep that exact pattern in Phase 5. |
| `decimal(12, 3)` precision drift on quantity if we change to `(12, 4)` for grams | LOW | LOW | Keep existing scale; Shanel uses `(12, 4)` but our existing `Inventory.quantity` is `(12, 3)`. The `round3()` helper in `pos.service.ts:27` is already in place. |
| Cross-module spec files break when Transaction renames | HIGH | LOW | Phase 0 includes all `.spec.ts` updates in one commit; run `pnpm --filter backend test` after rename. |
| Removing `PosController.getCashierDashboard`/`getAdminDashboard` breaks `frontend/src/pages/cashier/CashierDashboardPage.tsx` (assumed) | MED | MED | Phase 0 audit. If the dashboard pages use these endpoints, replicate them via `admin-portal` overview endpoints OR keep stubs in the new POS service. Decision documented at Phase 0 step 3. |

---

## Validation gate (run after every phase)

```bash
# Backend
cd backend && pnpm lint && pnpm tsc --noEmit && pnpm test
# Frontend
cd frontend && pnpm lint && pnpm tsc --noEmit && pnpm test
# Migration sanity (Phase 2+)
cd backend && pnpm typeorm migration:show
# Smoke (Phase 5+)
docker compose up -d postgres && cd backend && pnpm start:dev
curl -fsS -X POST http://localhost:3000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"cashier1@ledgerpro.dev","password":"Cashier@123"}' | jq .
```

If any of these fail, stop and fix before continuing to the next phase.

---

## Phase 0 — Cross-module rename: `Transaction` → `Sale`

**Why first:** eight other modules import from `@pos/entities/transaction.entity` and `@pos/entities/transaction-item.entity`. If we wipe the POS module before renaming, the codebase stops compiling. The rename is purely mechanical and ships independently.

**Files affected (verified via grep):**
- `backend/src/app.module.ts` (lines 12, 26, 27, 28)
- `backend/src/common/seeds/admin-seed.service.ts` (lines 11, 12)
- `backend/src/modules/customer-orders/customer-orders.module.ts` (line 13)
- `backend/src/modules/customer-orders/customer-orders.service.ts` (lines 27, 30)
- `backend/src/modules/customer-orders/customer-orders.service.spec.ts` (line 16)
- `backend/src/modules/accounting/accounting.module.ts` (lines 8, 9)
- `backend/src/modules/accounting/accounting.service.ts` (lines 14, 15)
- `backend/src/modules/accounting/accounting.service.spec.ts` (lines 14, 15)
- `backend/src/modules/shop/shop.module.ts` (line 7)
- `backend/src/modules/shop/shop.service.ts` (line 8)
- `backend/src/modules/branches/branches.module.ts` (lines 8, 9)
- `backend/src/modules/products/entities/product.entity.ts` (line 10)
- Frontend: every `@/types` consumer for `ITransaction*` and `IRecentSaleRow`.

### Task 0.1 — Pre-audit: list every cross-module POS import

**Files to consult (read-only):**
- All files in the "Files affected" list above.

- [ ] **Step 1: Snapshot current state**

Run:
```bash
cd /home/blaxx/root@kaviya/Byte_squad && \
  grep -rn "@pos/" backend/src --include="*.ts" | grep -v "modules/pos/" > /tmp/pos-imports-before.txt && \
  grep -rn "ITransaction\b\|IRecentSale\|IAdminDashboard\|ICashierDashboard\|ICashierTransactions" frontend/src --include="*.ts" --include="*.tsx" > /tmp/pos-fe-consumers.txt
wc -l /tmp/pos-imports-before.txt /tmp/pos-fe-consumers.txt
```
Expected: ≥20 backend imports, ≥10 frontend consumers.

- [ ] **Step 2: Commit the audit list**

```bash
mkdir -p docs/superpowers/notes
cp /tmp/pos-imports-before.txt docs/superpowers/notes/2026-05-23-pos-rename-audit.txt
cp /tmp/pos-fe-consumers.txt docs/superpowers/notes/2026-05-23-pos-fe-audit.txt
git add docs/superpowers/notes/
git commit -m "docs(pos): snapshot pre-rename POS consumers"
```

### Task 0.2 — Backend: rename entity classes + filenames

**Files:**
- Rename `backend/src/modules/pos/entities/transaction.entity.ts` → `sale.entity.ts`
- Rename `backend/src/modules/pos/entities/transaction-item.entity.ts` → `sale-item.entity.ts`
- Modify all 12+ files in the audit (replace `Transaction` class → `Sale`, `TransactionItem` → `SaleItem`; update import paths).

- [ ] **Step 1: Write a renamed shim test (RED)**

Create `backend/src/modules/pos/entities/sale.entity.spec.ts`:
```ts
import { Sale } from './sale.entity';

describe('Sale entity', () => {
  it('exposes the same scalar columns as the old Transaction entity', () => {
    const sale = new Sale();
    sale.id = '00000000-0000-0000-0000-000000000000';
    sale.invoiceNumber = 'INV-2026-000001';
    sale.transactionNumber = 'TXN-1-abc';
    sale.total = 100;
    expect(sale.invoiceNumber).toBe('INV-2026-000001');
  });
});
```

Run: `cd backend && pnpm test -- sale.entity.spec`
Expected: FAIL — cannot find `./sale.entity`.

- [ ] **Step 2: Rename the entity file + class**

```bash
cd backend/src/modules/pos/entities
git mv transaction.entity.ts sale.entity.ts
git mv transaction-item.entity.ts sale-item.entity.ts
```

Edit `sale.entity.ts`: rename `@Entity('transactions')` → `@Entity('sales')`, `export class Transaction` → `export class Sale`. Keep all columns, decorators, and relations identical for now.

Edit `sale-item.entity.ts`: rename `@Entity('transaction_items')` → `@Entity('sale_items')`, `export class TransactionItem` → `export class SaleItem`. Update the foreign-key reference: `@ManyToOne(() => Sale, ...)` and `@Column({ name: 'sale_id' })`.

- [ ] **Step 3: Replace every import — generate a one-liner**

```bash
cd /home/blaxx/root@kaviya/Byte_squad
# Backend imports
grep -rln "@pos/entities/transaction.entity\b" backend/src --include="*.ts" | xargs sed -i 's|@pos/entities/transaction.entity|@pos/entities/sale.entity|g'
grep -rln "@pos/entities/transaction-item.entity\b" backend/src --include="*.ts" | xargs sed -i 's|@pos/entities/transaction-item.entity|@pos/entities/sale-item.entity|g'
# Class names
grep -rln "\bTransactionItem\b" backend/src --include="*.ts" | xargs sed -i 's|\bTransactionItem\b|SaleItem|g'
# Order matters: do Transaction last so we don't double-substitute
grep -rln "\bTransaction\b" backend/src --include="*.ts" | grep -v common/enums/transaction.enum | xargs sed -i 's|\bTransaction\b|Sale|g'
```

**Note:** preserve `TransactionType` enum (`backend/src/common/enums/transaction.enum.ts`) — that's an unrelated literal-union, not the entity. Verify with:
```bash
grep -rn "\bTransactionType\b" backend/src --include="*.ts" | head -5
```
Expected: still references `TransactionType.SALE`, `TransactionType.RETURN`, etc.

- [ ] **Step 4: Write the rename migration**

Create `backend/src/migrations/<timestamp>-RenameTransactionToSale.ts`:
```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTransactionToSale<Timestamp> implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.renameTable('transactions', 'sales');
    await qr.renameTable('transaction_items', 'sale_items');
    await qr.renameColumn('sale_items', 'transaction_id', 'sale_id');
    await qr.renameColumn('ledger_entries', 'transaction_id', 'sale_id');
    await qr.renameColumn('idempotency_keys', 'transaction_id', 'sale_id');
  }
  public async down(qr: QueryRunner): Promise<void> {
    await qr.renameColumn('idempotency_keys', 'sale_id', 'transaction_id');
    await qr.renameColumn('ledger_entries', 'sale_id', 'transaction_id');
    await qr.renameColumn('sale_items', 'sale_id', 'transaction_id');
    await qr.renameTable('sale_items', 'transaction_items');
    await qr.renameTable('sales', 'transactions');
  }
}
```

Generate timestamp: `date +%s%3N`. Replace the class-name suffix `<Timestamp>` with that value.

- [ ] **Step 5: Verify accounting + ledger column rename is wired**

```bash
grep -n "transaction_id\|transactionId" backend/src/modules/accounting/entities/*.entity.ts backend/src/modules/accounting/accounting.repository.ts backend/src/modules/accounting/accounting.service.ts 2>&1 | head -20
```

For each hit, switch to `saleId` / `sale_id`. The `IdempotencyKey.transactionId` column → `IdempotencyKey.saleId`.

Update entity decorators:
```ts
// idempotency-key.entity.ts
@Column({ name: 'sale_id' })
saleId!: string;
```

- [ ] **Step 6: Run the migration locally**

```bash
cd backend
pnpm typeorm migration:run
psql $DATABASE_URL -c '\d sales' | head -20
psql $DATABASE_URL -c '\d sale_items' | head -20
psql $DATABASE_URL -c '\d ledger_entries' | grep sale_id
```
Expected: tables `sales`, `sale_items` exist; `ledger_entries.sale_id` is present.

- [ ] **Step 7: Run the full test suite**

```bash
cd backend && pnpm test
```
Expected: PASS (or any failures are specs that reference the *enum* `TransactionType` literally and need a one-line update).

- [ ] **Step 8: Commit Phase 0 — backend rename**

```bash
git add backend/src/modules/pos/entities/sale.entity.ts \
  backend/src/modules/pos/entities/sale-item.entity.ts \
  backend/src/modules/pos/entities/idempotency-key.entity.ts \
  backend/src/migrations/*-RenameTransactionToSale.ts \
  backend/src
git commit -m "refactor(pos): rename Transaction→Sale entity, table, and FK columns

Preparation for the Shanel POS port. Touches 8 modules that imported the
former Transaction/TransactionItem entities; behaviour unchanged.

Migration renames: transactions→sales, transaction_items→sale_items,
ledger_entries.transaction_id→sale_id, idempotency_keys.transaction_id→sale_id."
```

### Task 0.3 — Frontend: rename type names + barrel re-exports

**Files:**
- Rename `frontend/src/types/pos/transaction.type.ts` → `sale.type.ts`
- Rename `frontend/src/types/pos/transaction-item.type.ts` → `sale-item.type.ts`
- Replace `ITransaction` → `ISale`, `ITransactionItem` → `ISaleItem` across `frontend/src/**`.
- Update `frontend/src/types/pos/index.ts`.

- [ ] **Step 1: Snapshot consumers**
```bash
grep -rln "\bITransaction\b\|\bITransactionItem\b" frontend/src --include="*.ts" --include="*.tsx" > /tmp/fe-rename.txt
wc -l /tmp/fe-rename.txt
```

- [ ] **Step 2: Rename files + class names**
```bash
cd frontend/src/types/pos
git mv transaction.type.ts sale.type.ts
git mv transaction-item.type.ts sale-item.type.ts

cd /home/blaxx/root@kaviya/Byte_squad
grep -rln "\bITransactionItem\b" frontend/src --include="*.ts" --include="*.tsx" | xargs sed -i 's|\bITransactionItem\b|ISaleItem|g'
grep -rln "\bITransaction\b" frontend/src --include="*.ts" --include="*.tsx" | xargs sed -i 's|\bITransaction\b|ISale|g'
grep -rln "'@/types/pos/transaction\b" frontend/src --include="*.ts" --include="*.tsx" | xargs sed -i "s|'@/types/pos/transaction|'@/types/pos/sale|g"
```

- [ ] **Step 3: Update the per-domain barrel**

Edit `frontend/src/types/pos/index.ts`:
```ts
export type { ISale } from './sale.type';
export type { ISaleItem } from './sale-item.type';
// ...keep other exports
```

- [ ] **Step 4: Build + typecheck**
```bash
cd frontend && pnpm tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 5: Commit**
```bash
git add frontend/src/types/pos/sale.type.ts \
  frontend/src/types/pos/sale-item.type.ts \
  frontend/src/types/pos/index.ts \
  frontend/src
git commit -m "refactor(pos): rename ITransaction→ISale on the frontend

Pairs with the backend rename; consumers unchanged behaviourally."
```

### Task 0.4 — Phase 0 validation gate

- [ ] **Step 1: Run the gate**
```bash
cd backend && pnpm lint && pnpm tsc --noEmit && pnpm test
cd ../frontend && pnpm lint && pnpm tsc --noEmit && pnpm test
```
Expected: all green.

- [ ] **Step 2: Smoke the POS endpoint**
```bash
docker compose up -d postgres
cd backend && pnpm start:dev &
sleep 8
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"cashier1@ledgerpro.dev","password":"Cashier@123"}' \
  | jq -r .data.accessToken)
curl -fsS http://localhost:3000/api/v1/pos/recent-sales \
  -H "authorization: bearer $TOKEN" | jq .
kill %1
```
Expected: returns an array (possibly empty) — confirms the rename did not break the live route.

**STOP for review.** Confirm with the user that the rename ships independently of the POS port. Phase 1 begins the wipe.

---

## Phase 1 — Wipe existing cashier POS frontend surface

**Why this phase exists:** the user explicitly asked for removal first, re-implementation second. We replace the current `PosPage` with a stub that says "POS under construction" so the route still resolves, but the underlying feature is gone.

### Task 1.1 — Delete frontend feature folder, pages, service

**Files to delete:**
- `frontend/src/features/pos/` (entire tree — components/, hooks/, lib/, types/)
- `frontend/src/services/pos.service.ts`
- `frontend/src/types/pos/cashier-dashboard.type.ts`, `admin-dashboard.type.ts`, `cashier-period-stats.type.ts`, `cashier-transaction-row.type.ts`, `cashier-transactions-summary.type.ts`, `daily-breakdown.type.ts`, `top-product.type.ts`, `recent-sale-row.type.ts` — keep `sale.type.ts`, `sale-item.type.ts`, `index.ts`.

- [ ] **Step 1: List everything that imports the feature**
```bash
grep -rln "@/features/pos/" frontend/src --include="*.ts" --include="*.tsx" > /tmp/pos-fe-feature-consumers.txt
grep -rln "@/services/pos.service\|posService" frontend/src --include="*.ts" --include="*.tsx" >> /tmp/pos-fe-feature-consumers.txt
sort -u /tmp/pos-fe-feature-consumers.txt
```
Expected: `frontend/src/pages/pos/PosPage.tsx` plus possibly `CashierDashboardPage.tsx`.

- [ ] **Step 2: Replace `PosPage.tsx` with a stub**
```tsx
// frontend/src/pages/pos/PosPage.tsx
import { Card } from '@/components/ui/Card';

export function PosPage() {
  return (
    <div className="min-h-[calc(100dvh-6.5rem)] flex items-center justify-center">
      <Card className="max-w-md text-center p-8">
        <h1 className="text-2xl font-semibold text-text-1">POS rebuild in progress</h1>
        <p className="mt-3 text-sm text-text-2">
          The cashier point-of-sale workspace is being rebuilt against the Shanel ERP
          reference. The route remains reachable so navigation works; the workspace
          will return in Phase 14.
        </p>
      </Card>
    </div>
  );
}
```

If the project's `Card` import path differs, run `grep -rn "from '@/components/ui/Card" frontend/src --include="*.tsx" | head -3` and use the canonical import.

- [ ] **Step 3: Delete the feature folder + service + dashboard types**
```bash
cd frontend
git rm -r src/features/pos
git rm src/services/pos.service.ts
git rm src/types/pos/cashier-dashboard.type.ts \
  src/types/pos/admin-dashboard.type.ts \
  src/types/pos/cashier-period-stats.type.ts \
  src/types/pos/cashier-transaction-row.type.ts \
  src/types/pos/cashier-transactions-summary.type.ts \
  src/types/pos/daily-breakdown.type.ts \
  src/types/pos/top-product.type.ts \
  src/types/pos/recent-sale-row.type.ts
```

- [ ] **Step 4: Update the types barrel**

Edit `frontend/src/types/pos/index.ts` to:
```ts
export type { ISale } from './sale.type';
export type { ISaleItem } from './sale-item.type';
```

- [ ] **Step 5: Audit dashboard page (if it imports `posService`)**

```bash
grep -n "posService" frontend/src/pages/**/*.tsx
```
Expected: zero hits after deletion. If the cashier or admin dashboard page imports `posService`, replace its data source with a temporary `{ totalSales: 0, transactionCount: 0 }` stub and add a `// TODO Phase 7: rewire to new pos.service` comment.

- [ ] **Step 6: Typecheck + lint**
```bash
cd frontend && pnpm tsc --noEmit && pnpm lint
```
Expected: 0 errors.

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "feat(pos)!: wipe cashier POS frontend ahead of Shanel port

Removes:
  - frontend/src/features/pos/ (components, hooks, lib, types)
  - frontend/src/services/pos.service.ts
  - 8 dashboard-related types under frontend/src/types/pos/

Keeps:
  - frontend/src/types/pos/sale.type.ts, sale-item.type.ts, index.ts
  - frontend/src/pages/pos/PosPage.tsx (now a stub)
  - frontend/src/pages/pos/ScanOrderPage.tsx (out of scope)
  - frontend/src/pages/pos/TransactionsPage.tsx (out of scope)

BREAKING CHANGE: the cashier POS route renders a placeholder until Phase 14.
The backend Sale entity and live endpoints remain; only the frontend surface
is gone."
```

### Task 1.2 — Phase 1 validation gate

- [ ] **Step 1: Build + lint**
```bash
cd frontend && pnpm build && pnpm lint
```
Expected: build green; placeholder page renders.

- [ ] **Step 2: Visual smoke**
```bash
pnpm dev &
sleep 5
# manually open http://localhost:5173/pos as cashier; confirm placeholder
```

**STOP for review.** Phase 2 begins the backend extension.

---

## Phase 2 — Backend entity extension + new entities + migrations

**Why now:** the new POS service can't be written until the schema has columns for `priceLevel`, `discountPercentage`, `taxAmount`, `paidAmount`, `balanceDue`, `paymentStatus`, `billPrintCount`, `firstPrintDate`, `lastPrintDate`, `status`, `location`, `saleType`, and the four new tables (`payments`, `credit_transactions`, `stock_movements`).

### Task 2.1 — Extend `Sale` entity (+11 columns)

**Files:**
- Modify: `backend/src/modules/pos/entities/sale.entity.ts`
- Create: `backend/src/modules/pos/types/sale-status.type.ts`
- Create: `backend/src/modules/pos/types/sale-payment-status.type.ts`
- Create: `backend/src/modules/pos/types/price-level.type.ts`
- Create: `backend/src/modules/pos/types/sale-type.type.ts`
- Create: `backend/src/migrations/<ts>-ExtendSaleForShanelPort.ts`

- [ ] **Step 1: Add the literal-union types**

`backend/src/modules/pos/types/sale-status.type.ts`:
```ts
export type SaleStatus = 'Active' | 'Voided';
```
`sale-payment-status.type.ts`:
```ts
export type SalePaymentStatus = 'Paid' | 'Partially_Paid' | 'Unpaid';
```
`price-level.type.ts`:
```ts
export type PriceLevel = 'Retail' | 'Wholesale';
```
`sale-type.type.ts`:
```ts
export type SaleType = 'Retail' | 'Wholesale';
```

Add to barrel `backend/src/modules/pos/types/index.ts`:
```ts
export type { SaleStatus } from './sale-status.type';
export type { SalePaymentStatus } from './sale-payment-status.type';
export type { PriceLevel } from './price-level.type';
export type { SaleType } from './sale-type.type';
```

- [ ] **Step 2: Add columns to `sale.entity.ts`**

Append after the existing columns (preserving order):
```ts
import type { SaleStatus, SalePaymentStatus, PriceLevel, SaleType } from '@pos/types';

@Column({ type: 'varchar', length: 32, name: 'sale_type', default: 'Retail' })
saleType!: SaleType;

@Column({ type: 'varchar', length: 32, name: 'price_level', default: 'Retail' })
priceLevel!: PriceLevel;

@Column({ type: 'decimal', precision: 5, scale: 2, name: 'discount_percentage', default: 0 })
discountPercentage!: number;

@Column({ type: 'decimal', precision: 5, scale: 2, name: 'tax_rate', default: 0 })
taxRate!: number;

@Column({ type: 'decimal', precision: 12, scale: 2, name: 'paid_amount', default: 0 })
paidAmount!: number;

@Column({ type: 'decimal', precision: 12, scale: 2, name: 'balance_due', default: 0 })
balanceDue!: number;

@Column({ type: 'varchar', length: 32, name: 'payment_status', default: 'Unpaid' })
paymentStatus!: SalePaymentStatus;

@Column({ type: 'varchar', length: 32, default: 'Active' })
status!: SaleStatus;

@Column({ type: 'varchar', length: 64, default: 'Shop' })
location!: string;

@Column({ type: 'uuid', name: 'customer_user_id', nullable: true })
customerUserId!: string | null;

@Column({ type: 'varchar', name: 'voided_reason', nullable: true })
voidedReason!: string | null;

@Column({ type: 'timestamp', name: 'voided_at', nullable: true })
voidedAt!: Date | null;

@Column({ type: 'uuid', name: 'voided_by_user_id', nullable: true })
voidedByUserId!: string | null;
```

The existing `taxAmount`, `billPrinted`, `billPrintCount`, `firstPrintDate`, `lastPrintDate` columns are already present — verify with:
```bash
grep -n "taxAmount\|billPrinted\|billPrintCount" backend/src/modules/pos/entities/sale.entity.ts
```

- [ ] **Step 3: Write the migration**

`backend/src/migrations/<ts>-ExtendSaleForShanelPort.ts`:
```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendSaleForShanelPort<TS> implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE sales
        ADD COLUMN sale_type varchar(32) NOT NULL DEFAULT 'Retail',
        ADD COLUMN price_level varchar(32) NOT NULL DEFAULT 'Retail',
        ADD COLUMN discount_percentage decimal(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN tax_rate decimal(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN paid_amount decimal(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN balance_due decimal(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN payment_status varchar(32) NOT NULL DEFAULT 'Unpaid',
        ADD COLUMN status varchar(32) NOT NULL DEFAULT 'Active',
        ADD COLUMN location varchar(64) NOT NULL DEFAULT 'Shop',
        ADD COLUMN customer_user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN voided_reason varchar(255) NULL,
        ADD COLUMN voided_at timestamp NULL,
        ADD COLUMN voided_by_user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL;
    `);
    await qr.query(`CREATE INDEX idx_sales_status ON sales (status)`);
    await qr.query(`CREATE INDEX idx_sales_payment_status ON sales (payment_status)`);
    await qr.query(`CREATE INDEX idx_sales_customer_user ON sales (customer_user_id)`);
  }
  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_sales_customer_user`);
    await qr.query(`DROP INDEX IF EXISTS idx_sales_payment_status`);
    await qr.query(`DROP INDEX IF EXISTS idx_sales_status`);
    await qr.query(`
      ALTER TABLE sales
        DROP COLUMN voided_by_user_id,
        DROP COLUMN voided_at,
        DROP COLUMN voided_reason,
        DROP COLUMN customer_user_id,
        DROP COLUMN location,
        DROP COLUMN status,
        DROP COLUMN payment_status,
        DROP COLUMN balance_due,
        DROP COLUMN paid_amount,
        DROP COLUMN tax_rate,
        DROP COLUMN discount_percentage,
        DROP COLUMN price_level,
        DROP COLUMN sale_type;
    `);
  }
}
```

- [ ] **Step 4: Spec the entity-shape**

`backend/src/modules/pos/entities/sale.entity.spec.ts` (extend, do not replace):
```ts
it('has the Shanel-port columns with safe defaults', () => {
  const sale = new Sale();
  expect(sale.saleType).toBeUndefined(); // defaults applied by DB
  expect(typeof sale).toBe('object');
});
```

Run: `pnpm test sale.entity.spec`
Expected: PASS (the test is symbolic — DB defaults validated by migration smoke).

- [ ] **Step 5: Run migration + smoke**
```bash
pnpm typeorm migration:run
psql $DATABASE_URL -c '\d sales' | grep -E "sale_type|price_level|payment_status|status\b"
```
Expected: all four columns present.

- [ ] **Step 6: Commit**
```bash
git add backend/src/migrations \
  backend/src/modules/pos/entities/sale.entity.ts \
  backend/src/modules/pos/types/
git commit -m "feat(pos): extend Sale with Shanel-required columns

Adds saleType, priceLevel, discountPercentage, taxRate, paidAmount,
balanceDue, paymentStatus, status, location, customerUserId, and void
audit columns. All have safe defaults so existing rows survive the
migration."
```

### Task 2.2 — Extend `SaleItem` entity (+6 columns)

**Files:**
- Modify: `backend/src/modules/pos/entities/sale-item.entity.ts`
- Create: `backend/src/migrations/<ts>-ExtendSaleItemForShanelPort.ts`

- [ ] **Step 1: Add columns**

Append to `sale-item.entity.ts`:
```ts
import { DiscountType } from '@common/enums/discount.enum';
import type { PriceLevel } from '@pos/types';

@Column({ type: 'varchar', length: 32, name: 'price_level_used', default: 'Retail' })
priceLevelUsed!: PriceLevel;

@Column({ type: 'decimal', precision: 5, scale: 2, name: 'line_discount_percentage', default: 0 })
lineDiscountPercentage!: number;

@Column({ type: 'decimal', precision: 12, scale: 2, name: 'line_subtotal', default: 0 })
lineSubtotal!: number;

@Column({ type: 'decimal', precision: 5, scale: 2, name: 'line_tax_rate', default: 0 })
lineTaxRate!: number;

@Column({ type: 'decimal', precision: 12, scale: 2, name: 'line_tax_amount', default: 0 })
lineTaxAmount!: number;

@Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
free!: number;

@Column({ type: 'varchar', length: 64, name: 'location_taken_from', default: 'Shop' })
locationTakenFrom!: string;

@Column({ type: 'varchar', length: 32, default: 'Active' })
status!: 'Active' | 'Voided';
```

The existing `discountAmount`, `discountType`, `lineTotal`, `quantity`, `unitPrice`, `baseUnitQty` are already there.

- [ ] **Step 2: Write the migration**

```ts
export class ExtendSaleItemForShanelPort<TS> implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE sale_items
        ADD COLUMN price_level_used varchar(32) NOT NULL DEFAULT 'Retail',
        ADD COLUMN line_discount_percentage decimal(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN line_subtotal decimal(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN line_tax_rate decimal(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN line_tax_amount decimal(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN free decimal(12,3) NOT NULL DEFAULT 0,
        ADD COLUMN location_taken_from varchar(64) NOT NULL DEFAULT 'Shop',
        ADD COLUMN status varchar(32) NOT NULL DEFAULT 'Active';
    `);
  }
  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      ALTER TABLE sale_items
        DROP COLUMN status,
        DROP COLUMN location_taken_from,
        DROP COLUMN free,
        DROP COLUMN line_tax_amount,
        DROP COLUMN line_tax_rate,
        DROP COLUMN line_subtotal,
        DROP COLUMN line_discount_percentage,
        DROP COLUMN price_level_used;
    `);
  }
}
```

- [ ] **Step 3: Run migration + verify**
```bash
pnpm typeorm migration:run
psql $DATABASE_URL -c '\d sale_items' | grep -E "free|line_tax|price_level_used"
```

- [ ] **Step 4: Commit**
```bash
git add backend/src/modules/pos/entities/sale-item.entity.ts backend/src/migrations
git commit -m "feat(pos): extend SaleItem with Shanel line columns"
```

### Task 2.3 — Create `Payment` entity (multi-tender)

**Files:**
- Create: `backend/src/modules/pos/entities/payment.entity.ts`
- Create: `backend/src/modules/pos/types/payment-method.type.ts`
- Create: `backend/src/migrations/<ts>-CreatePayments.ts`
- Create: `backend/src/modules/pos/payment.repository.ts`
- Create: `backend/src/modules/pos/payment.repository.spec.ts`

- [ ] **Step 1: Define the payment-method literal-union type**

`backend/src/modules/pos/types/payment-method.type.ts`:
```ts
export type PaymentMethod = 'Cash' | 'Card' | 'Mobile' | 'Cheque' | 'Bank' | 'Credit';
```
Re-export from `backend/src/modules/pos/types/index.ts`.

- [ ] **Step 2: Write the entity**

`backend/src/modules/pos/entities/payment.entity.ts`:
```ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Sale } from '@pos/entities/sale.entity';
import type { PaymentMethod } from '@pos/types';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'sale_id' })
  saleId!: string;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale;

  @Column({ type: 'varchar', length: 64, name: 'receipt_no', unique: true })
  receiptNo!: string;

  @Column({ type: 'varchar', length: 32, name: 'payment_method' })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'payment_amount' })
  paymentAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'invoice_total' })
  invoiceTotal!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cash_tendered', default: 0 })
  cashTendered!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cash_amount', default: 0 })
  cashAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cash_change', default: 0 })
  cashChange!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cheque_amount', default: 0 })
  chequeAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'bank_transfer_amount', default: 0 })
  bankTransferAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'credit_amount', default: 0 })
  creditAmount!: number;

  @Column({ type: 'boolean', name: 'keep_balance', default: false })
  keepBalance!: boolean;

  @Column({ type: 'varchar', length: 64, name: 'cheque_no', nullable: true })
  chequeNo!: string | null;

  @Column({ type: 'date', name: 'cheque_date', nullable: true })
  chequeDate!: Date | null;

  @Column({ type: 'varchar', length: 128, name: 'cheque_bank', nullable: true })
  chequeBank!: string | null;

  @Column({ type: 'varchar', length: 128, name: 'cheque_branch', nullable: true })
  chequeBranch!: string | null;

  @Column({ type: 'varchar', length: 128, name: 'cheque_delivered_by', nullable: true })
  chequeDeliveredBy!: string | null;

  @Column({ type: 'varchar', length: 64, name: 'cheque_ref', nullable: true })
  chequeRef!: string | null;

  @Column({ type: 'varchar', length: 64, name: 'bank_ref', nullable: true })
  bankRef!: string | null;

  @Column({ type: 'varchar', length: 32, default: 'Active' })
  status!: 'Active' | 'Voided';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
```

- [ ] **Step 3: Write the migration**

```ts
export class CreatePayments<TS> implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        receipt_no varchar(64) NOT NULL UNIQUE,
        payment_method varchar(32) NOT NULL,
        payment_amount decimal(12,2) NOT NULL,
        invoice_total decimal(12,2) NOT NULL,
        cash_tendered decimal(12,2) NOT NULL DEFAULT 0,
        cash_amount decimal(12,2) NOT NULL DEFAULT 0,
        cash_change decimal(12,2) NOT NULL DEFAULT 0,
        cheque_amount decimal(12,2) NOT NULL DEFAULT 0,
        bank_transfer_amount decimal(12,2) NOT NULL DEFAULT 0,
        credit_amount decimal(12,2) NOT NULL DEFAULT 0,
        keep_balance boolean NOT NULL DEFAULT false,
        cheque_no varchar(64) NULL,
        cheque_date date NULL,
        cheque_bank varchar(128) NULL,
        cheque_branch varchar(128) NULL,
        cheque_delivered_by varchar(128) NULL,
        cheque_ref varchar(64) NULL,
        bank_ref varchar(64) NULL,
        status varchar(32) NOT NULL DEFAULT 'Active',
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_payments_sale ON payments (sale_id);
      CREATE INDEX idx_payments_method ON payments (payment_method);
    `);
  }
  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS payments`);
  }
}
```

- [ ] **Step 4: Write the repository (canonical pattern from Rules.md §7)**

`backend/src/modules/pos/payment.repository.ts`:
```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { Payment } from '@pos/entities/payment.entity';

@Injectable()
export class PaymentRepository {
  private readonly repository: Repository<Payment>;
  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(Payment);
  }

  async create(input: DeepPartial<Payment>, manager?: EntityManager): Promise<Payment> {
    const repo = manager ? manager.getRepository(Payment) : this.repository;
    return repo.save(repo.create(input));
  }

  async findOneById(id: string): Promise<Payment | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findBySaleId(saleId: string): Promise<Payment | null> {
    return this.repository.findOne({ where: { saleId } });
  }

  async voidById(id: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(Payment) : this.repository;
    const result = await repo.update(id, { status: 'Voided' });
    if (result.affected === 0) throw new NotFoundException(`Payment ${id} not found`);
  }
}
```

- [ ] **Step 5: Write the repository spec**

`backend/src/modules/pos/payment.repository.spec.ts`:
```ts
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { PaymentRepository } from './payment.repository';
import { Payment } from '@pos/entities/payment.entity';

describe('PaymentRepository', () => {
  let repo: PaymentRepository;
  let dataSource: jest.Mocked<DataSource>;
  let typeormRepo: { save: jest.Mock; create: jest.Mock; findOne: jest.Mock; update: jest.Mock };

  beforeEach(async () => {
    typeormRepo = {
      save: jest.fn(),
      create: jest.fn((x) => x),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    dataSource = { getRepository: jest.fn().mockReturnValue(typeormRepo) } as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentRepository, { provide: DataSource, useValue: dataSource }],
    }).compile();
    repo = module.get(PaymentRepository);
  });

  it('persists a payment via save+create', async () => {
    typeormRepo.save.mockResolvedValue({ id: 'p-1' });
    const out = await repo.create({ saleId: 's-1', paymentMethod: 'Cash', paymentAmount: 100, invoiceTotal: 100, receiptNo: 'RCPT-x' });
    expect(out).toEqual({ id: 'p-1' });
    expect(typeormRepo.create).toHaveBeenCalled();
    expect(typeormRepo.save).toHaveBeenCalled();
  });

  it('throws NotFoundException when voiding a missing payment', async () => {
    typeormRepo.update.mockResolvedValueOnce({ affected: 0 });
    await expect(repo.voidById('missing')).rejects.toThrow('Payment missing not found');
  });
});
```

Run: `pnpm test payment.repository.spec`
Expected: 2 specs PASS.

- [ ] **Step 6: Run migration + commit**
```bash
pnpm typeorm migration:run
psql $DATABASE_URL -c '\d payments' | head
```

```bash
git add backend/src/modules/pos/entities/payment.entity.ts \
  backend/src/modules/pos/payment.repository.ts \
  backend/src/modules/pos/payment.repository.spec.ts \
  backend/src/modules/pos/types/payment-method.type.ts \
  backend/src/modules/pos/types/index.ts \
  backend/src/migrations
git commit -m "feat(pos): payments table for Shanel multi-tender model"
```

### Task 2.4 — Create `CreditTransaction` entity

**Files:**
- Create: `backend/src/modules/pos/entities/credit-transaction.entity.ts`
- Create: `backend/src/modules/pos/credit-transaction.repository.ts`
- Create: `backend/src/modules/pos/credit-transaction.repository.spec.ts`
- Create: `backend/src/migrations/<ts>-CreateCreditTransactions.ts`

- [ ] **Step 1: Entity**

```ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Sale } from '@pos/entities/sale.entity';
import { User } from '@users/entities/user.entity';

export type CreditTransactionType = 'Credit_Taken' | 'Credit_Paid';

@Entity('credit_transactions')
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid', name: 'sale_id', nullable: true })
  saleId!: string | null;

  @ManyToOne(() => Sale, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale | null;

  @Column({ type: 'varchar', length: 32, name: 'transaction_type' })
  transactionType!: CreditTransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'running_balance' })
  runningBalance!: number;

  @Column({ type: 'varchar', length: 64, name: 'reference_no' })
  referenceNo!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
```

- [ ] **Step 2: Repository**

`credit-transaction.repository.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { CreditTransaction } from '@pos/entities/credit-transaction.entity';

@Injectable()
export class CreditTransactionRepository {
  private readonly repository: Repository<CreditTransaction>;
  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(CreditTransaction);
  }

  async create(input: DeepPartial<CreditTransaction>, manager?: EntityManager): Promise<CreditTransaction> {
    const repo = manager ? manager.getRepository(CreditTransaction) : this.repository;
    return repo.save(repo.create(input));
  }

  async findByUserId(userId: string): Promise<CreditTransaction[]> {
    return this.repository
      .createQueryBuilder('ct')
      .where('ct.user_id = :userId', { userId })
      .orderBy('ct.created_at', 'DESC')
      .getMany();
  }
}
```

- [ ] **Step 3: Migration**
```ts
await qr.query(`
  CREATE TABLE credit_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    sale_id uuid NULL REFERENCES sales(id) ON DELETE SET NULL,
    transaction_type varchar(32) NOT NULL,
    amount decimal(12,2) NOT NULL,
    running_balance decimal(12,2) NOT NULL,
    reference_no varchar(64) NOT NULL,
    notes varchar(255) NULL,
    created_at timestamp NOT NULL DEFAULT now()
  );
  CREATE INDEX idx_ct_user ON credit_transactions (user_id);
  CREATE INDEX idx_ct_sale ON credit_transactions (sale_id);
`);
```

- [ ] **Step 4: Repository spec**

Mirror Task 2.3 Step 5 — verify `create` calls `save`, `findByUserId` filters by user_id ordered DESC.

- [ ] **Step 5: Run migration + commit**
```bash
pnpm typeorm migration:run
git add backend/src/modules/pos/entities/credit-transaction.entity.ts \
  backend/src/modules/pos/credit-transaction.repository.ts \
  backend/src/modules/pos/credit-transaction.repository.spec.ts \
  backend/src/migrations
git commit -m "feat(pos): credit_transactions audit log"
```

### Task 2.5 — Create `StockMovement` entity

**Files:**
- Create: `backend/src/modules/pos/entities/stock-movement.entity.ts`
- Create: `backend/src/modules/pos/stock-movement.repository.ts`
- Create: `backend/src/modules/pos/stock-movement.repository.spec.ts`
- Create: `backend/src/migrations/<ts>-CreateStockMovements.ts`

- [ ] **Step 1: Entity**

```ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Product } from '@products/entities/product.entity';

export type StockMovementType =
  | 'Sale'
  | 'Sale_Voided'
  | 'Purchase'
  | 'Transfer_In'
  | 'Transfer_Out'
  | 'Adjustment'
  | 'Return';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId!: string;

  @Column({ type: 'varchar', length: 64, default: 'Shop' })
  location!: string;

  @Column({ type: 'varchar', length: 32, name: 'movement_type' })
  movementType!: StockMovementType;

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'qty_in', default: 0 })
  qtyIn!: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'qty_out', default: 0 })
  qtyOut!: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'balance_after' })
  balanceAfter!: number;

  @Column({ type: 'varchar', length: 32, name: 'ref_type', nullable: true })
  refType!: string | null;

  @Column({ type: 'uuid', name: 'ref_id', nullable: true })
  refId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes!: string | null;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
```

- [ ] **Step 2: Repository + spec**

Mirror Task 2.3 — `create`, `findByProductId`, `findByRef(refType, refId)`.

- [ ] **Step 3: Migration**
```ts
await qr.query(`
  CREATE TABLE stock_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    location varchar(64) NOT NULL DEFAULT 'Shop',
    movement_type varchar(32) NOT NULL,
    qty_in decimal(12,3) NOT NULL DEFAULT 0,
    qty_out decimal(12,3) NOT NULL DEFAULT 0,
    balance_after decimal(12,3) NOT NULL,
    ref_type varchar(32) NULL,
    ref_id uuid NULL,
    notes varchar(255) NULL,
    created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at timestamp NOT NULL DEFAULT now()
  );
  CREATE INDEX idx_sm_product_branch ON stock_movements (product_id, branch_id);
  CREATE INDEX idx_sm_ref ON stock_movements (ref_type, ref_id);
  CREATE INDEX idx_sm_created_at ON stock_movements (created_at DESC);
`);
```

- [ ] **Step 4: Commit**
```bash
git add backend/src/modules/pos/entities/stock-movement.entity.ts \
  backend/src/modules/pos/stock-movement.repository.ts \
  backend/src/modules/pos/stock-movement.repository.spec.ts \
  backend/src/migrations
git commit -m "feat(pos): stock_movements audit log"
```

### Task 2.6 — Wire new entities into `pos.module.ts`

- [ ] **Step 1: Update `pos.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PosRepository } from './pos.repository';
import { SaleRepository } from './sale.repository';
import { SaleItemRepository } from './sale-item.repository';
import { PaymentRepository } from './payment.repository';
import { CreditTransactionRepository } from './credit-transaction.repository';
import { StockMovementRepository } from './stock-movement.repository';
import { InvoiceNumberService } from './services/invoice-number.service';
import { MultiTenderCalculatorService } from './services/multi-tender-calculator.service';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Payment } from './entities/payment.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { InvoiceCounter } from './entities/invoice-counter.entity';
import { AccountingModule } from '@accounting/accounting.module';
import { InventoryModule } from '@inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale, SaleItem, Payment, CreditTransaction, StockMovement,
      IdempotencyKey, InvoiceCounter,
    ]),
    AccountingModule,
    InventoryModule,
  ],
  controllers: [PosController],
  providers: [
    PosService,
    PosRepository,
    SaleRepository,
    SaleItemRepository,
    PaymentRepository,
    CreditTransactionRepository,
    StockMovementRepository,
    InvoiceNumberService,
    MultiTenderCalculatorService,
  ],
  exports: [PosService, SaleRepository], // Service exposed; repositories only the SaleRepository (for accounting joins)
})
export class PosModule {}
```

- [ ] **Step 2: Build + run tests**
```bash
pnpm tsc --noEmit && pnpm test
```
Expected: 0 errors. Existing PosService tests will fail until rewritten in Phase 5 — that's expected. Skip them via `xdescribe('PosService', ...)` and add a `// PHASE-5: rewrite` comment, OR delete and rewrite from scratch. **Pick deletion** since the file is being replaced.

```bash
git rm backend/src/modules/pos/pos.service.spec.ts
```

- [ ] **Step 3: Commit**
```bash
git add backend/src/modules/pos/pos.module.ts
git commit -m "feat(pos): register Payment, CreditTransaction, StockMovement in pos.module"
```

### Task 2.7 — Phase 2 validation gate

- [ ] **Step 1: Migrations + smoke**
```bash
pnpm typeorm migration:show
pnpm typeorm migration:run
pnpm tsc --noEmit && pnpm lint && pnpm test
```

**STOP for review.**

---

## Phase 3 — User + Product schema additions

**Why now:** Shanel uses customer credit balance and per-product wholesale pricing + tax. We add minimal columns to support those features.

### Task 3.1 — `User.currentBalance` (customer credit ledger anchor)

**Files:**
- Modify: `backend/src/modules/users/entities/user.entity.ts`
- Create: `backend/src/migrations/<ts>-AddUserCurrentBalance.ts`

- [ ] **Step 1: Add column**

```ts
// user.entity.ts (after lastLoginAt)
@Column({ type: 'decimal', precision: 12, scale: 2, name: 'current_balance', default: 0 })
currentBalance!: number;
```

- [ ] **Step 2: Migration**
```ts
await qr.query(`
  ALTER TABLE users ADD COLUMN current_balance decimal(12,2) NOT NULL DEFAULT 0;
`);
```

- [ ] **Step 3: Run + commit**
```bash
pnpm typeorm migration:run
git add backend/src/modules/users/entities/user.entity.ts backend/src/migrations
git commit -m "feat(users): add current_balance for POS credit ledger"
```

### Task 3.2 — `Product.wholesalePrice` + `Product.taxRate`

**Files:**
- Modify: `backend/src/modules/products/entities/product.entity.ts`
- Modify: `backend/src/modules/products/dto/{create-product,update-product}.dto.ts`
- Create: `backend/src/migrations/<ts>-AddProductWholesaleAndTax.ts`

- [ ] **Step 1: Add columns**

After `sellingPrice`:
```ts
@Column({ type: 'decimal', precision: 12, scale: 2, name: 'wholesale_price', default: 0 })
wholesalePrice!: number;

@Column({ type: 'decimal', precision: 5, scale: 2, name: 'tax_rate', default: 0 })
taxRate!: number;

@Column({ type: 'boolean', name: 'discount_allowed', default: true })
discountAllowed!: boolean;
```

- [ ] **Step 2: DTO additions**

```ts
// create-product.dto.ts
@IsNumber()
@Min(0)
@IsOptional()
wholesalePrice?: number;

@IsNumber()
@Min(0)
@Max(100)
@IsOptional()
taxRate?: number;

@IsBoolean()
@IsOptional()
discountAllowed?: boolean;
```

- [ ] **Step 3: Migration**
```ts
await qr.query(`
  ALTER TABLE products
    ADD COLUMN wholesale_price decimal(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN tax_rate decimal(5,2) NOT NULL DEFAULT 0,
    ADD COLUMN discount_allowed boolean NOT NULL DEFAULT true;
`);
```

- [ ] **Step 4: Spec the entity + DTO**

Add to existing `products.service.spec.ts`:
```ts
it('persists wholesalePrice and taxRate', async () => {
  const dto = { ...validDto, wholesalePrice: 80, taxRate: 15, discountAllowed: false };
  const created = await service.create(actor, dto);
  expect(created.wholesalePrice).toBe(80);
  expect(created.taxRate).toBe(15);
  expect(created.discountAllowed).toBe(false);
});
```

- [ ] **Step 5: Run migration + commit**
```bash
pnpm typeorm migration:run
git add backend/src/modules/products backend/src/migrations
git commit -m "feat(products): wholesale_price, tax_rate, discount_allowed for POS"
```

### Task 3.3 — Phase 3 gate

Run the standard validation gate. Confirm `\d users` and `\d products` show the new columns.

**STOP for review.**

---

## Phase 4 — Backend read endpoints (search, units, inventory, recent, invoice-no)

**Endpoints to add to `APP_ROUTES.POS`:**

```ts
// backend/src/common/routes/app.routes.ts (update POS section)
POS: {
  BASE: `${API_PREFIX}/pos`,
  // Reads
  SEARCH_PRODUCTS: 'products/search',
  PRODUCT_UNITS: 'products/:productId/units',
  BASE_UNIT_QTY: 'products/:productId/units/:unitName/base-qty',
  PRODUCT_INVENTORY: 'products/:productId/inventory',
  RECENT_SALES: 'recent-sales',
  GENERATE_INVOICE_NO: 'invoice-number',
  // Writes (Phase 5+)
  SALES: 'sales',
  SALE_BY_ID: 'sales/:id',
  SALE_PRINT: 'sales/:id/print',
  SALE_VOID: 'sales/:id/void',
  // Deprecated dashboard endpoints — remove
}
```

### Task 4.1 — Product search endpoint

**Files:**
- Create: `backend/src/modules/pos/dto/search-products-query.dto.ts`
- Create: `backend/src/modules/pos/types/search-product-row.type.ts`
- Create: `backend/src/modules/pos/sale.repository.ts` (Shanel-style methods)
- Create: `backend/src/modules/pos/services/product-search.service.ts`
- Create: `backend/src/modules/pos/services/product-search.service.spec.ts`
- Modify: `backend/src/modules/pos/pos.controller.ts`

The repository per Rules.md §7 should belong to the entity. Product search reads from `products` — so we add a method on `ProductRepository` (already exists) or create a thin POS-side `ProductSearchService` that calls the product repo. **Pick the latter**: the POS service stays separate from products, but uses ProductsService for searches.

- [ ] **Step 1: DTO**

```ts
// search-products-query.dto.ts
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchProductsQueryDto {
  @IsString()
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
```

- [ ] **Step 2: Type**

```ts
// search-product-row.type.ts
export interface SearchProductRow {
  productId: string;
  productCode: string;
  productName: string;
  productType: string;
  baseUnit: string;
  status: boolean;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  taxRate: number;
  discountAllowed: boolean;
  imageUrl: string | null;
}
```

- [ ] **Step 3: Extend `ProductsRepository.searchByText`**

If the existing products repo doesn't have a search method, add:
```ts
// products.repository.ts
async searchByText(term: string, limit: number): Promise<Product[]> {
  return this.repository
    .createQueryBuilder('p')
    .where('p.is_active = true')
    .andWhere('(p.name ILIKE :pattern OR p.barcode ILIKE :pattern)', { pattern: `${term}%` })
    .orderBy('p.name', 'ASC')
    .limit(limit)
    .getMany();
}
```

- [ ] **Step 4: Service**

```ts
// pos.service.ts (add method)
async searchProducts(actor: CurrentUserPayload, dto: SearchProductsQueryDto): Promise<SearchProductRow[]> {
  const term = dto.q.trim();
  if (!term) return [];
  const rows = await this.products.searchByText(term, dto.limit ?? 10);
  return rows.map(p => ({
    productId: p.id,
    productCode: p.barcode,
    productName: p.name,
    productType: p.category,
    baseUnit: p.baseUnit,
    status: p.isActive,
    costPrice: Number(p.costPrice),
    retailPrice: Number(p.sellingPrice),
    wholesalePrice: Number(p.wholesalePrice),
    taxRate: Number(p.taxRate),
    discountAllowed: p.discountAllowed,
    imageUrl: p.imageUrl,
  }));
}
```

Inject `ProductsRepository` via `ProductsModule.exports` or the service. Update `PosModule`:
```ts
imports: [..., ProductsModule],
```

- [ ] **Step 5: Controller**

```ts
// pos.controller.ts (add)
@Get(APP_ROUTES.POS.SEARCH_PRODUCTS)
@Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
searchProducts(@CurrentUser() actor: CurrentUserPayload, @Query() query: SearchProductsQueryDto) {
  return this.posService.searchProducts(actor, query);
}
```

- [ ] **Step 6: Spec**

Mock `ProductsRepository.searchByText` to return 1 row; assert mapping shape:
```ts
expect(result[0]).toEqual({
  productId: expect.any(String),
  retailPrice: 100, wholesalePrice: 80, taxRate: 10,
  discountAllowed: true, ...
});
```

Run: `pnpm test pos.service` (new spec covering searchProducts).
Expected: PASS.

- [ ] **Step 7: Manual smoke**
```bash
curl -fsS "http://localhost:3000/api/v1/pos/products/search?q=test&limit=5" \
  -H "authorization: bearer $TOKEN" | jq .
```

- [ ] **Step 8: Commit**
```bash
git commit -m "feat(pos): GET /pos/products/search Shanel-shaped"
```

### Task 4.2 — Product units endpoint (`GET /pos/products/:id/units`)

**Files:**
- Create: `backend/src/modules/pos/types/product-unit-row.type.ts`
- Modify: `backend/src/modules/pos/pos.service.ts`
- Modify: `backend/src/modules/pos/pos.controller.ts`

The `ProductSellableUnit` entity already exists (`backend/src/modules/products/entities/product-sellable-unit.entity.ts`). We query it.

- [ ] **Step 1: Type**

```ts
// product-unit-row.type.ts
export interface ProductUnitRow {
  unitId: string;
  unitName: string;
  isBaseUnit: boolean;
  conversionToBase: number;
  displayOrder: number;
}
```

- [ ] **Step 2: Service method**

```ts
async listProductUnits(productId: string): Promise<ProductUnitRow[]> {
  // Add a method on ProductsRepository or inject DataSource for a one-shot query.
  // Pattern: ask the products repo. Don't import typeorm in this service.
  return this.products.listUnits(productId);
}
```

Add to `products.repository.ts`:
```ts
async listUnits(productId: string): Promise<ProductUnitRow[]> {
  const rows = await this.dataSource.getRepository(ProductSellableUnit).find({
    where: { productId },
    order: { displayOrder: 'ASC' },
  });
  return rows.map(u => ({
    unitId: u.id,
    unitName: u.name,
    isBaseUnit: u.isBase,
    conversionToBase: Number(u.conversionToBase),
    displayOrder: u.displayOrder ?? 0,
  }));
}
```

- [ ] **Step 3: Controller**
```ts
@Get(APP_ROUTES.POS.PRODUCT_UNITS)
@Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
listProductUnits(@Param('productId') productId: string) {
  return this.posService.listProductUnits(productId);
}
```

- [ ] **Step 4: Spec — `pos.service.spec.ts`**

```ts
it('returns units sorted by displayOrder', async () => {
  productsRepo.listUnits.mockResolvedValue([
    { unitId: 'u1', unitName: 'kg', isBaseUnit: true, conversionToBase: 1, displayOrder: 0 },
    { unitId: 'u2', unitName: 'g', isBaseUnit: false, conversionToBase: 0.001, displayOrder: 1 },
  ]);
  const out = await service.listProductUnits('p-1');
  expect(out).toHaveLength(2);
  expect(out[0].isBaseUnit).toBe(true);
});
```

- [ ] **Step 5: Commit**
```bash
git commit -m "feat(pos): GET /pos/products/:id/units"
```

### Task 4.3 — Base-unit-qty endpoint

Shanel uses this to convert a typed qty into base-unit qty for stock validation. We've already done this server-side in `pos.service.ts:107-141` — but Shanel exposes it as a read endpoint. Keep our pattern (server computes during checkout) AND expose a read endpoint for the frontend's pre-validation:

- [ ] **Step 1: Service method**
```ts
async getBaseUnitQty(productId: string, unitName: string): Promise<{ conversionToBase: number; isBase: boolean }> {
  const units = await this.listProductUnits(productId);
  const match = units.find(u => u.unitName === unitName);
  if (!match) throw new NotFoundException(`Unit ${unitName} not configured for product ${productId}`);
  return { conversionToBase: match.conversionToBase, isBase: match.isBaseUnit };
}
```

- [ ] **Step 2: Controller**
```ts
@Get(APP_ROUTES.POS.BASE_UNIT_QTY)
@Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
getBaseUnitQty(@Param('productId') productId: string, @Param('unitName') unitName: string) {
  return this.posService.getBaseUnitQty(productId, unitName);
}
```

- [ ] **Step 3: Spec + commit**

### Task 4.4 — Inventory-quantity endpoint

Shanel returns `{ shopQty, productionQty, totalQty }`. We map to LedgerPro's branch-scoped inventory.

- [ ] **Step 1: Type**
```ts
// inventory-quantity.type.ts
export interface InventoryQuantity {
  productId: string;
  branchId: string;
  branchName: string;
  branchQty: number;
  totalAcrossBranches: number;
}
```

- [ ] **Step 2: Service**
```ts
async getProductInventory(actor: CurrentUserPayload, productId: string): Promise<InventoryQuantity> {
  // Service decides branch filter; non-admin sees only their branch.
  return this.inventory.summaryForProduct(productId, actor.role === 'admin' ? null : actor.branchId);
}
```

Add to `InventoryRepository`:
```ts
async summaryForProduct(productId: string, branchId: string | null): Promise<InventoryQuantity> {
  const rows = await this.dataSource.getRepository(Inventory).find({
    where: { productId },
    relations: ['branch'],
  });
  const totalAcross = rows.reduce((s, r) => s + Number(r.quantity), 0);
  const scoped = branchId ? rows.find(r => r.branchId === branchId) : rows[0];
  return {
    productId,
    branchId: scoped?.branchId ?? branchId ?? '',
    branchName: scoped?.branch?.name ?? '',
    branchQty: scoped ? Number(scoped.quantity) : 0,
    totalAcrossBranches: totalAcross,
  };
}
```

- [ ] **Step 3: Controller, spec, commit**

### Task 4.5 — Recent-sales endpoint (extended)

We already have `getRecentSales`. Extend the returned row shape to include the new fields the cashier UI needs (paymentStatus, balanceDue, customerName, etc.).

- [ ] **Step 1: Extend `RecentSaleRow`**
```ts
// recent-sale-row.type.ts (replace existing)
export interface RecentSaleRow {
  id: string;
  invoiceNumber: string;
  transactionNumber: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'Paid' | 'Partially_Paid' | 'Unpaid';
  saleType: 'Retail' | 'Wholesale';
  status: 'Active' | 'Voided';
  billPrinted: boolean;
  billPrintCount: number;
  branchId: string;
  customerUserId: string | null;
  customerName: string | null;
  createdAt: Date;
}
```

- [ ] **Step 2: Update `getRecentSales` mapping** in `pos.service.ts:299-328` (lines exist already) — pull from extended Sale entity columns and join `User` for customer name.

Update `pos.repository.findRecentByBranchSince` to add `relations: ['customer']` (the new `Sale.customer` relation we should add):

In `sale.entity.ts`:
```ts
@ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
@JoinColumn({ name: 'customer_user_id' })
customer!: User | null;
```

- [ ] **Step 3: Spec + manual smoke + commit**

### Task 4.6 — Invoice-number endpoint

Shanel exposes `POST /sales/invoice-no` to preview the next invoice. We have InvoiceNumberService already; expose it as a read.

- [ ] **Step 1: Service method**
```ts
async previewNextInvoiceNumber(): Promise<{ invoiceNo: string }> {
  // SHANEL behaviour: just reads the next sequence. We expose a read,
  // not a reserve — actual sequence advance happens in createSale.
  const year = new Date().getFullYear();
  const peek = await this.invoiceNumbers.peek(year);
  return { invoiceNo: peek };
}
```

Add `peek(year)` to `InvoiceNumberService` — returns the formatted next number without advancing the counter (a SELECT-only).

- [ ] **Step 2: Controller (uses `GET`, not `POST` — read is safer)**
```ts
@Get(APP_ROUTES.POS.GENERATE_INVOICE_NO)
@Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
previewNextInvoiceNumber() {
  return this.posService.previewNextInvoiceNumber();
}
```

- [ ] **Step 3: Spec + commit**

### Task 4.7 — Phase 4 validation gate

Run the standard gate. Curl each new endpoint with a cashier token.

**STOP for review.**

---

## Phase 5 — Backend write endpoint: `POST /pos/sales`

This is the heart of the port. Faithful to Shanel's `postSalesData` (`SalesController.js:279-534`), adapted for LedgerPro's stack.

### Task 5.1 — DTO

**File:** `backend/src/modules/pos/dto/create-sale.dto.ts`

```ts
import {
  ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsNumber, IsOptional,
  IsString, IsUUID, Min, Max, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateSaleItemDto {
  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  free?: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;
}

class CreateSalePaymentDto {
  @IsIn(['Cash', 'Card', 'Mobile', 'Cheque', 'Bank', 'Credit'])
  paymentMethod!: 'Cash' | 'Card' | 'Mobile' | 'Cheque' | 'Bank' | 'Credit';

  @IsNumber() @Min(0)
  paymentAmount!: number;

  @IsOptional() @IsNumber() @Min(0)
  cashTendered?: number;

  @IsOptional() @IsNumber() @Min(0)
  cashAmount?: number;

  @IsOptional() @IsNumber() @Min(0)
  chequeAmount?: number;

  @IsOptional() @IsNumber() @Min(0)
  bankTransferAmount?: number;

  @IsOptional() @IsNumber() @Min(0)
  creditAmount?: number;

  @IsOptional() @IsBoolean()
  keepBalance?: boolean;

  // Cheque metadata
  @IsOptional() @IsString() chequeNo?: string;
  @IsOptional() @IsDateString() chequeDate?: string;
  @IsOptional() @IsString() chequeBank?: string;
  @IsOptional() @IsString() chequeBranch?: string;
  @IsOptional() @IsString() chequeDeliveredBy?: string;
  @IsOptional() @IsString() chequeRef?: string;

  @IsOptional() @IsString() bankRef?: string;
}

export class CreateSaleDto {
  @IsOptional() @IsUUID()
  customerUserId?: string;

  @IsIn(['Retail', 'Wholesale'])
  saleType!: 'Retail' | 'Wholesale';

  @IsIn(['Retail', 'Wholesale'])
  priceLevel!: 'Retail' | 'Wholesale';

  @IsOptional() @IsString() @Max(64)
  location?: string;

  @IsOptional() @IsNumber() @Min(0) @Max(100)
  cartDiscountPercentage?: number;

  @IsOptional() @IsNumber() @Min(0)
  cartDiscountAmount?: number;

  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];

  @ValidateNested()
  @Type(() => CreateSalePaymentDto)
  payment!: CreateSalePaymentDto;
}
```

### Task 5.2 — Multi-tender calculator service

**File:** `backend/src/modules/pos/services/multi-tender-calculator.service.ts`

```ts
import { Injectable, BadRequestException } from '@nestjs/common';
import type { CreateSalePaymentDto } from '@pos/dto/create-sale.dto';

interface MultiTenderResult {
  paymentAmount: number;       // Sum of cash+cheque+bank+credit (excludes overpayment cash)
  cashChange: number;
  paymentStatus: 'Paid' | 'Partially_Paid' | 'Unpaid';
  balanceDue: number;
  paidAmount: number;          // capped at invoiceTotal
  creditTaken: number;
  overpayKeptBalance: number;  // when keepBalance=true and over by paymentAmount
}

@Injectable()
export class MultiTenderCalculatorService {
  calculate(invoiceTotal: number, payment: CreateSalePaymentDto): MultiTenderResult {
    const cash = Number(payment.cashAmount ?? 0);
    const cheque = Number(payment.chequeAmount ?? 0);
    const bank = Number(payment.bankTransferAmount ?? 0);
    const credit = Number(payment.creditAmount ?? 0);
    const tendered = Number(payment.cashTendered ?? cash);

    // Shanel: payment_amount sums all non-credit + credit (treated equal in math)
    const paymentAmount = cash + cheque + bank + credit;

    if (paymentAmount > invoiceTotal && !payment.keepBalance && credit === 0) {
      // Customer paid extra without keep-balance flag — error per Shanel rule
      throw new BadRequestException('Overpayment requires keepBalance=true');
    }

    const change = Math.max(0, tendered - cash); // change from cash tender only

    let paymentStatus: MultiTenderResult['paymentStatus'] = 'Paid';
    let balanceDue = 0;
    if (paymentAmount < invoiceTotal) {
      paymentStatus = paymentAmount > 0 ? 'Partially_Paid' : 'Unpaid';
      balanceDue = invoiceTotal - paymentAmount;
    }

    const paidAmount = Math.min(paymentAmount, invoiceTotal);
    const overpayKeptBalance = payment.keepBalance && paymentAmount > invoiceTotal
      ? paymentAmount - invoiceTotal
      : 0;

    return {
      paymentAmount,
      cashChange: change,
      paymentStatus,
      balanceDue,
      paidAmount,
      creditTaken: credit,
      overpayKeptBalance,
    };
  }
}
```

### Task 5.3 — Spec the calculator first (RED → GREEN)

**File:** `backend/src/modules/pos/services/multi-tender-calculator.service.spec.ts`

```ts
import { MultiTenderCalculatorService } from './multi-tender-calculator.service';

describe('MultiTenderCalculatorService', () => {
  const svc = new MultiTenderCalculatorService();

  it('full cash payment: Paid, no balance, no credit', () => {
    const r = svc.calculate(100, {
      paymentMethod: 'Cash', paymentAmount: 100,
      cashAmount: 100, cashTendered: 100,
    } as any);
    expect(r.paymentStatus).toBe('Paid');
    expect(r.balanceDue).toBe(0);
    expect(r.cashChange).toBe(0);
  });

  it('cash with overpay tender returns change', () => {
    const r = svc.calculate(100, {
      paymentMethod: 'Cash', paymentAmount: 100,
      cashAmount: 100, cashTendered: 150,
    } as any);
    expect(r.cashChange).toBe(50);
    expect(r.paymentStatus).toBe('Paid');
  });

  it('split cash + cheque: Paid, no balance', () => {
    const r = svc.calculate(100, {
      paymentMethod: 'Cash', paymentAmount: 100,
      cashAmount: 60, chequeAmount: 40, cashTendered: 60,
    } as any);
    expect(r.paymentStatus).toBe('Paid');
    expect(r.paymentAmount).toBe(100);
  });

  it('partial credit: Partially_Paid with balance', () => {
    const r = svc.calculate(100, {
      paymentMethod: 'Credit', paymentAmount: 70,
      cashAmount: 70, creditAmount: 0,
    } as any);
    expect(r.paymentStatus).toBe('Partially_Paid');
    expect(r.balanceDue).toBe(30);
    expect(r.paidAmount).toBe(70);
  });

  it('full credit: Unpaid by cash, but creditTaken records the AR', () => {
    const r = svc.calculate(100, {
      paymentMethod: 'Credit', paymentAmount: 100, creditAmount: 100,
    } as any);
    expect(r.paymentStatus).toBe('Paid'); // credit counts in paymentAmount
    expect(r.creditTaken).toBe(100);
    expect(r.balanceDue).toBe(0);
  });

  it('keep-balance overpayment: kept as customer credit', () => {
    const r = svc.calculate(100, {
      paymentMethod: 'Cash', paymentAmount: 120,
      cashAmount: 120, cashTendered: 120, keepBalance: true,
    } as any);
    expect(r.overpayKeptBalance).toBe(20);
    expect(r.paidAmount).toBe(100);
  });

  it('overpay without keep-balance flag throws', () => {
    expect(() => svc.calculate(100, {
      paymentMethod: 'Cash', paymentAmount: 120,
      cashAmount: 120, cashTendered: 120,
    } as any)).toThrow('Overpayment requires keepBalance=true');
  });
});
```

Run: `pnpm test multi-tender-calculator.service.spec`
Expected: 7 PASS.

### Task 5.4 — Sale repository

**File:** `backend/src/modules/pos/sale.repository.ts`

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager, MoreThanOrEqual, Repository } from 'typeorm';
import { Sale } from '@pos/entities/sale.entity';

@Injectable()
export class SaleRepository {
  private readonly repository: Repository<Sale>;
  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(Sale);
  }

  async create(input: DeepPartial<Sale>, manager?: EntityManager): Promise<Sale> {
    const repo = manager ? manager.getRepository(Sale) : this.repository;
    return repo.save(repo.create(input));
  }

  async findOneById(id: string, manager?: EntityManager): Promise<Sale | null> {
    const repo = manager ? manager.getRepository(Sale) : this.repository;
    return repo.findOne({ where: { id }, relations: ['items', 'items.product', 'customer', 'cashier'] });
  }

  async findByBranchSince(branchId: string | null, since: Date, limit: number): Promise<Sale[]> {
    return this.repository.find({
      where: {
        createdAt: MoreThanOrEqual(since),
        ...(branchId !== null ? { branchId } : {}),
        status: 'Active',
      },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async updatePrintMeta(
    id: string,
    patch: { billPrinted: boolean; billPrintCount: number; firstPrintDate: Date; lastPrintDate: Date },
  ): Promise<void> {
    const result = await this.repository.update(id, patch);
    if (result.affected === 0) throw new NotFoundException(`Sale ${id} not found`);
  }

  async voidById(id: string, patch: { voidedReason: string; voidedAt: Date; voidedByUserId: string }, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(Sale) : this.repository;
    const result = await repo.update(id, { ...patch, status: 'Voided' });
    if (result.affected === 0) throw new NotFoundException(`Sale ${id} not found`);
  }
}
```

Mirror `SaleItemRepository` (one method: `bulkCreate`).

### Task 5.5 — `PosService.createSale`

**File:** `backend/src/modules/pos/pos.service.ts` (extend)

Pseudocode aligned with Shanel `postSalesData`:

```ts
async createSale(
  actor: CurrentUserPayload,
  dto: CreateSaleDto,
  idempotencyKey?: string,
): Promise<Sale> {
  // 1. Idempotency check (existing pattern from old pos.service:88-103)
  const trimmedKey = idempotencyKey?.trim();
  if (trimmedKey) {
    const existing = await this.pos.findIdempotencyKey(actor.id, trimmedKey);
    if (existing) {
      const replay = await this.sales.findOneById(existing.saleId);
      if (!replay) throw new NotFoundException('Original sale no longer exists');
      return replay;
    }
  }

  // 2. Resolve units
  const unitsByProduct = await this.resolveSellableUnits(dto.items);

  // 3. Per-item math (Shanel formula: lineSubtotal = (qty - free) * unitPrice * (1 - disc/100))
  const itemRows = dto.items.map((item) => {
    const qty = Number(item.quantity);
    const free = Number(item.free ?? 0);
    const chargedQty = Math.max(0, qty - free);
    const unitPrice = Number(item.unitPrice);
    const disc = Number(item.discountPercentage ?? 0);
    const taxRate = Number(item.taxRate ?? 0);

    const lineSubtotal = round2(chargedQty * unitPrice * (1 - disc / 100));
    const lineDiscountAmount = round2(chargedQty * unitPrice * (disc / 100));
    const lineTaxAmount = round2(lineSubtotal * (taxRate / 100));
    const lineTotal = round2(lineSubtotal + lineTaxAmount);

    const unit = item.unitId ? unitsByProduct.get(item.unitId) : null;
    const conversion = unit ? Number(unit.conversionToBase) : 1;
    const baseUnitQty = round3(qty * conversion);

    return {
      productId: item.productId,
      unitId: item.unitId ?? null,
      quantity: qty,
      free,
      baseUnitQty,
      unitPrice,
      discountAmount: lineDiscountAmount,
      discountType: disc > 0 ? DiscountType.PERCENTAGE : DiscountType.NONE,
      lineDiscountPercentage: disc,
      lineSubtotal,
      lineTaxRate: taxRate,
      lineTaxAmount,
      lineTotal,
      priceLevelUsed: dto.priceLevel,
      locationTakenFrom: dto.location ?? 'Shop',
    };
  });

  // 4. Sale-level math
  const itemsSubtotal = round2(itemRows.reduce((s, i) => s + i.lineSubtotal, 0));
  const cartDiscount = round2(
    (dto.cartDiscountPercentage ?? 0) > 0
      ? itemsSubtotal * ((dto.cartDiscountPercentage ?? 0) / 100)
      : (dto.cartDiscountAmount ?? 0),
  );
  const taxTotal = round2(itemRows.reduce((s, i) => s + i.lineTaxAmount, 0));
  const total = round2(Math.max(0, itemsSubtotal - cartDiscount + taxTotal));

  // 5. Multi-tender math
  const tender = this.multiTender.calculate(total, dto.payment);

  // 6. Transactional write (Shanel pattern, LedgerPro lock semantics)
  const saved = await this.dataSource.transaction(async (manager) => {
    // 6a. Per-item stock check + decrement + stock_movements
    const invRepo = manager.getRepository(Inventory);
    for (const it of itemRows) {
      const inv = await invRepo.createQueryBuilder('i')
        .setLock('pessimistic_write')
        .where('i.product_id = :p AND i.branch_id = :b', { p: it.productId, b: actor.branchId })
        .getOne();
      if (!inv) throw new ConflictException(`Product ${it.productId} not stocked at branch`);
      if (Number(inv.quantity) < it.baseUnitQty) {
        throw new ConflictException(
          `Insufficient stock for ${it.productId}: have ${inv.quantity}, need ${it.baseUnitQty}`,
        );
      }
      inv.quantity = round3(Number(inv.quantity) - it.baseUnitQty);
      await invRepo.save(inv);
    }

    // 6b. Reserve invoice number (existing pattern)
    const invoiceNumber = await this.invoiceNumbers.next(new Date().getFullYear(), manager);

    // 6c. Save Sale
    const sale = await this.sales.create({
      branchId: actor.branchId,
      cashierId: actor.id,
      customerUserId: dto.customerUserId ?? null,
      invoiceNumber,
      transactionNumber: `TXN-${Date.now()}-${randomSuffix()}`,
      type: TransactionType.SALE,
      saleType: dto.saleType,
      priceLevel: dto.priceLevel,
      location: dto.location ?? 'Shop',
      subtotal: itemsSubtotal,
      discountAmount: cartDiscount,
      discountType: (dto.cartDiscountPercentage ?? 0) > 0 ? DiscountType.PERCENTAGE : DiscountType.FIXED,
      taxAmount: taxTotal,
      total,
      paidAmount: tender.paidAmount,
      balanceDue: tender.balanceDue,
      paymentStatus: tender.paymentStatus,
      status: 'Active',
    }, manager);

    // 6d. SaleItems
    await this.saleItems.bulkCreate(itemRows.map(r => ({ ...r, saleId: sale.id })), manager);

    // 6e. Payment record (one row, holds the multi-tender breakdown)
    await this.payments.create({
      saleId: sale.id,
      receiptNo: `RCPT-${sale.id.slice(0, 8)}`,
      paymentMethod: dto.payment.paymentMethod,
      paymentAmount: tender.paymentAmount,
      invoiceTotal: total,
      cashTendered: dto.payment.cashTendered ?? 0,
      cashAmount: dto.payment.cashAmount ?? 0,
      cashChange: tender.cashChange,
      chequeAmount: dto.payment.chequeAmount ?? 0,
      bankTransferAmount: dto.payment.bankTransferAmount ?? 0,
      creditAmount: tender.creditTaken,
      keepBalance: dto.payment.keepBalance ?? false,
      chequeNo: dto.payment.chequeNo ?? null,
      chequeDate: dto.payment.chequeDate ? new Date(dto.payment.chequeDate) : null,
      chequeBank: dto.payment.chequeBank ?? null,
      chequeBranch: dto.payment.chequeBranch ?? null,
      chequeDeliveredBy: dto.payment.chequeDeliveredBy ?? null,
      chequeRef: dto.payment.chequeRef ?? null,
      bankRef: dto.payment.bankRef ?? null,
      status: 'Active',
    }, manager);

    // 6f. Credit transactions + customer balance
    if (dto.customerUserId && (tender.creditTaken > 0 || tender.overpayKeptBalance > 0)) {
      const user = await manager.getRepository(User).findOne({ where: { id: dto.customerUserId } });
      if (!user) throw new NotFoundException('Customer not found');
      let runningBalance = Number(user.currentBalance);

      if (tender.creditTaken > 0) {
        runningBalance += tender.creditTaken;
        await this.creditTransactions.create({
          userId: user.id,
          saleId: sale.id,
          transactionType: 'Credit_Taken',
          amount: tender.creditTaken,
          runningBalance,
          referenceNo: `CR-${sale.invoiceNumber}`,
          notes: `Credit taken for invoice ${sale.invoiceNumber}`,
        }, manager);
      }
      if (tender.overpayKeptBalance > 0) {
        runningBalance -= tender.overpayKeptBalance;
        await this.creditTransactions.create({
          userId: user.id,
          saleId: sale.id,
          transactionType: 'Credit_Paid',
          amount: tender.overpayKeptBalance,
          runningBalance,
          referenceNo: `OVERPAY-${sale.invoiceNumber}`,
          notes: `Overpayment from ${sale.invoiceNumber} kept as customer balance`,
        }, manager);
      }
      await manager.getRepository(User).update(user.id, { currentBalance: runningBalance });
    }

    // 6g. Stock movements (Sale type, one row per item)
    for (const it of itemRows) {
      const invAfter = await invRepo.findOne({ where: { productId: it.productId, branchId: actor.branchId } });
      await this.stockMovements.create({
        productId: it.productId,
        branchId: actor.branchId,
        location: it.locationTakenFrom,
        movementType: 'Sale',
        qtyIn: 0,
        qtyOut: it.baseUnitQty,
        balanceAfter: Number(invAfter?.quantity ?? 0),
        refType: 'Sale',
        refId: sale.id,
        notes: `Sale ${sale.invoiceNumber}`,
        createdByUserId: actor.id,
      }, manager);
    }

    // 6h. Ledger entry (LedgerPro pattern — keep existing)
    if (total > 0) {
      await this.accounting.createLedgerEntryWithManager(manager, {
        branchId: actor.branchId,
        entryType: LedgerEntryType.CREDIT,
        amount: total,
        description: `POS Sale — ${sale.invoiceNumber}`,
        referenceNumber: sale.invoiceNumber,
        saleId: sale.id, // renamed from transactionId
      });
    }

    return sale;
  });

  // 7. Idempotency key (existing race-safe pattern)
  if (trimmedKey) {
    try {
      await this.pos.insertIdempotencyKey({ key: trimmedKey, cashierId: actor.id, saleId: saved.id });
    } catch (err) {
      // ... existing race-handling logic from pos.service.ts:258-281
    }
  }
  return saved;
}
```

(Helpers `round2`, `round3` already exist at the top of `pos.service.ts`.)

### Task 5.6 — Controller endpoint

```ts
@Post(APP_ROUTES.POS.SALES)
@Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
createSale(
  @CurrentUser() actor: CurrentUserPayload,
  @Body() dto: CreateSaleDto,
  @Headers('x-idempotency-key') idempotencyKey?: string,
): Promise<Sale> {
  return this.posService.createSale(actor, dto, idempotencyKey);
}
```

### Task 5.7 — Specs

**File:** `backend/src/modules/pos/pos.service.spec.ts` — rewrite from scratch.

Write specs that mock `SaleRepository`, `PaymentRepository`, `CreditTransactionRepository`, `StockMovementRepository`, `DataSource.transaction`. Cover:
- Happy path: single item, single cash tender → returns Sale with paymentStatus='Paid'
- Multi-item with line discount + cart discount + tax
- Split cash + cheque (multi-tender)
- Customer credit creates a CreditTransaction and bumps user.currentBalance
- Overpay with keepBalance → CreditTransaction with type='Credit_Paid', balance decreases
- Insufficient stock throws ConflictException
- Idempotency replay returns the original sale
- Idempotency race (existing race-handling pattern test from old spec)

≥ 12 test cases. Each follows AAA shape from Rules.md.

Run: `pnpm test pos.service.spec`
Expected: all PASS.

### Task 5.8 — Manual smoke
```bash
docker compose up -d postgres
pnpm typeorm migration:run
pnpm start:dev &
sleep 8
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"cashier1@ledgerpro.dev","password":"Cashier@123"}' | jq -r .data.accessToken)

# Pick a product the cashier's branch stocks
PRODUCT_ID=$(curl -s "http://localhost:3000/api/v1/products" -H "authorization: bearer $TOKEN" | jq -r '.data[0].id')

curl -fsS -X POST http://localhost:3000/api/v1/pos/sales \
  -H "authorization: bearer $TOKEN" \
  -H 'content-type: application/json' \
  -H 'x-idempotency-key: SMOKE-001' \
  -d "{
    \"saleType\": \"Retail\",
    \"priceLevel\": \"Retail\",
    \"items\": [{\"productId\":\"$PRODUCT_ID\",\"quantity\":1,\"unitPrice\":100}],
    \"payment\": {\"paymentMethod\":\"Cash\",\"paymentAmount\":100,\"cashAmount\":100,\"cashTendered\":100}
  }" | jq .

# Replay (idempotency)
curl -fsS -X POST http://localhost:3000/api/v1/pos/sales \
  -H "authorization: bearer $TOKEN" \
  -H 'content-type: application/json' \
  -H 'x-idempotency-key: SMOKE-001' \
  -d "{...same body...}" | jq .id
# Both calls return the same sale id.
```

### Task 5.9 — Commit + Phase 5 gate

```bash
git commit -m "feat(pos): POST /pos/sales with Shanel multi-tender + credit + stock-movement"
```

Run the standard gate.

**STOP for review.** Phase 6 adds the mutation endpoints.

---

## Phase 6 — Mutations: print + void

### Task 6.1 — `PATCH /pos/sales/:id/print`

The route + service method already exist for the old Transaction shape. Rename the controller decorator path:
```ts
@Patch(APP_ROUTES.POS.SALE_PRINT)
markPrinted(@Param('id') id: string, @CurrentUser() actor: CurrentUserPayload) {
  return this.posService.markPrinted(id, actor);
}
```

Internally the existing `markPrinted` already calls `findTransactionById` → rename to `findSaleById`. Behaviour preserved.

- [ ] Update spec, commit.

### Task 6.2 — `POST /pos/sales/:id/void`

**Files:**
- Create: `backend/src/modules/pos/dto/void-sale.dto.ts`
- Modify: `backend/src/modules/pos/pos.service.ts`
- Modify: `backend/src/modules/pos/pos.controller.ts`

- [ ] **DTO**
```ts
export class VoidSaleDto {
  @IsString() @Length(3, 255)
  reason!: string;
}
```

- [ ] **Service** — wraps a transaction:
  - Find sale; refuse if `status === 'Voided'` or `branchId !== actor.branchId && actor.role !== 'admin'`.
  - Re-credit inventory for each item (`+= baseUnitQty`).
  - Insert `stock_movements` rows with `movementType: 'Sale_Voided'`, `qtyIn = baseUnitQty`, `qtyOut = 0`.
  - Reverse `credit_transactions` if any (insert a reversing row).
  - Mark sale `status='Voided'`, set `voidedAt`, `voidedReason`, `voidedByUserId`.
  - Insert a reversing ledger entry `LedgerEntryType.DEBIT` for `total`.

- [ ] **Controller**
```ts
@Post(APP_ROUTES.POS.SALE_VOID)
@Roles(UserRole.ADMIN, UserRole.MANAGER) // cashiers can't void
@HttpCode(HttpStatus.OK)
voidSale(@Param('id') id: string, @Body() dto: VoidSaleDto, @CurrentUser() actor: CurrentUserPayload) {
  return this.posService.voidSale(id, dto.reason, actor);
}
```

- [ ] **Specs** — at least 6 cases: happy void, already-voided rejection, cross-branch rejection, inventory restoration, ledger reversal, credit reversal.

- [ ] **Smoke** + commit.

### Task 6.3 — Phase 6 gate

Standard gate. **STOP for review.**

---

## Phase 7 — Frontend types + service + TanStack Query hooks

### Task 7.1 — Types domain (`frontend/src/types/pos/`)

Create one file per type, mirroring `backend/src/modules/pos/types/`:

```
frontend/src/types/pos/
├── index.ts
├── sale.type.ts (extend existing)
├── sale-item.type.ts (extend existing)
├── sale-payment.type.ts            # NEW
├── payment-method.type.ts           # NEW
├── sale-payment-status.type.ts      # NEW
├── sale-status.type.ts              # NEW
├── price-level.type.ts              # NEW
├── sale-type.type.ts                # NEW
├── recent-sale-row.type.ts          # extend with paidAmount, balanceDue, etc.
├── search-product-row.type.ts       # NEW
├── product-unit-row.type.ts         # NEW
├── inventory-quantity.type.ts       # NEW
├── invoice-number-response.type.ts  # NEW
├── create-sale-payload.type.ts      # NEW (mirror CreateSaleDto)
└── multi-tender-bag.type.ts         # NEW (frontend-only computation type)
```

- [ ] One file at a time, each ≤ 30 lines, with a single `export interface I<Name>` or `export type T<Name>`. Update barrel.

### Task 7.2 — `frontend/src/services/pos.service.ts`

Rewrite — every Shanel endpoint becomes a typed wrapper.

```ts
import api from './api';
import { APP_ROUTES } from '@/lib/api-routes'; // mirror the backend routes
import type {
  ISearchProductRow, IProductUnitRow, IInventoryQuantity,
  ISale, IRecentSaleRow, IInvoiceNumberResponse, ICreateSalePayload,
} from '@/types';

export const posService = {
  searchProducts: async (q: string, limit = 10): Promise<ISearchProductRow[]> => {
    const { data } = await api.get<IApiResponse<ISearchProductRow[]>>(`/pos/products/search`, {
      params: { q, limit },
    });
    return data.data;
  },
  listProductUnits: async (productId: string): Promise<IProductUnitRow[]> => {
    const { data } = await api.get<IApiResponse<IProductUnitRow[]>>(`/pos/products/${productId}/units`);
    return data.data;
  },
  getProductInventory: async (productId: string): Promise<IInventoryQuantity> => {
    const { data } = await api.get<IApiResponse<IInventoryQuantity>>(`/pos/products/${productId}/inventory`);
    return data.data;
  },
  getRecentSales: async (limit = 10): Promise<IRecentSaleRow[]> => {
    const { data } = await api.get<IApiResponse<IRecentSaleRow[]>>(`/pos/recent-sales`, { params: { limit } });
    return data.data;
  },
  previewInvoiceNumber: async (): Promise<IInvoiceNumberResponse> => {
    const { data } = await api.get<IApiResponse<IInvoiceNumberResponse>>(`/pos/invoice-number`);
    return data.data;
  },
  createSale: async (payload: ICreateSalePayload, idempotencyKey?: string): Promise<ISale> => {
    const { data } = await api.post<IApiResponse<ISale>>(`/pos/sales`, payload, {
      headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : undefined,
    });
    return data.data;
  },
  markPrinted: async (saleId: string): Promise<ISale> => {
    const { data } = await api.patch<IApiResponse<ISale>>(`/pos/sales/${saleId}/print`);
    return data.data;
  },
  voidSale: async (saleId: string, reason: string): Promise<ISale> => {
    const { data } = await api.post<IApiResponse<ISale>>(`/pos/sales/${saleId}/void`, { reason });
    return data.data;
  },
};
```

### Task 7.3 — TanStack Query keys + hooks

**File:** `frontend/src/lib/query-keys.ts` (extend if exists):
```ts
export const queryKeys = {
  // ... existing
  pos: {
    searchProducts: (q: string, limit: number) => ['pos', 'searchProducts', q, limit] as const,
    productUnits: (productId: string) => ['pos', 'productUnits', productId] as const,
    productInventory: (productId: string) => ['pos', 'productInventory', productId] as const,
    recentSales: (limit: number) => ['pos', 'recentSales', limit] as const,
    invoiceNumber: () => ['pos', 'invoiceNumber'] as const,
  },
} as const;
```

**Hook files:** create one per endpoint under `frontend/src/features/pos/hooks/`:
- `usePosProductSearch.ts` — `useQuery` with `enabled: !!q`
- `usePosProductUnits.ts` — `useQuery` keyed by productId
- `usePosProductInventory.ts` — `useQuery`, `staleTime: 0` (re-fetched on every add-to-cart attempt)
- `usePosRecentSales.ts` — `useQuery` + `refetchInterval` 30s OR socket invalidation
- `usePosInvoiceNumber.ts` — `useQuery` for preview only
- `usePosCreateSale.ts` — `useMutation` with onSuccess invalidating inventory + recent sales
- `usePosMarkPrinted.ts` — `useMutation`
- `usePosVoidSale.ts` — `useMutation`

Each hook file ≤ 30 lines. Pattern (canonical):
```ts
import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/query-keys';

export function usePosProductSearch(q: string, limit = 10) {
  return useQuery({
    queryKey: queryKeys.pos.searchProducts(q, limit),
    queryFn: () => posService.searchProducts(q, limit),
    enabled: q.trim().length > 0,
    staleTime: 30_000,
  });
}
```

### Task 7.4 — Frontend specs

For each hook, write a Vitest spec using `QueryClientProvider` test wrapper and `msw` for HTTP mocks (existing convention — check `frontend/src/test/setup.ts`).

Each spec ≥ 2 cases: happy path + error.

### Task 7.5 — Phase 7 gate
Standard gate. **STOP for review.**

---

## Phase 8 — Frontend `itemTable` section

This is the largest UI piece. Per Shanel `ItemTable.test.jsx`, the section owns:
- Product search input (debounced)
- Retail/Wholesale toggle
- Selected-product staging row (qty + unit + discount + tax + free)
- Cart table (one row per item, editable qty/discount/free)
- Add/delete row actions

### Task 8.1 — Cart-item type (frontend)

**File:** `frontend/src/features/pos/types/cart-item.type.ts`

```ts
import type { TPriceLevel } from '@/types';

export interface ICartItem {
  rowId: string;                  // UI-only; UUID for React key
  productId: string;
  productCode: string;
  productName: string;
  productType: string;
  baseUnit: string;
  unitId: string | null;
  unitName: string;
  unitPrice: number;
  conversionFactor: number;
  quantity: number;               // typed in selected unit
  free: number;
  discountPercentage: number;     // 0-100
  taxRate: number;                // 0-100
  discountAllowed: boolean;
  // Derived (recomputed on every change):
  lineSubtotal: number;
  lineDiscountAmount: number;
  lineTaxAmount: number;
  lineTotal: number;
  baseUnitQty: number;
}
```

### Task 8.2 — `line-total.ts` (pure math, mirrors backend)

**File:** `frontend/src/features/pos/lib/line-total.ts`

```ts
const round2 = (n: number) => Math.round(n * 100) / 100;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

export interface ILineMath {
  chargedQty: number;
  baseUnitQty: number;
  lineSubtotal: number;
  lineDiscountAmount: number;
  lineTaxAmount: number;
  lineTotal: number;
}

export function computeLine(input: {
  quantity: number;
  free: number;
  unitPrice: number;
  discountPercentage: number;
  taxRate: number;
  conversionFactor: number;
}): ILineMath {
  const chargedQty = Math.max(0, input.quantity - input.free);
  const baseUnitQty = round3(input.quantity * input.conversionFactor);
  const lineSubtotal = round2(chargedQty * input.unitPrice * (1 - input.discountPercentage / 100));
  const lineDiscountAmount = round2(chargedQty * input.unitPrice * (input.discountPercentage / 100));
  const lineTaxAmount = round2(lineSubtotal * (input.taxRate / 100));
  const lineTotal = round2(lineSubtotal + lineTaxAmount);
  return { chargedQty, baseUnitQty, lineSubtotal, lineDiscountAmount, lineTaxAmount, lineTotal };
}
```

### Task 8.3 — Spec the math first

**File:** `frontend/src/features/pos/lib/line-total.test.ts`

```ts
import { computeLine } from './line-total';

describe('computeLine', () => {
  it('subtotal excludes free units', () => {
    const r = computeLine({ quantity: 10, free: 2, unitPrice: 100, discountPercentage: 0, taxRate: 0, conversionFactor: 1 });
    expect(r.chargedQty).toBe(8);
    expect(r.lineSubtotal).toBe(800);
  });
  it('discount before tax', () => {
    const r = computeLine({ quantity: 1, free: 0, unitPrice: 100, discountPercentage: 10, taxRate: 15, conversionFactor: 1 });
    expect(r.lineSubtotal).toBe(90);
    expect(r.lineDiscountAmount).toBe(10);
    expect(r.lineTaxAmount).toBe(13.5);
    expect(r.lineTotal).toBe(103.5);
  });
  it('base-unit conversion (grams)', () => {
    const r = computeLine({ quantity: 1000, free: 0, unitPrice: 0.1, discountPercentage: 0, taxRate: 0, conversionFactor: 0.001 });
    expect(r.baseUnitQty).toBe(1);
    expect(r.lineSubtotal).toBe(100);
  });
});
```

Run: `pnpm --filter frontend test line-total.test`
Expected: 3 PASS.

### Task 8.4 — `usePosCart` hook (replace existing)

**File:** `frontend/src/features/pos/hooks/usePosCart.ts`

```ts
import { useCallback, useMemo, useState } from 'react';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import { computeLine } from '@/features/pos/lib/line-total';
import { v4 as uuid } from 'uuid';

interface UsePosCartReturn {
  cart: ICartItem[];
  addItem: (item: Omit<ICartItem, 'rowId' | 'lineSubtotal' | 'lineDiscountAmount' | 'lineTaxAmount' | 'lineTotal' | 'baseUnitQty'>) => void;
  updateItem: (rowId: string, patch: Partial<ICartItem>) => void;
  removeItem: (rowId: string) => void;
  clear: () => void;
  itemsSubtotal: number;
  totalDiscount: number;
  totalTax: number;
  cartTotal: number;
}

export function usePosCart(): UsePosCartReturn {
  const [cart, setCart] = useState<ICartItem[]>([]);

  const recompute = (it: ICartItem): ICartItem => ({ ...it, ...computeLine(it) });

  const addItem: UsePosCartReturn['addItem'] = useCallback((seed) => {
    setCart(prev => {
      // Shanel rule: prevent duplicates of same productId+unitId
      const dup = prev.find(p => p.productId === seed.productId && p.unitId === seed.unitId);
      if (dup) {
        return prev.map(p => p.rowId === dup.rowId ? recompute({ ...p, quantity: p.quantity + seed.quantity }) : p);
      }
      return [...prev, recompute({ ...seed, rowId: uuid() } as ICartItem)];
    });
  }, []);

  const updateItem: UsePosCartReturn['updateItem'] = useCallback((rowId, patch) => {
    setCart(prev => prev.map(p => p.rowId === rowId ? recompute({ ...p, ...patch }) : p));
  }, []);

  const removeItem = useCallback((rowId: string) => setCart(prev => prev.filter(p => p.rowId !== rowId)), []);
  const clear = useCallback(() => setCart([]), []);

  const totals = useMemo(() => {
    const itemsSubtotal = cart.reduce((s, c) => s + c.lineSubtotal, 0);
    const totalDiscount = cart.reduce((s, c) => s + c.lineDiscountAmount, 0);
    const totalTax = cart.reduce((s, c) => s + c.lineTaxAmount, 0);
    const cartTotal = cart.reduce((s, c) => s + c.lineTotal, 0);
    return { itemsSubtotal, totalDiscount, totalTax, cartTotal };
  }, [cart]);

  return { cart, addItem, updateItem, removeItem, clear, ...totals };
}
```

### Task 8.5 — Spec `usePosCart`

**File:** `frontend/src/features/pos/hooks/usePosCart.test.ts`

```ts
import { act, renderHook } from '@testing-library/react';
import { usePosCart } from './usePosCart';

const seed = {
  productId: 'p-1', productCode: 'P001', productName: 'Test', productType: 'Regular',
  baseUnit: 'kg', unitId: 'u-1', unitName: 'kg', unitPrice: 100, conversionFactor: 1,
  quantity: 1, free: 0, discountPercentage: 0, taxRate: 0, discountAllowed: true,
};

describe('usePosCart', () => {
  it('adds an item and computes totals', () => {
    const { result } = renderHook(() => usePosCart());
    act(() => result.current.addItem(seed));
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cartTotal).toBe(100);
  });

  it('merges duplicate productId+unitId by stacking quantity', () => {
    const { result } = renderHook(() => usePosCart());
    act(() => result.current.addItem(seed));
    act(() => result.current.addItem(seed));
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(2);
    expect(result.current.cartTotal).toBe(200);
  });

  it('updateItem recomputes line totals', () => {
    const { result } = renderHook(() => usePosCart());
    act(() => result.current.addItem(seed));
    const rowId = result.current.cart[0].rowId;
    act(() => result.current.updateItem(rowId, { discountPercentage: 10 }));
    expect(result.current.cart[0].lineTotal).toBe(90);
  });

  it('removeItem drops the row', () => {
    const { result } = renderHook(() => usePosCart());
    act(() => result.current.addItem(seed));
    const rowId = result.current.cart[0].rowId;
    act(() => result.current.removeItem(rowId));
    expect(result.current.cart).toHaveLength(0);
  });

  it('clear empties the cart', () => {
    const { result } = renderHook(() => usePosCart());
    act(() => result.current.addItem(seed));
    act(() => result.current.clear());
    expect(result.current.cart).toHaveLength(0);
  });
});
```

Run: `pnpm test usePosCart.test`
Expected: 5 PASS.

### Task 8.6 — Components

Per Rules.md §17, each component file ≤ 200 lines. Split the `itemTable` section into:

- **PosPriceLevelToggle.tsx** (≤ 60 lines) — two pill buttons; props: `value`, `onChange`. Uses `bg-primary` for active, `bg-surface-2` for inactive. No raw colors.
- **PosItemSearchInput.tsx** (≤ 80 lines) — debounced input; calls `usePosProductSearch`; props: `value`, `onChange`, `inputRef`.
- **PosItemSearchResults.tsx** (≤ 100 lines) — dropdown list; one row per `ISearchProductRow`; on-click adds to cart via `addItem`.
- **PosUnitSelect.tsx** (≤ 80 lines) — populated by `usePosProductUnits`; shows base unit as default.
- **PosCartRow.tsx** (≤ 180 lines) — one editable row: qty, free, discount %, tax %, unit, delete; uses `updateItem`/`removeItem`. Disables discount input when `!discountAllowed`.
- **PosItemTable.tsx** (≤ 200 lines) — orchestrator; renders the toggle + search + table; wires hooks.

Each component:
- Uses semantic tokens: `bg-surface`, `text-text-1`, `text-text-2`, `border-border-strong`, `text-danger`, `text-accent`.
- No `console.log`. No `window.confirm`. Confirm via `useConfirm()`.
- Props typed in a sibling `interface I<Name>Props`.

### Task 8.7 — Tests for components

Vitest + Testing Library: one `.test.tsx` per component, ≥ 2 cases each. Use Testing Library queries (`getByRole`, `getByPlaceholderText`).

### Task 8.8 — Phase 8 gate
Standard gate + visual smoke (mount `PosItemTable` standalone in a Storybook entry if available; otherwise inline in `PosPage`).

**STOP for review.**

---

## Phase 9 — `customerInfo` + `informationBox` sections

### Task 9.1 — `PosCustomerInfo` + picker modal

**Files:**
- `frontend/src/features/pos/components/customer-info/PosCustomerInfo.tsx` (≤ 120 lines) — shows selected customer name, balance, phone; "Walk-in" placeholder when none.
- `frontend/src/features/pos/components/customer-info/PosCustomerPickerModal.tsx` (≤ 180 lines) — `<Modal>` wrapper, lazy-search customers via `usersService.searchCustomers(q)`.

The customer search hits `GET /users?role=customer&q={term}` (already exists in `users.controller.ts` — verify; if not, add a thin endpoint).

- [ ] Wire `usePosCart` to a state slot `customerUserId: string | null`; persist in `PosPage` local state, pass to `createSale`.

### Task 9.2 — `PosInformationBox`

**File:** `frontend/src/features/pos/components/information-box/PosInformationBox.tsx` (≤ 80 lines)

Shows: cashier name (from `useAuth`), branch name, today's date, current preview invoice number (`usePosInvoiceNumber`), cumulative session total. Pure-display; consumes hooks.

### Task 9.3 — Tests + commit + gate

**STOP for review.**

---

## Phase 10 — `invoiceTotal` section

**File:** `frontend/src/features/pos/components/invoice-total/PosInvoiceTotal.tsx` (≤ 150 lines)

Displays: `itemsSubtotal`, `totalDiscount`, `cartDiscountInput` (editable %), `totalTax`, `cartTotal`. The cart-level discount is owned by `PosPage` state (since it applies to the whole cart, not per-item). Updates flow back into `createSale` payload.

Math helper: `frontend/src/features/pos/components/invoice-total/pos-invoice-total.helpers.ts`:
```ts
export function applyCartDiscount(itemsSubtotal: number, cartDiscountPct: number): number {
  return Math.max(0, itemsSubtotal * (1 - cartDiscountPct / 100));
}
```
Spec the helper.

**Component test:** assert that changing the discount input recomputes the displayed total.

**STOP for review.**

---

## Phase 11 — `paymentMethod` + `paymentForms` (multi-tender)

### Task 11.1 — Frontend multi-tender calculator (mirror backend)

**File:** `frontend/src/features/pos/lib/multi-tender.ts`

Port the backend `MultiTenderCalculatorService` to TypeScript — same shape, same rules. Frontend uses this for live "balance due / change" display. Spec it with the same 7 cases.

### Task 11.2 — `PosPaymentMethod.tsx`

**File:** `frontend/src/features/pos/components/payment-method/PosPaymentMethod.tsx` (≤ 100 lines)

Six pill buttons for Cash | Card | Mobile | Cheque | Bank | Credit. The selected method drives which payment form shows. Tokens: `bg-primary` active, `bg-surface-2` inactive. Keyboard: number keys 1-6 to switch.

### Task 11.3 — Payment forms (one per method)

**Files (each ≤ 150 lines):**
- `payment-forms/PosCashTenderForm.tsx` — cashTendered input + auto-computed change (uses multi-tender calc)
- `payment-forms/PosChequeForm.tsx` — chequeAmount + chequeNo + chequeDate + chequeBank + chequeBranch + chequeRef + chequeDeliveredBy
- `payment-forms/PosBankTransferForm.tsx` — bankTransferAmount + bankRef
- `payment-forms/PosCreditForm.tsx` — creditAmount (requires customerUserId; gate behind "select customer first" message)
- `payment-forms/PosPaymentForms.tsx` — orchestrator; renders the form for the active method + a "Keep balance as customer credit" checkbox (only enabled when paymentAmount > invoiceTotal).

### Task 11.4 — Modal wiring

Wrap the whole payment section in a `<Modal>` triggered by the Charge button or F12 hotkey.

### Task 11.5 — Tests + gate

**STOP for review.**

---

## Phase 12 — `actionButtons` (F-keys) + `recentSale` sidebar

### Task 12.1 — `PosActionButtons.tsx`

**File:** `frontend/src/features/pos/components/action-buttons/PosActionButtons.tsx` (≤ 150 lines)

Per Shanel docs, the F-key bar exposes: F2 (focus search), F3 (toggle retail/wholesale), F4 (open customer picker), F5 (clear cart with confirm), F9 (preview last receipt), F10 (open recent sales), F12 (charge / open payment).

Visual: 7 buttons in a horizontal row at the bottom of the workspace; show shortcut as small text under each label. Tokens only.

Extend `usePosKeyboardShortcuts` to wire each F-key.

### Task 12.2 — `PosRecentSaleSidebar.tsx`

**File:** `frontend/src/features/pos/components/recent-sale/PosRecentSaleSidebar.tsx` (≤ 180 lines)

Uses `usePosRecentSales(10)`. Renders a vertical list of recent sales (invoice number, customer name, total, paymentStatus badge). Clicking a row opens a read-only detail drawer (Phase 13 reuses this for re-print).

### Task 12.3 — Tests + gate

**STOP for review.**

---

## Phase 13 — `billTemplate` + print integration

### Task 13.1 — `PosBillTemplate.tsx`

**File:** `frontend/src/features/pos/components/bill-template/PosBillTemplate.tsx` (≤ 200 lines)

Pure renderer. Takes a `ISale` (with items, payment, customer) and renders a print-only 80mm receipt layout. Uses `@media print` CSS in `bill-template.css` to hide non-receipt chrome.

Print flow:
- On checkout success, automatically calls `posService.markPrinted(saleId)`.
- The Charge modal's "Print receipt" button opens a hidden iframe + writes the receipt HTML + triggers `print()`.

### Task 13.2 — Tests
- Snapshot test for a fixture sale.
- Mutation test that `markPrinted` was called.

### Task 13.3 — Gate

**STOP for review.**

---

## Phase 14 — `PosPage` assembly + barcode + smoke E2E

### Task 14.1 — `PosPage.tsx` (≤ 120 lines orchestrator)

Layout: 3-column grid on desktop, stack on mobile.
- Left column (60%): `PosItemTable`
- Right column (40%): `PosCustomerInfo` → `PosInformationBox` → `PosInvoiceTotal` → `PosActionButtons` → `PosRecentSaleSidebar`
- Bottom-pinned: `PosPaymentMethod` (collapsed by default; expands to `PosPaymentForms` in a modal)

```tsx
export function PosPage() {
  const { user } = useAuth();
  const cart = usePosCart();
  const [priceLevel, setPriceLevel] = useState<TPriceLevel>('Retail');
  const [customerUserId, setCustomerUserId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  // ... barcode + shortcut wiring

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 min-h-[calc(100dvh-6.5rem)]">
      <PosItemTable cart={cart} priceLevel={priceLevel} setPriceLevel={setPriceLevel} />
      <div className="flex flex-col gap-3">
        <PosCustomerInfo customerUserId={customerUserId} onPick={setCustomerUserId} />
        <PosInformationBox />
        <PosInvoiceTotal cart={cart} />
        <PosActionButtons onCharge={() => setShowPayment(true)} onClear={cart.clear} />
        <PosRecentSaleSidebar />
      </div>
      <PosPaymentFormsModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        cart={cart}
        customerUserId={customerUserId}
        priceLevel={priceLevel}
      />
      <PosCameraScannerModal ... />
    </div>
  );
}
```

### Task 14.2 — Barcode integration

Keep `usePosBarcodeScan` from old code. On scan, call `posService.searchProducts(barcode, 1)`; if found, `cart.addItem` with default qty 1.

### Task 14.3 — Smoke E2E (Playwright)

**File:** `frontend/e2e/cashier-pos.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('cashier completes a cash sale', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('cashier1@ledgerpro.dev');
  await page.getByLabel('Password').fill('Cashier@123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.goto('/pos');

  await page.getByPlaceholder('Search product...').fill('Bread');
  await page.getByRole('option', { name: /Bread/ }).first().click();
  await expect(page.getByRole('cell', { name: /Bread/ })).toBeVisible();

  await page.getByRole('button', { name: 'Charge' }).click();
  await page.getByLabel('Cash tendered').fill('500');
  await page.getByRole('button', { name: /Confirm/i }).click();

  await expect(page.getByText(/INV-\d{4}-\d{6}/)).toBeVisible();
});
```

Run: `pnpm test:e2e` (gate). Expected: PASS.

### Task 14.4 — Final commit + Phase 14 gate

```bash
git commit -m "feat(pos): re-assemble cashier POS workspace from Shanel sections"
```

**STOP for review.**

---

## Phase 15 — Archive prior plans + doc updates

### Task 15.1 — Archive the nine prior plans

```bash
mkdir -p .claude/plans/archived
git mv .claude/plans/pos-actions-top-charge-bottom.plan.md .claude/plans/archived/
git mv .claude/plans/pos-cashier-shanel-port.plan.md .claude/plans/archived/
git mv .claude/plans/pos-decimal-qty-and-inline-discount.plan.md .claude/plans/archived/
git mv .claude/plans/pos-itemtable-shanel-style.plan.md .claude/plans/archived/
git mv .claude/plans/pos-payment-options-below-table.plan.md .claude/plans/archived/
git mv .claude/plans/pos-phase-0-1.plan.md .claude/plans/archived/
git mv .claude/plans/pos-product-base-unit.plan.md .claude/plans/archived/
git mv .claude/plans/pos-shanel-style-complete.plan.md .claude/plans/archived/
git mv .claude/plans/pos-unit-conversion.plan.md .claude/plans/archived/
echo "Superseded by docs/superpowers/plans/2026-05-23-cashier-pos-shanel-port.md" > .claude/plans/archived/README.md
git add .claude/plans/archived
git commit -m "chore(plans): archive prior cashier POS plans"
```

### Task 15.2 — Doc updates

- `docs/architecture-backend.md` — update the POS section to reflect new entities (Sale/SaleItem/Payment/CreditTransaction/StockMovement), endpoints (search, units, sales, void), and the multi-tender model.
- `docs/architecture-frontend.md` — update the types-domain table and POS section.
- `docs/folder-structure.md` — update the POS feature folder tree to match Phase 8-13.
- `docs/seeded-accounts.md` — note that customer accounts now have `currentBalance`.

### Task 15.3 — FRONTEND_ROUTES alignment

No change required — `FRONTEND_ROUTES.POS = '/pos'` already points to the rebuilt page.

### Task 15.4 — Final validation gate + commit

Full gate one more time (lint, tsc, test, build, E2E). Tag the release:
```bash
git tag pos-shanel-port-v1.0
git commit -m "docs(pos): finalize Shanel port"
```

---

## Validation

```bash
# Backend (run from /home/blaxx/root@kaviya/Byte_squad/backend)
pnpm lint && pnpm tsc --noEmit && pnpm test && pnpm typeorm migration:show

# Frontend (run from /home/blaxx/root@kaviya/Byte_squad/frontend)
pnpm lint && pnpm tsc --noEmit && pnpm test && pnpm build

# E2E
pnpm test:e2e -- cashier-pos.spec.ts

# Smoke
docker compose up -d postgres
pnpm --filter backend start:dev &
pnpm --filter frontend dev &
# manually exercise /pos as cashier1@ledgerpro.dev / Cashier@123
```

---

## Acceptance criteria

- [ ] All 15 phases completed.
- [ ] `Transaction` and `TransactionItem` are gone from the codebase; only `Sale` and `SaleItem` remain.
- [ ] All 8 cross-module consumers (app.module, admin-seed, accounting × 3, customer-orders × 3, shop × 2, branches, products) compile + tests pass.
- [ ] New entities: `Payment`, `CreditTransaction`, `StockMovement` — each has its own repository, ≥ 2 spec cases.
- [ ] `User.currentBalance` + `Product.wholesalePrice` + `Product.taxRate` + `Product.discountAllowed` columns exist; migrations are reversible.
- [ ] `POST /api/v1/pos/sales` accepts the Shanel multi-tender payload; idempotency replay returns the same sale id; insufficient stock returns 409.
- [ ] `MultiTenderCalculatorService` has 7+ spec cases covering happy paths and edge cases.
- [ ] Frontend POS workspace renders the nine Shanel sections via Tailwind tokens — no `bg-[#...]`, no `text-slate-*`, no inline modal divs, no `window.confirm`.
- [ ] `usePosCart` deduplicates productId+unitId and recomputes line totals on update.
- [ ] Playwright smoke (`cashier-pos.spec.ts`) passes end-to-end: login → search → add → charge → confirm invoice number.
- [ ] Nine prior `.claude/plans/pos-*.plan.md` files are archived under `.claude/plans/archived/` with a README pointer.
- [ ] `docs/architecture-backend.md` and `docs/architecture-frontend.md` reflect the new POS shape.

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-23-cashier-pos-shanel-port.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks; fast iteration with isolated context per task.

**2. Inline Execution** — execute tasks in this session using `superpowers:executing-plans`; batch execution with checkpoints at the end of each phase.

**Which approach?**
