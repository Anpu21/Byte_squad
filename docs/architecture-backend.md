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

## Stock-transfer state machine

Pessimistic-locked, transactional, audit-tracked. Manager creates → Admin approves/rejects → source Manager ships (decrements stock) → destination Manager receives (increments stock) → COMPLETED. Admin can cancel pre-ship. Every state change emits a notification to the relevant party.
