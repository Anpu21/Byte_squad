# LedgerPro ↔ Shanel_ERP — Feature Gap Analysis

> **Question answered:** "What features are missing in LedgerPro vs. the reference project (`docs/sample-project/Shanel_ERP`)?"
> **Date:** 2026-06-04 · **Author:** senior-dev audit (Claude)
> **Status:** Audit only — no code changed. Roadmap at the end is a proposal for your review.

---

## 1. Context & method

LedgerPro's current branch is `feat/pos-shanel-port` — i.e. LedgerPro has been **porting features _from_ Shanel_ERP**. This audit identifies what hasn't been ported yet.

The two systems are **different stacks**, so this is a _feature_ diff, not a code diff:

| | LedgerPro (this repo) | Shanel_ERP (reference) |
|---|---|---|
| Backend | NestJS · TypeScript · TypeORM · **Postgres** | **Express** · Sequelize · **MySQL** |
| Frontend | React 19 · **TS** · Redux · TanStack Query | React 19 · **JS/JSX** · Context API · i18next |
| Payments | **PayHere** | **Stripe** |
| Languages | English only | **English + Sinhala + Tamil** |
| Shape | Multi-branch retail POS + customer storefront | Single-org ERP w/ production + full accounting |

**How I mapped it:** Shanel_ERP's `backend/routes`, `controllers`, `models`, `migrations`, and its 16-file `docs/inventory-module-guide/` were read directly (it is gitignored and not in the graph). LedgerPro was mapped from its 16 backend modules + the graphify knowledge graph.

**Confidence caveats (read before acting):**
- Shanel's **backend is the mature part**; large parts of its **frontend `services/`, `storeContext/`, `utils/` are empty skeletons** — so some "pages" in its module guide are _documented intent_, not necessarily shipping UI.
- Shanel has **no real `PurchaseOrder` entity** — purchasing is supplier master + a payables ledger (`SupplierTransaction`) + supplier payments. Don't over-scope a PO engine.
- Shanel is a Sri-Lankan domestic ERP (LKR, EPF/ETF, Sinhala/Tamil). Some gaps are **market-specific** and only worth closing if LedgerPro targets that market.

---

## 2. Executive summary — the headline gaps

LedgerPro is **ahead** on customer-facing commerce (storefront, loyalty, PayHere, pickup orders), real-time, and true multi-branch. It is **behind** on the classic "back-office ERP" spine:

**Tier 1 — entire modules absent in LedgerPro:**
1. **Production / Manufacturing** — batches, lot/expiry, production→inventory approval.
2. **Suppliers & Payables** — supplier master, supplier credit/payables ledger, supplier payments.
3. **Double-entry Accounting** — Chart of Accounts, Journal Entries, Fiscal Periods (LedgerPro's `accounting` is a flat ledger + expenses + P&L only).
4. **Banking** — bank-account master, cheque clearing workflow, reconciliation.

**Tier 2 — partial within an existing module:**
5. **Inventory:** product/batch **expiry tracking**, first-class **stock-adjustment workflow** (reason codes + approval), first-class **returns management** (invoice lookup, good/bad split, restock).
6. **Reporting:** a unified **Reports Hub** + **PDF/Excel export** (LedgerPro has dashboards + CSV only).
7. **HR/Payroll:** **advance salary/loans**, **EPF/ETF statutory** fields & employer contributions, **payslip generation + email-to-bank**.
8. **Accounting:** dedicated **Income** tracking, **Balance Sheet**, posted-entry **correction workflow**.

**Tier 3 — cross-cutting / market-specific:**
9. **i18n** (Sinhala/Tamil) · 10. **Granular module-level RBAC** + brute-force lockout · 11. **B2B customer master** (credit limits, terms, retail/wholesale pricing tiers) · 12. Intra-branch **stock locations** (warehouse vs shop floor) & **reserved stock**.

---

## 3. Domain-by-domain gap table

| # | Domain | Shanel_ERP | LedgerPro today | Gap |
|---|--------|-----------|-----------------|-----|
| 1 | **Production** | Batches, lot#, status workflow, expiry, production→inventory approval, production reports | _none_ | **Full module missing** |
| 2 | **Suppliers / Payables** | Supplier master (credit limit, terms, tax ID, bank), payables ledger, supplier payments (cheque) | _none_ | **Full module missing** |
| 3 | **Accounting — GL** | Chart of Accounts (typed, hierarchical), Journal Entries (Dr=Cr posting), Fiscal Periods (open/closed/locked) | Flat `ledger_entries`, expenses, P&L | **Major — no COA/journals/periods** |
| 4 | **Banking** | Bank/branch master, accounts, transactions, cheque clearing (Pending/Cleared/Bounced), reconciliation | Cheque _fields_ on Payment only | **Major — no bank master/recon** |
| 5 | **Inventory — expiry** | Expiry on batches, expiry report, expiry alerts (≤7d critical / ≤30d warn) | _no expiry anywhere_ | **Missing** |
| 6 | **Inventory — adjustments** | Dedicated page: reason codes (Damage/Expired/Theft/Stock-Take), edit/reverse | "Adjustment" movement type only, no workflow/UI | **Partial — no workflow/UI** |
| 7 | **Inventory — returns** | Dedicated page: invoice lookup, good/bad split, restock decision | "Return" movement type only, no workflow/UI | **Partial — no workflow/UI** |
| 8 | **Reporting** | Reports Hub (6 inventory + sales + finance), **PDF/Excel export** | Scattered dashboards, **CSV only** | **Partial — no hub/exports** |
| 9 | **HR — advances** | Advance salary + repayment schedule | _none_ | **Missing** |
| 10 | **HR — statutory** | EPF/ETF numbers + employer contributions, payslip email-to-bank | Payroll deductions exist; no EPF/ETF/payslip | **Partial** |
| 11 | **Accounting — income** | Dedicated Income module, Balance Sheet, correction workflow | _none_ (only expenses + P&L) | **Partial** |
| 12 | **RBAC** | Per-module permissions (`Module`+`UserModuleAccess`), 6 staff roles, lockout | 4 fixed roles, no granular perms/lockout | **Partial** |
| 13 | **Customers (B2B)** | Customer master: credit limit, terms, tax ID, retail/wholesale tier, buying-pattern analytics | Customers = Users + credit ledger + loyalty | **Partial** |
| 14 | **i18n** | EN + SI + TA (i18next), bilingual product names | English only | **Missing** |
| 15 | **Stock locations** | Sub-branch buckets (Shop/Production/Warehouse) + reserved stock | Branch-level only | **Minor** |

---

## 4. Where LedgerPro is already AHEAD (do not rebuild)

A balanced view — LedgerPro has built things Shanel lacks. Keep these as differentiators:

- **Customer storefront / e-commerce** — catalog, cart, checkout, order confirmation, my-orders (Shanel has no storefront).
- **Loyalty program** — full points/ledger/settings/redemption (Shanel only has a `loyalty_points` column).
- **Online payments** — PayHere gateway + redirect/webhook flow + pickup-order fulfillment.
- **Real-time** — WebSocket notifications gateway + Postgres-persisted notifications.
- **Branch analytics & comparison** — the module just shipped on this branch.
- **Engineering hardening** — idempotency keys on checkout, per-branch invoice counters with pessimistic locking, Cloudinary image hosting, strict repository pattern.
- **True multi-branch** — branch-scoped data + cross-branch admin (Shanel is single-org, multi-_location_).

---

## 5. Proposed roadmap (for your review — not yet started)

Sequenced by value × dependency, mapped onto LedgerPro's NestJS module/repository pattern. Each is one architectural change (≈ one PR set), consistent with `rules.md`.

### Phase A — Accounting spine (unlocks suppliers, banking, real books)
- **A1. Chart of Accounts** — new entities in `backend/src/modules/accounting/`: `account` (code, type Asset/Liability/Equity/Revenue/Expense, parent_id, active). Repository + service + controller via `APP_ROUTES`. Frontend: `pages/accounting/ChartOfAccountsPage.tsx`, account-ledger page.
- **A2. Journal Entries** — `journal-entry` + `journal-entry-line` entities with Dr=Cr validation, status Draft→Posted→Cancelled, source-doc reference. Auto-post hooks from POS sale / expense. _Reuses_ existing `ledger-entry.entity.ts` as the posting target or supersedes it (decide migration path).
- **A3. Fiscal Periods** — `fiscal-period` entity (open/closed/locked), guard posting against locked periods.
- **A4. Income + Balance Sheet + P&L-from-GL** — extend reporting off the new GL.

### Phase B — Suppliers & Payables (depends on A)
- **B1.** New `suppliers` module: supplier master (credit limit, terms, tax ID, bank, status), supplier payables ledger (mirror of existing `credit-transaction.entity.ts` pattern), supplier payments (cash/cheque/bank) posting to A2.
- **B2.** (Optional) lightweight purchase recording (supplier bill) — skip a full PO engine; Shanel doesn't have one either.

### Phase C — Inventory depth (independent, high retail value)
- **C1. Expiry/batch** — add `expiryDate` + optional `batchNo` to `products`/`inventory`; expiry report + alerts (reuse low-stock alert plumbing).
- **C2. Stock Adjustment workflow** — `stock-adjustment` entity with reason codes + optional approval; UI page. _Reuses_ existing `stock-movement` ledger (movementType "Adjustment").
- **C3. Returns Management** — `sales-return` entity (invoice lookup, good/bad split, restock flag); UI page. _Reuses_ "Return" movement type + voids plumbing in `pos`.

### Phase D — Banking (depends on A)
- New `banking` module: bank-account master, bank transactions, **cheque clearing workflow** (wire to existing cheque fields on `payment.entity.ts`), reconciliation screen.

### Phase E — Reporting Hub + exports (cross-cutting)
- `pages/reports/` hub that aggregates existing + new reports; add a **PDF/Excel export util** (e.g. `exceljs` + a PDF lib) reused across pages. _Reuses_ existing CSV export in transactions.

### Phase F — HR & RBAC top-ups
- **F1.** HR: advance-salary + repayment schedule, EPF/ETF fields + employer contribution in `payroll-math.ts`, payslip PDF + email (reuse `email` module).
- **F2.** RBAC: granular `permission`/`module-access` layer over the 4 roles + login-attempt lockout in `auth`.

### Phase G — i18n (only if SL market is in scope)
- Add i18next to the frontend, extract strings, ship EN/SI/TA locale files; optional bilingual product-name field.

**Suggested first slice:** Phase **C1–C3** (expiry + adjustments + returns) — highest retail value, lowest risk, no accounting dependency, and it reuses the `stock-movement` ledger LedgerPro already has. Then Phase **A** to unlock the back-office spine.

---

## 6. Open questions for you (drive scope)

1. **Market:** Is LedgerPro targeting the Sri-Lankan domestic market (→ EPF/ETF, Sinhala/Tamil, LKR matter) or general retail (→ deprioritize i18n & statutory)?
2. **Accounting ambition:** Do you want true **double-entry books** (Phase A), or is the current ledger + P&L "good enough" for your users?
3. **Production:** Does LedgerPro's domain (supermarket retail) actually need **manufacturing/production**, or is that Shanel-specific and safe to skip?
4. **First slice:** Confirm whether to start with **Inventory depth (C)** or the **Accounting spine (A)**.
