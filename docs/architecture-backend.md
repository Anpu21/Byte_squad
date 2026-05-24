# Backend architecture

> Loaded on demand from [`CLAUDE.md`](../CLAUDE.md).

**Module-per-domain** under `backend/src/modules/`: `auth`, `users`, `branches`, `products`, `inventory`, `pos`, `accounting`, `customer-requests`, `stock-transfers`, `notifications`, `admin-portal`, `shop`, `email`. Cross-cutting code lives in `backend/src/common/`. Full tree in [`folder-structure.md`](./folder-structure.md).

**Repository Pattern.** Three layers per Rules.md §7: a separate `*.repository.ts` class owns all TypeORM calls, the service uses the repository (no TypeORM imports), and the controller is thin.

- **Migrated** (have a `.repository.ts`): `accounting`, `branches`, `customer-requests`, `inventory`, `notifications`, `pos`, `products`, `stock-transfers`, `users`.
- **No repository** (composes other modules / no DB access): `admin-portal` (read-only aggregates), `auth` (uses `users` repo), `email` (no DB), `shop` (composes `products` + `inventory` + `branches`).

**New modules MUST follow the Repository Pattern.** Service files must not contain `@InjectRepository` or any TypeORM symbol.

**Per-module types live in `<module>/types/`** with one interface per `<name>.type.ts` file plus a barrel `index.ts`. Service / controller / repository files import from the barrel, e.g. `import type { ListExpenseOptions } from './types';`. See [`folder-structure.md`](./folder-structure.md) for the full convention.

**Auth & RBAC.** JWT strategy at `common/decorators/current-user.decorator.ts` extracts `{ id, email, role, branchId }`. Two guards always go together: `@UseGuards(JwtAuthGuard, RolesGuard)` plus `@Roles(UserRole.X, ...)`. The `@CurrentUser()` decorator pulls the validated user — use it inside handlers instead of reading `req.user` directly. **Branch-scoped endpoints filter by `actor.branchId`** for non-admins; if a manager has `branchId === null` the filter must short-circuit (else SQL `branch_id = NULL` silently returns zero rows). See `customer-requests.service.ts:listForStaff` for the canonical pattern.

**Response shape.** Every controller's return value is wrapped by the global `TransformInterceptor` (`common/interceptors/transform.interceptor.ts`) into `{ success: true, data, message: 'Success' }`. Frontend services unwrap `response.data.data`. There is no DTO/serializer layer — entities are returned directly, so any new column on an entity is automatically exposed. Don't add a sensitive field without intentionally redacting it (see `User.passwordHash` stripping in `UsersService`).

**Routes.** All paths centralised in `common/routes/app.routes.ts` under `/api/v1` prefix. Don't hand-write paths in controllers — pull from `APP_ROUTES`.

**TypeORM schema sync.** `DB_SYNC=true` in dev autocreates columns from `@Column` decorators on app boot. Production must keep `DB_SYNC=false` and apply ALTER TABLE manually (no migration folder is checked in). When you add a column to an entity, document the prod ALTER in your PR.

**Cloudinary** (`common/cloudinary/cloudinary.service.ts`) is `@Global()`. Inject `CloudinaryService` directly anywhere; no module import needed. `uploadImage(file, opts)` takes a Multer file; `uploadBuffer(buffer, opts)` takes a raw Buffer (used for backend-generated QR PNGs in `customer-requests.service`). Service falls back gracefully when env vars missing — wrap calls in try/catch so absent Cloudinary doesn't break the parent flow.

**Real-time.** `notifications.gateway.ts` exposes `broadcast(event, payload)` and `sendToUser(userId, payload)` on the `/notifications` socket.io namespace. Customer-request creation emits `customer-request:created` so manager dashboards refetch live. Notifications are also persisted in Postgres for offline replay.

**Seeding.** `common/seeds/admin-seed.service.ts` runs on `OnModuleInit`. It is idempotent — checks-by-name before inserts. Re-running is safe; reset by dropping the postgres volume.

---

## POS (cashier checkout)

The `pos` module owns the cashier checkout flow, multi-tender payments, customer credit (AR), stock-movement audit log, and idempotent sale creation. Ported from the Shanel ERP reference UI in the May 2026 implementation plan (`docs/superpowers/plans/2026-05-23-cashier-pos-shanel-port.md`).

> **Prior planning artifacts.** Nine `pos-*.plan.md` files on the `feat/suppliers-master` branch (and on the working checkout outside this worktree) are superseded by the dated plan above. They are not present on this branch — no archive copy is checked in.

### Entities

The legacy `Transaction` / `TransactionItem` pair was replaced by a wider Shanel-shaped model. Renames + additions are tracked in the migration log and applied via `DB_SYNC=true` in dev.

| Entity | Purpose |
|---|---|
| `Sale` | One row per checkout. Carries totals, discount, tax, change, status, voided audit fields, and a unique server-generated invoice number. Renamed from `Transaction`. |
| `SaleItem` | One row per cart line. Carries productId, sellable-unit name, qty, base-qty, unit price, line discount, line total. Renamed from `TransactionItem`. |
| `Payment` | One row per `Sale`. Multi-tender split across `cashAmount`, `chequeAmount`, `bankTransferAmount`, `creditAmount`, plus `tenderedTotal`, `changeAmount`, `keepBalance` (overpayment-to-credit toggle), and cheque/bank-transfer metadata columns. |
| `CreditTransaction` | Customer AR ledger. Charge rows on `credit > 0` sales, settlement rows on credit-method payments, refund rows on void. Updates `User.currentBalance` atomically. |
| `StockMovement` | Audit log row per cart line on `Sale_Created` and `Sale_Voided` (sign-flipped). Plus rows the inventory module emits for transfers, manual adjustments, etc. |
| `IdempotencyKey` | `pos_idempotency_keys` table, uniqueness `(cashierId, key)`. Replay returns the stored saleId; conflict on different payload returns 409. |
| `InvoiceCounter` | Per-branch monotonic counter for server-generated invoice numbers (`INV-{branchCode}-{seq}`). Atomic increment in the same transaction as the sale write. |

### Endpoints (all under `APP_ROUTES.POS.*`)

Read:
- `GET /pos/products/search?q=` — typeahead by name / barcode / SKU.
- `GET /pos/products/:id/units` — sellable units (e.g. `KG`, `100G`, `500G`) with their base-unit conversion factor.
- `GET /pos/products/:id/units/:unit/base-qty` — convert a chosen unit + qty back to base-unit qty for the cart line.
- `GET /pos/products/:id/inventory` — current branch on-hand for the active cashier's branch.
- `GET /pos/recent-sales?limit=` — sidebar feed for the recent-sales card.
- `GET /pos/invoice-number` — preview / reserve the next invoice number for the active branch.
- `GET /pos/customers/search?q=` — customer picker typeahead.

Write:
- `POST /pos/sales` — multi-tender checkout. Body: items + payments + customerId (optional) + `keepBalance` + idempotency key (header `X-Idempotency-Key`). Validates stock atomically, debits inventory, writes a `Payment` row, records the `Sale`, emits `StockMovement` rows, and (when `credit > 0` or `keepBalance`) writes a `CreditTransaction` and updates `User.currentBalance`.
- `PATCH /pos/sales/:id/print` — flips the `printedAt` timestamp; idempotent reprints permitted.
- `POST /pos/sales/:id/void` — soft-void. Refunds the customer's credit ledger if applicable, re-credits inventory, writes sign-flipped `StockMovement` rows, sets `voidedAt` / `voidReason` / `voidedById`. Once printed, voiding requires manager role.

The legacy dashboard endpoints (`/pos/transactions`, `/pos/my-dashboard`, `/pos/admin-dashboard`, etc.) remain in place — they read from `Sale` / `SaleItem` and continue to back the cashier-history dashboards.

### Repository pattern

All POS data access lives in dedicated repositories (Rules.md §7): `pos.repository.ts`, `sale.repository.ts`, `sale-item.repository.ts`, `payment.repository.ts`, `credit-transaction.repository.ts`, `stock-movement.repository.ts`. Each uses `DataSource` injection — no `@InjectRepository` calls in service files.

### Multi-tender model

One `Payment` row per `Sale` splits the bill across cash + cheque + bank transfer + credit. `MultiTenderCalculatorService` (`modules/pos/services/multi-tender-calculator.service.ts`) computes the tendered total, change, and `keepBalance` overpayment. Cheques/bank transfers carry reference + bank metadata columns. Credit settlements draw from `User.currentBalance` and create matching `CreditTransaction` rows.

### Customer credit (AR)

Customer accounts (`role=CUSTOMER`) carry a `currentBalance` column. Every credit movement is journaled as a `CreditTransaction` (charge / settlement / refund), keeping the ledger reconcilable against the running balance.

### Stock-movement audit log

Every cart line emits a `StockMovement` row on sale creation and a sign-flipped row on void. Inventory adjustments, transfers, and manual edits write to the same table, giving a single audit log per product per branch.

### Idempotency

`POST /pos/sales` requires an `X-Idempotency-Key` header. The key is stored in `pos_idempotency_keys` with the cashierId; replays return the original `saleId`. Payload-mismatch replays return 409.

---

## Stock-transfer state machine

Pessimistic-locked, transactional, audit-tracked. Manager creates → Admin approves/rejects → source Manager ships (decrements stock) → destination Manager receives (increments stock) → COMPLETED. Admin can cancel pre-ship. Every state change emits a notification to the relevant party.
