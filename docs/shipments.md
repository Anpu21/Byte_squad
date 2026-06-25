# Shipments — courier delivery tracking

> Inter-branch parcel delivery on top of stock transfers, with an AliExpress-style tracking timeline.
> This document explains what a Shipment is, its data model and lifecycle, the API/UI surface, and the
> **demo seed** that pre-populates the feature on a fresh database.

Module: `backend/src/modules/stock-transfers/` · Frontend: `frontend/src/pages/transfers/`,
`frontend/src/features/shipment-tracking/` · Seed: `backend/src/common/seeds/admin-seed.service.ts`
(`ensureShipments`) + `shipment-seed-timeline.ts`.

---

## 1. What is a Shipment?

A **Shipment** is a courier-driven parcel that groups one or more **approved stock-transfer lines**
travelling together from **one source branch** to **one destination branch**.

It sits on top of the existing transfer model:

- The **request/approval** stage lives on `StockTransferRequest` (its own `TransferStatus`: a manager
  requests stock, an admin/manager approves it with a source branch + approved quantity).
- The **delivery** stage lives on `Shipment` (its own `ShipmentStatus`). Approved lines are bundled into a
  shipment, a courier carries it, and the parcel moves through a delivery lifecycle.

Lines are grouped by `(sourceBranchId, destinationBranchId)`. A single request batch whose lines were
approved from different sources therefore **splits into one shipment per source**; the originating
`batchId` is carried on the shipment only for provenance.

**Two-beat stock movement** (mirrors the transfer model):

- Stock is **debited from the source** when the shipment is `DISPATCHED`.
- Stock is **credited to the destination** when the shipment is `DELIVERED`.
- The window between is a real in-transit limbo. `RETURNED` re-credits the source; `CANCELLED` (only
  reachable pre-dispatch) never moved any stock.

---

## 2. Data model

### `shipments` — `Shipment` entity
`backend/src/modules/stock-transfers/entities/shipment.entity.ts`

| Field | Column | Notes |
|---|---|---|
| `id` | `id` (uuid) | PK |
| `trackingRef` | `tracking_ref` (varchar, **unique**) | Human-friendly code, e.g. `SHP-A1B2C3D4` |
| `batchId` | `batch_id` (uuid, null) | Provenance link to the originating request batch |
| `sourceBranchId` | `source_branch_id` | FK → `branches` |
| `destinationBranchId` | `destination_branch_id` | FK → `branches` |
| `status` | `status` (varchar) | `ShipmentStatus`, default `PENDING` |
| `courierEmployeeId` | `courier_employee_id` (uuid, null) | FK → `employees` (a WORKER's HR row); null until assigned |
| `eta` | `eta` (timestamp, null) | Estimated delivery, set at dispatch |
| `createdByUserId` | `created_by_user_id` | FK → `users` |
| `dispatchedByUserId` / `dispatchedAt` | … | Set on dispatch |
| `deliveredByUserId` / `deliveredAt` | … | Set on delivery |
| `returnedByUserId` / `returnedAt` | … | Set on return |
| `cancelledByUserId` / `cancelledAt` | … | Set on cancel |
| `exceptionReason` | `exception_reason` (text, null) | Captured on a `RETURNED` / `CANCELLED` transition |
| `lines` | — | `OneToMany` → `StockTransferRequest.shipment` (the approved lines in the parcel) |
| `events` | — | `OneToMany` → `ShipmentEvent.shipment` (the tracking timeline) |

The link back from a line: `StockTransferRequest.shipmentId` (`shipment_id`) — set when an approved line is
bundled into a shipment.

### `shipment_events` — `ShipmentEvent` entity
`backend/src/modules/stock-transfers/entities/shipment-event.entity.ts`

An **append-only** entry on a shipment's tracking timeline — never updated or deleted. The ordered set IS
the delivery feed shown to the user.

| Field | Column | Notes |
|---|---|---|
| `id` | `id` (uuid) | PK |
| `shipmentId` | `shipment_id` | FK → `shipments` (CASCADE delete) |
| `type` | `type` (varchar) | `ShipmentEventType` |
| `location` | `location` (varchar, null) | Free-text waypoint, e.g. "Left Main Branch", "In transit" |
| `note` | `note` (text, null) | Optional courier note |
| `actorUserId` | `actor_user_id` (uuid, null) | Who triggered the event |
| `createdAt` | `created_at` | Orders the timeline |

---

## 3. Lifecycle (`ShipmentStatus`)

`backend/src/common/enums/shipment-status.enum.ts`

```
                ┌─────────┐  assign courier   ┌───────────────┐  dispatch   ┌────────────┐
                │ PENDING │ ────────────────▶ │ READY_TO_SHIP │ ──────────▶ │ DISPATCHED │
                └────┬────┘                   └───────┬───────┘             └─────┬──────┘
                     │ cancel                         │ cancel        checkpoint ⟲ │ (no status change)
                     ▼                                ▼                            │
                ┌───────────┐                   ┌───────────┐         mark out-for │
                │ CANCELLED │ ◀─────────────────┘           │         delivery     ▼
                └───────────┘   (pre-dispatch, no stock)               ┌──────────────────┐
                                                                       │ OUT_FOR_DELIVERY │
   stock: debit source @ DISPATCHED                                    └────────┬─────────┘
          credit destination @ DELIVERED                deliver ┌───────────────┤ deliver
          re-credit source @ RETURNED                          ▼                ▼
                                                        ┌───────────┐   ┌───────────┐
                                          return ──────▶│ RETURNED  │   │ DELIVERED │
                                          (post-dispatch)└──────────┘   └───────────┘
```

| Status | Meaning | Terminal? |
|---|---|---|
| `PENDING` | Formed from approved lines; courier not yet assigned / not sent | no |
| `READY_TO_SHIP` | Picked + packed, courier assigned, awaiting dispatch | no |
| `DISPATCHED` | Left the source — **source stock decremented**; in transit | no |
| `OUT_FOR_DELIVERY` | Arrived at the destination branch, awaiting check-in | no |
| `DELIVERED` | Received at destination — **destination stock credited** | **yes** |
| `CANCELLED` | Aborted before dispatch; no stock moved | **yes** |
| `RETURNED` | Aborted after dispatch; **source stock re-credited** | **yes** |

Terminal statuses are listed in `SHIPMENT_TERMINAL_STATUSES` and reject any further transition.

### Service transitions
`backend/src/modules/stock-transfers/shipments.service.ts`

| Method | Pre-condition | Effect | Event appended |
|---|---|---|---|
| `createFromLines` | lines are `APPROVED`, unassigned, have source + approved qty | creates the shipment (`READY_TO_SHIP` if a courier is given, else `PENDING`) | `CREATED` (+ `COURIER_ASSIGNED`) |
| `assignCourier` | not terminal | sets courier; `PENDING → READY_TO_SHIP` | `COURIER_ASSIGNED` |
| `dispatch` | `READY_TO_SHIP` | `→ DISPATCHED`; **debits source stock** | `DISPATCHED` |
| `addCheckpoint` | `DISPATCHED` | appends a waypoint, no status change | `CHECKPOINT` |
| `markOutForDelivery` | `DISPATCHED` | `→ OUT_FOR_DELIVERY` | `OUT_FOR_DELIVERY` |
| `deliver` | `DISPATCHED` / `OUT_FOR_DELIVERY` | `→ DELIVERED`; **credits destination stock** | `DELIVERED` |
| `returnShipment` | `DISPATCHED` / `OUT_FOR_DELIVERY` | `→ RETURNED`; **re-credits source stock** | `RETURNED` |
| `cancel` | pre-dispatch | `→ CANCELLED` | `CANCELLED` |

### Tracking event types (`ShipmentEventType`)
`CREATED`, `COURIER_ASSIGNED`, `READY_TO_SHIP`, `DISPATCHED`, `CHECKPOINT`, `OUT_FOR_DELIVERY`,
`DELIVERED`, `RETURNED`, `CANCELLED`. Most map 1:1 to a status transition; `CHECKPOINT` is the free-form
waypoint scan a courier can append while in transit.

---

## 4. Roles & visibility

| Role | Sees | Can do |
|---|---|---|
| **Admin** | All shipments, all branches | Everything |
| **Manager** | Shipments where their branch is source or destination | Create, assign, dispatch, deliver, return, cancel |
| **Worker** | Only shipments **they courier** (`shipments.service.list` filters by their `Employee` id) — the **"My deliveries"** view | Move their parcels along the lifecycle |

A worker with no linked `Employee` row sees an empty list (the list service returns empty rather than feed
a non-uuid into the courier filter).

---

## 5. API & UI surface

### REST (`/api/v1/shipments`)
`backend/src/modules/stock-transfers/shipments.controller.ts`

```
POST   /shipments                       create from approved line ids
GET    /shipments                       list (paged, role-scoped, status/branch filters)
GET    /shipments/:id                   detail + tracking timeline
PATCH  /shipments/:id/assign-courier
PATCH  /shipments/:id/dispatch
PATCH  /shipments/:id/checkpoint
PATCH  /shipments/:id/out-for-delivery
PATCH  /shipments/:id/deliver
PATCH  /shipments/:id/return
PATCH  /shipments/:id/cancel
```

### Frontend
| Route (`FRONTEND_ROUTES`) | Page |
|---|---|
| `/shipments` (`SHIPMENTS`) | `ShipmentsListPage` — KPI summary, status-filter chips, cards. Title flips to **"My deliveries"** for workers |
| `/shipments/new` (`SHIPMENT_NEW`) | `ShipmentCreatePage` — bundle approved lines into a shipment (admin/manager) |
| `/shipments/:id` (`SHIPMENT_DETAIL`) | `ShipmentDetailPage` — tracking timeline |

Feature code: `frontend/src/features/shipment-tracking/` (`useShipmentsQuery`, `ShipmentListCard`,
`ShipmentsSummary`, `shipment-format`). Live updates via `useStockTransferRealtime`.

---

## 6. The demo seed

### Why it exists
The supermarket seed already creates stock-transfer **requests** (`AdminSeedService.ensureStockTransfers`)
but historically wrote **no `Shipment` / `ShipmentEvent` rows**. On a fresh database that left the entire
shipments feature empty — the `/shipments` list, its KPI summary, every status-filter chip, the tracking
timeline, and the worker "My deliveries" view all showed nothing, so the feature couldn't be demoed or
QA'd at first login. `ensureShipments` fills that gap, following the same demo-seed philosophy already used
for `ensureStockTransfers`, `ensureStockAdjustments`, `ensureProductBatches`, and
`ensureBranchComparison*`.

### What it creates
`AdminSeedService.ensureShipments` (`backend/src/common/seeds/admin-seed.service.ts`) seeds **one shipment
per `ShipmentStatus` (7 total)** spread across the three branch pairs:

| Tracking ref | Status | Route (source → destination) | Product | Qty | Courier | Events |
|---|---|---|---|---|---|---|
| `SHP-DEMO-0001` | `PENDING` | Main → Downtown | Coca-Cola (BVG-001) | 40 | — | 1 |
| `SHP-DEMO-0002` | `READY_TO_SHIP` | Main → Suburban | White Bread (BKY-001) | 24 | Main worker | 3 |
| `SHP-DEMO-0003` | `DISPATCHED` | Downtown → Main | Whole Milk (DRY-001) | 60 | Downtown worker | 5 |
| `SHP-DEMO-0004` | `OUT_FOR_DELIVERY` | Suburban → Downtown | Plain Yogurt (DRY-003) | 18 | Suburban worker | 6 |
| `SHP-DEMO-0005` | `DELIVERED` | Main → Downtown | Potato Chips (SNK-001) | 30 | Main worker | 7 |
| `SHP-DEMO-0006` | `RETURNED` | Main → Suburban | Sugar (PNT-002) | 50 | Main worker | 6 |
| `SHP-DEMO-0007` | `CANCELLED` | Downtown → Suburban | Bottled Water (BVG-005) | 36 | — | 2 |

Each shipment gets:

- the **lifecycle fields its status implies** — courier (assigned for every status except `PENDING` and
  `CANCELLED`), `eta` (in-transit only), and the matching `dispatched/delivered/returned/cancelled`
  actor + timestamp, plus an `exceptionReason` on `RETURNED` / `CANCELLED`.
- **one linked transfer line** — a `StockTransferRequest` (product + approved quantity + source/dest,
  `shipmentId` set) so the detail view shows an item. Its `TransferStatus` mirrors the delivery stage
  (`APPROVED` pre-dispatch → `IN_TRANSIT` in transit → `COMPLETED` delivered).
- a **back-dated tracking timeline** — one `ShipmentEvent` per stage, built by `eventsForStatus`.

**Couriers** are resolved from the WORKER HR `Employee` rows (created by the HR seed) keyed by the worker's
branch — so a shipment sourced at a branch is couriered by that branch's worker. This is why
`ensureShipments` **runs after `hrSeed.seed()`**.

### The timeline helper
`backend/src/common/seeds/shipment-seed-timeline.ts` — a pure, deterministic
`eventsForStatus(status): ShipmentEventType[]` that returns the ordered timeline a shipment in a given
status has accumulated (every shipment starts `CREATED`; in-transit ones carry a `CHECKPOINT`; terminals
end on their own event). Unit-tested in `shipment-seed-timeline.spec.ts`.

### Properties
- **Idempotent** — guarded by `shipmentRepository.count() > 0`, so re-running the seed is a no-op.
- **Additive** — like `ensureStockTransfers` it **never moves inventory**; the seeded `inventory.quantity`
  totals stay authoritative and these rows are treated as history. (The real service moves stock at
  dispatch/deliver; the direct-insert seed deliberately does not.)
- **DI** — `Shipment` and `ShipmentEvent` are registered in `app.module.ts` `TypeOrmModule.forFeature` so
  the seed service can inject their repositories (`Employee` was already registered).

---

## 7. Verification

```bash
# Backend build + the timeline unit test, then the full suite
cd backend
pnpm build
pnpm jest src/common/seeds/shipment-seed-timeline.spec.ts
pnpm jest

# Re-seed a running dev stack (the seed runs on backend boot; idempotent)
docker restart ledgerpro-backend
# (first run is slow only because Cloudinary product-image uploads time out and
#  fall back to raw URLs — unrelated to shipments, which seed right after HR)
```

Confirm the rows (run inside the Postgres container):

```sql
SELECT status, count(*) FROM shipments GROUP BY status ORDER BY 1;   -- all 7 statuses, 1 each
SELECT
  (SELECT count(*) FROM shipments)                                   AS shipments,        -- 7
  (SELECT count(*) FROM shipment_events)                             AS events,           -- 30
  (SELECT count(*) FROM shipments WHERE courier_employee_id IS NOT NULL) AS with_courier, -- 5
  (SELECT count(*) FROM stock_transfer_requests WHERE shipment_id IS NOT NULL) AS lines;  -- 7
```

In the UI:

- Log in as **admin** or a **manager** → `/shipments` shows the KPI summary, cards across every status, and
  populated filter chips; open one → the tracking timeline lists its events.
- Log in as a **worker** (`worker@ledgerpro.com` / `Worker@123`) → **"My deliveries"** lists the shipments
  that worker couriers. (See [`seeded-accounts.md`](./seeded-accounts.md) for all logins.)

---

## 8. Notes & extension points

- To add more demo shipments, extend the `specs` array in `ensureShipments` (and, if you add a new
  `ShipmentStatus`, add its timeline to `TIMELINES` in `shipment-seed-timeline.ts` — the spec asserts every
  status is mapped).
- The seed is intentionally **direct-insert**. If you ever need the seed to also move stock, route it
  through `ShipmentsService` instead — but then keep it consistent with how `inventory.quantity` is seeded.
- Tracking-event timestamps are approximate (back-dated relative to seed time), matching the other demo
  seeds; they order the feed but are not meant to reconcile to the minute with the lifecycle timestamps.
