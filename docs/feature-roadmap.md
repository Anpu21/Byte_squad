# LedgerPro — Feature Roadmap

> Derived from a gap analysis against [OpenSourcePOS (OSPOS)](https://github.com/opensourcepos/opensourcepos), a mature web-based POS. **Tax functionality is excluded by request.** Restaurant tables are excluded as not applicable to a supermarket.

This document is a **prioritized menu** of functionality worth adding to LedgerPro. Each item lists what it is, the current gap (with code evidence), what it builds on, and a "Done when" acceptance line so it's ready to pick up and build. Supermarket floor-ops are ranked highest.

**Legend** — Effort: **S** ≈ 1–2 days · **M** ≈ 3–5 days · **L** ≈ 1–2 weeks. Status: **Absent** (nothing exists) · **Partial** (groundwork or client-only code exists).

---

## Table of contents

- [Summary table](#summary-table)
- [How LedgerPro already compares to OSPOS](#how-ledgerpro-already-compares-to-ospos)
- [Tier 1 — Supermarket floor ops](#tier-1--supermarket-floor-ops)
- [Tier 2 — Inventory & back-office ops](#tier-2--inventory--back-office-ops)
- [Tier 3 — Storefront & customer growth](#tier-3--storefront--customer-growth)
- [Tier 4 — Compliance & hardening](#tier-4--compliance--hardening)
- [Quick wins](#quick-wins)
- [Suggested build sequence](#suggested-build-sequence)
- [Validation conventions](#validation-conventions)

---

## Summary table

| # | Feature | Tier | Status | Effort |
|---|---------|------|--------|--------|
| 1 | PLU / weigh-by-weight items | Floor ops | Partial | M |
| 2 | Shelf-label, price-tag & batch-label printing | Floor ops | Partial | S |
| 3 | Server-persisted held / suspended sales | Floor ops | Partial | M |
| 4 | Discrete cash-drawer movements | Floor ops | Partial | S–M |
| 5 | Receipt templates (PDF / email / thermal) | Floor ops | Partial | M |
| 6 | Automatic reorder suggestions → draft PO | Inventory ops | Partial | M |
| 7 | Item kits / bundles / combos | Inventory ops | Absent | M |
| 8 | Accounts-receivable ageing & statements | Inventory ops | Partial | M |
| 9 | Gift cards / vouchers | Storefront | Absent | L |
| 10 | SMS notifications | Storefront | Absent | M |
| 11 | Product reviews & ratings | Storefront | Absent | M |
| 12 | Email marketing campaigns | Storefront | Partial | M–L |
| 13 | Customer groups / segmentation | Storefront | Absent | M |
| 14 | Login security (CAPTCHA / lockout / 2FA) | Hardening | Partial | S–M |
| 15 | Per-cashier sales commission | Hardening | Absent | M |
| 16 | GDPR self-service (export & erasure) | Hardening | Absent | M |
| 17 | Quotations / estimates (B2B) | Hardening | Absent | M |

---

## How LedgerPro already compares to OSPOS

LedgerPro already **meets or exceeds** OSPOS on most of its headline features — so this roadmap is a curated list of genuine gaps plus supermarket essentials OSPOS itself lacks, **not** an OSPOS feature dump.

**Already covered — do not rebuild:**

| OSPOS feature | LedgerPro |
|---|---|
| Sale register + transaction logging | `pos/` + `audit/` |
| Cash-up / shift reconciliation (Z-report, over/short) | `pos/entities/pos-shift.entity.ts`, `shifts.service.ts` |
| Multi-tender / split payment | `payment.entity.ts` (cash/cheque/bank/credit/loyalty) + `multi-tender-calculator.service.ts` |
| Returns / refunds | `inventory/returns.service.ts` (restock + ledger reversal) |
| Discounts & promotions | `pos/discount-schemes.*` (date-windowed, qty-slab, product/category) |
| Receivings (PO → GRN) + supplier returns | `purchases/` (PurchaseOrder, Grn, PurchaseReturn) |
| Expenses logging | `accounting/entities/expense.entity.ts` (with approval workflow) |
| Rewards / loyalty | `loyalty/` (tiers, ledger, wallet — richer than OSPOS) |
| Customers & suppliers | `users/`, `suppliers/` |
| Multi-user permission control | RBAC: Admin / Manager / Cashier / Customer |
| Reporting | `branch-analytics/` + `accounting/FinancialReportsService` (trial balance, balance sheet, P&L, day book, AP ageing) |
| Selectable UI theme | Ledger UI Kit design system |

**Beyond OSPOS — LedgerPro already wins here:** double-entry accounting, inter-branch stock transfers with courier tracking, batch/lot + expiry tracking with severity alerts, stock adjustments with approval & reversal, idempotent (offline-safe) checkout, HR/payroll, and a customer storefront with pickup orders.

---

## Tier 1 — Supermarket floor ops

The in-store essentials a supermarket POS is expected to have. **Build these next.**

### 1. PLU / weigh-by-weight items
`Floor ops` · `Partial` · `M`

- **What:** variable-weight produce/deli priced per kg, entered by manual weight or scale barcode (embedded-weight EAN-13 `2xxxxx`).
- **Gap:** groundwork exists — `kg`/`l` base units (`products/lib/supported-base-units.ts`) and `pos-write.service.ts → computeItem` already accept fractional quantities. Missing: a "sold by weight" flag, a PLU code, and embedded-weight barcode parsing.
- **Builds on:** add `isSoldByWeight` + `pluCode` to `products/entities/product.entity.ts` (and their DTOs); a new `products/lib/parse-embedded-weight.ts` helper wired into `/products/by-barcode` and `frontend/src/features/pos/hooks/usePosBarcodeScan.ts`.
- **Done when:** scanning a `2xxxxx` scale barcode auto-fills the embedded weight and prices per kg; manual weight entry works; reports total kg sensibly.
- **Why #1:** a supermarket POS without weighed produce is a core hole — the biggest product-completeness gap.

### 2. Shelf-label, price-tag & batch-label printing
`Floor ops` · `Partial` · `S`

- **What:** batch-print barcode/price labels and shelf-edge talkers for a whole category or a just-received GRN.
- **Gap:** a client-side label engine already exists (`frontend/src/features/labels/` — `lib/code128.ts` Code128 SVG, `lib/label-sheet-html.ts`, `hooks/usePrintLabelSheet.ts` isolated-iframe print, `components/LabelPrintPanel.tsx`). Missing: category/GRN batch selection, a shelf-edge layout, and a price/kg variant for weighed items.
- **Builds on:** extend `features/labels/lib/label-sheet-html.ts` + `LabelPrintPanel.tsx`; add a "Print labels" action to `features/purchases/components/grns/GrnDetailModal.tsx`. No backend required.
- **Done when:** selecting a category or a received GRN prints a correct barcode/price sheet and a shelf-edge variant; weighed items show price/kg + PLU.
- **Why high:** near-free quick win that turns receiving into shelf-ready stock; pairs with #1.

### 3. Server-persisted held / suspended sales
`Floor ops` · `Partial` · `M` (S if kept terminal-local)

- **What:** park an in-progress cart and recall it on any terminal; supervisor-visible.
- **Gap:** held bills already work client-side via localStorage (`features/pos/hooks/usePosHeldBills.ts`, `components/held-bills/PosHeldBillsModal.tsx`, `types/held-bill.type.ts`) but never reach the server — no cross-terminal recall.
- **Builds on:** a lightweight `held_sale` entity (cart snapshot in `jsonb`, **no** inventory/ledger FKs — a held cart must not decrement stock); swap the localStorage hook for an API + TanStack Query. **Avoid** adding a `Held` value to `SaleStatus` (`pos/types/sale-status.type.ts`) — high blast radius across reports and the ledger.
- **Done when:** a cart parked on terminal A can be recalled and completed on terminal B; held carts never touch stock or the ledger until checkout.

### 4. Discrete cash-drawer movements
`Floor ops` · `Partial` · `S–M`

- **What:** log mid-shift cash-in / cash-out / paid-out / petty-cash drops, not just opening float and closing count.
- **Gap:** `PosShift` tracks `openingFloat`, `countedCash`, `expectedCash`, `overShort` — but there are no intermediate movements, so variance can't be explained.
- **Builds on:** a `cash_movement` entity linked to `PosShift`; fold totals into the existing close / over-short calculation in `pos/shifts.service.ts`.
- **Done when:** recording a mid-shift paid-out appears in the shift close and adjusts expected cash / over-short.

### 5. Receipt templates (PDF / email / thermal)
`Floor ops` · `Partial` · `M`

- **What:** render an actual receipt — 80mm thermal layout, emailed PDF copy, reprint.
- **Gap:** only print *metadata* is tracked (`Sale.billPrinted`, `billPrintCount`, `firstPrintDate`, `lastPrintDate`). No template, no email delivery.
- **Builds on:** a receipt template + the existing `email/` module (Resend) for the emailed copy; reuse the `markSalePrinted` flow. `jspdf` is already available client-side.
- **Done when:** completing a sale renders an 80mm receipt and emails a PDF copy; reprint increments the existing print counter.

---

## Tier 2 — Inventory & back-office ops

### 6. Automatic reorder suggestions → draft PO
`Inventory ops` · `Partial` · `M`

- **What:** an on-demand "suggested purchase order" report that turns low stock + sales velocity into a pre-filled Draft PO per supplier.
- **Gap:** `Inventory.lowStockThreshold` + `isLowStock()` exist, but nothing acts on them.
- **Builds on:** `suggestedQty = velocity × leadDays + safety − onHand − onOrder`; velocity from `pos/stock-movement.repository.ts`; supplier inferred from the last GRN; reuse `PurchaseOrdersService.create` to draft. On-demand (no scheduler in the stack — mirror the existing expiry-scan endpoint).
- **Done when:** opening the report lists per-supplier suggestions and "Create Draft PO(s)" produces editable Draft purchase orders.

### 7. Item kits / bundles / combos
`Inventory ops` · `Absent` · `M`

- **What:** sell several products as one SKU (gift hamper, combo deal, meal pack).
- **Builds on:** a `product_kit` + `kit_component` model; `pos-write.service.ts` explodes a kit line into component stock decrements at checkout.
- **Done when:** selling a kit decrements each component's stock and prices the bundle correctly.

### 8. Accounts-receivable ageing & statements
`Inventory ops` · `Partial` · `M`

- **What:** outstanding-balance ageing, customer statements, and dunning reminders for "on account" customers.
- **Gap:** store-credit fields exist (`users` → `currentBalance`, `creditLimit`) and AP ageing exists (`PayablesReportsRepository`) — but there is no AR side.
- **Builds on:** mirror the payables report for receivables; pairs naturally with store-credit checkout.
- **Done when:** an ageing report buckets customer balances and a per-customer statement can be generated.

---

## Tier 3 — Storefront & customer growth

### 9. Gift cards / vouchers
`Storefront` · `Absent` · `L`

- **What:** sell a gift card as a POS line; redeem its balance as a tender later.
- **Builds on:** a `gift_card` + `gift_card_ledger_entry` (clone the loyalty-ledger pattern in `loyalty/entities/loyalty-ledger-entry.entity.ts` + `loyalty-wallet.service.ts`); add `giftCardAmount` to `payment.entity.ts` and extend `multi-tender-calculator.service.ts` (the same seam loyalty uses).
- **Accounting nuance:** issuance is a **deferred-revenue liability**, not a sale — post via `JournalVoucher`, not as P&L revenue; redemption moves liability → revenue.
- **Done when:** a gift card can be issued at the till, looked up by code, and partially redeemed as a tender, with correct liability accounting.
- **Note:** heaviest item and the only one that mutates the shared `Payment` / multi-tender seam — schedule last in any storefront push.

### 10. SMS notifications
`Storefront` · `Absent` · `M`

- **What:** transactional SMS — "order ready for pickup", OTP.
- **Gap:** none today; a big miss for a pickup-order platform (customers must check the app).
- **Builds on:** an `sms/` module mirroring `email/`, with a provider-agnostic interface (Twilio / Vonage / local-LK swappable) and a `log` provider for dev; hook into `customer-orders.service.ts` lifecycle. Localize en/`ta` from `User.language`.
- **Done when:** marking an order ready sends a localized SMS to the customer; sends are best-effort and never block checkout.

### 11. Product reviews & ratings
`Storefront` · `Absent` · `M`

- **What:** customers rate and review products on the storefront.
- **Builds on:** a `product_review` entity with a verified-purchase flag derived from `customer-orders`; surface aggregate rating on `shop/` product pages.
- **Done when:** a customer who bought an item can leave a star rating + review, and the product page shows the aggregate.

### 12. Email marketing campaigns
`Storefront` · `Partial` · `M–L`

- **What:** newsletters, promo blasts, abandoned-cart / win-back emails.
- **Gap:** `email/` is transactional only (welcome / OTP / reset).
- **Builds on:** a campaign + audience model on top of `email/`; optionally an external ESP integration. Best paired with #13.
- **Done when:** a campaign can target an audience and send/schedule a templated email blast with basic delivery stats.

### 13. Customer groups / segmentation
`Storefront` · `Absent` · `M`

- **What:** group customers (e.g. wholesale, VIP, lapsed) for targeted pricing or marketing.
- **Builds on:** a `customer_group` tag on `users`; consumed by marketing (#12) and later by group pricing — wholesale/retail price levels already exist (`pos/types/price-level.type.ts`).
- **Done when:** customers can be assigned to a group and a group can be used as a marketing audience.

---

## Tier 4 — Compliance & hardening

### 14. Login security (CAPTCHA / lockout / 2FA)
`Hardening` · `Partial` · `S–M`

- **What:** CAPTCHA on login, account lockout after N failures, optional 2FA for Admin/Manager.
- **Gap:** only IP rate-limiting today (`@Throttle` on `auth.controller.ts`).
- **Builds on:** add CAPTCHA verification + a failed-attempt counter to the auth flow; TOTP 2FA for privileged roles.
- **Done when:** repeated failed logins trigger CAPTCHA/lockout, and privileged users can enable 2FA.

### 15. Per-cashier sales commission
`Hardening` · `Absent` · `M`

- **What:** track and pay commission/incentive per cashier on sales.
- **Gap:** HR has payroll + attendance bonuses but no sales-based incentive.
- **Builds on:** aggregate per-cashier sales (`Sale.cashierId`) into an `hr/` commission rule feeding payroll.
- **Done when:** a commission rule produces a per-cashier payout that flows into payroll.

### 16. GDPR self-service (export & erasure)
`Hardening` · `Absent` · `M`

- **What:** customer data export, right-to-erasure request workflow, and consent tracking.
- **Gap:** none today, though `audit/` is already privacy-conscious (stores no request bodies).
- **Builds on:** a data-export aggregator across customer-owned tables + an erasure/anonymization request flow.
- **Done when:** a customer can request a data export and an erasure that anonymizes their PII while preserving financial records.

### 17. Quotations / estimates (B2B)
`Hardening` · `Absent` · `M`

- **What:** a non-committal quote that converts to a sale — useful for wholesale buyers.
- **Builds on:** pairs with the existing wholesale price level; convert an accepted quote into a standard sale.
- **Done when:** a quote can be created, sent, and converted to a committed sale. *Lowest rank — least fit for supermarket retail.*

---

## Quick wins

Low effort, high visibility — good first pickups:

- **#2 Shelf/price-tag printing** (S) — extends an existing client feature; instant supermarket value.
- **#4 Cash-drawer movements** (S–M) — closes a real reconciliation gap cheaply.
- **#14 Login hardening — CAPTCHA + lockout** (S) — meaningful security for little code.

## Suggested build sequence

Floor-ops first, smallest-isolated where possible:

```
#2 labels → #1 PLU/weigh → #4 cash movements → #3 held sales → #5 receipts → #6 reorder
```

- Land the `isSoldByWeight` / `pluCode` product fields (**#1**) **before** the weighed-label variant (**#2** extension).
- Save **#9 gift cards** for last in any storefront push — it's the only item that mutates the shared `Payment` / multi-tender seam and carries deferred-revenue accounting.

## Validation conventions

Per repo conventions, each feature is verified by:

- **Backend:** `docker exec ledgerpro-backend` for `tsc` / `jest` / build / boot, plus a route-diff and `docker restart` gate.
- **Frontend:** exercise the POS or storefront UI directly (Vite dev server; on WSL2, `docker restart ledgerpro-frontend` + hard refresh if HMR goes stale).
- New backend modules follow the **Repository Pattern** (repository ↔ service ↔ controller, no `@InjectRepository` in new service files); routes go through `APP_ROUTES` / `FRONTEND_ROUTES`; schema changes ship as migrations.
