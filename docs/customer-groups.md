# Customer Groups — shared cart, group checkout & purchase analytics

Registered storefront customers ("normal users") can **shop together**: form a
group, invite others by code/link, fill **one shared cart** collaboratively, let
**any member check out and pay**, and see **consolidated purchase analytics** for
the group. Families, flatmates, hostels and small offices are the target.

The build is mostly additive — it reuses the storefront checkout, PayHere, the
socket.io gateway and the brand-analytics aggregation pattern. The one genuinely
new piece is a **server-persisted shared cart** (personal carts are client-only
Redux).

> Branch: `feat/customer-groups`. Module: `backend/src/modules/customer-groups/`.
> Frontend feature: `frontend/src/features/customer-groups/`.

---

## 1. Naming gotcha — `groupCode` vs `customerGroupId`

`CustomerOrder.groupCode` (`GRP-xxxx`) **already existed** and means *payment
batching of a multi-branch checkout* — NOT customer grouping. The customer-group
link is a **separate** nullable column, `CustomerOrder.customerGroupId`. Both
coexist on an order: `groupCode` batches the branches of one checkout;
`customerGroupId` says which customer group the checkout came from.

---

## 2. Data model

Three new tables (varchar-backed status enums to avoid the dev `DB_SYNC`
PG-enum-narrowing footgun; all cross-module FKs are scalar columns).

### `customer_groups` — `CustomerGroup`
`id` · `name` · `joinCode` (varchar, **unique**, e.g. `FAM-7Q2K9X4P`) ·
`ownerUserId` (FK User, RESTRICT) · `status` (`active | archived`, varchar16) ·
timestamps. Indexes: unique `joinCode`, `ownerUserId`.

### `customer_group_members` — `CustomerGroupMember`
`id` · `customerGroupId` (FK, CASCADE) · `userId` (FK User, CASCADE) · `role`
(`owner | member`, varchar16) · `joinedAt`. Unique `(customerGroupId, userId)`;
index on `userId` (list a user's groups).

### `group_cart_items` — `GroupCartItem`
The shared cart **is** the group's item rows (no cart header). **Price-authority
safe — stores NO price/name/image**; product + live price are resolved on read
and at checkout. `id` · `customerGroupId` (FK, CASCADE, indexed) · `productId`
(FK Product, RESTRICT) · `branchId` (FK Branch, RESTRICT) · `unitId` (nullable) ·
`quantity` (decimal 12,3) · `amount` (decimal 12,2, nullable — "buy by amount") ·
`addedByUserId` (FK User, CASCADE) · timestamps. Line identity mirrors the
storefront cart: `(productId, branchId, unitId, amount!=null)`; merges happen in
the service inside a transaction.

### `customer_orders.customer_group_id`
Nullable uuid + index + FK to `customer_groups` (**SET NULL**). `userId` already
records the paying member, so no extra "purchasedBy" column.

Schema ships via the idempotent migration
`1779733100000-CreateCustomerGroups.ts`; dev uses `DB_SYNC`.

---

## 3. Authorization — membership-scoped, **not** branch-scoped

A group is cross-branch by design (its cart can span branches), so the usual
"filter non-admins by `actor.branchId`" rule does **not** apply. Instead every
endpoint is `@Roles(CUSTOMER)` and the service calls `assertMembership(groupId,
userId)` (and `assertOwner` for owner-only actions). A non-member gets `403` on a
group's detail, cart, checkout and analytics.

Lifecycle rules:
- **Merge on add**, last-write-wins on set-qty. Every cart mutation broadcasts so
  others refetch.
- A member who **leaves / is removed** keeps their lines (they belong to the
  group). The **sole owner cannot plain-leave** — they archive instead (no
  ownership-transfer endpoint in v1).
- **Checkout clears the cart on order creation** (not on PayHere success — PayHere
  settles async via its webhook), mirroring the personal storefront.

---

## 4. Real-time

Reuses `NotificationsGateway.broadcast(event, payload)` exactly like
`customer-order:created`: every cart mutation and checkout emits
`broadcast('group-cart:changed', { groupId })`. The FE hook
`useGroupCartLiveSync(groupId)` invalidates the open group's cart query when
`payload.groupId` matches. (A per-group socket room is a later optimization.)

---

## 5. Checkout — reuses the storefront PayHere flow

`CustomerOrdersService.createCheckout(dto, userId, opts?: { customerGroupId? })`
gained an optional `customerGroupId` that stamps each created order.
`GroupCheckoutService.checkout` maps the shared cart → `CheckoutItemDto[]`, calls
`createCheckout` (reusing all pricing / loyalty / PayHere plumbing), clears the
cart and broadcasts. The result `{ groupCode, orders, payment }` is identical to
the personal checkout, so the FE hands `payment` to the existing PayHere gateway
page via router `location.state`.

---

## 6. Analytics

`GroupAnalyticsRepository` mirrors `brands.repository.ts`, sourced from
`customer_orders` / `customer_order_items` scoped to one group. **Real purchases
only:** `status = completed` OR `payment_status = paid`. Order-level KPIs and
item-level breakdowns use **separate queries** so the item join never overcounts
order spend.

- **KPIs:** total spend (Σ `final_total`), order count, avg order value, members
  (distinct `user_id`).
- **By member** (group by `user_id`): spend + orders → donut + table.
- **By product** (group by item product): units + revenue → bar + table.
- **Over time:** `TO_CHAR(created_at,'YYYY-MM-DD')`, zero-filled → area chart.

---

## 7. API & UI surface

### REST (`APP_ROUTES.CUSTOMER_GROUPS`, all `@Roles(CUSTOMER)`)
| Method | Path | Purpose |
|---|---|---|
| POST | `/customer-groups` | create (creator → owner + join code) |
| GET | `/customer-groups/mine` | my owned + joined groups |
| GET | `/customer-groups/:id` | detail + members (member-only) |
| POST | `/customer-groups/join` | join by `{ joinCode }` |
| PATCH | `/customer-groups/:id` | rename / archive (owner) |
| POST | `/customer-groups/:id/leave` | leave (owner blocked) |
| DELETE | `/customer-groups/:id/members/:userId` | remove member (owner) |
| POST | `/customer-groups/:id/regenerate-code` | new join code (owner) |
| GET / POST | `/customer-groups/:id/cart` | read / add+merge |
| PATCH / DELETE | `/customer-groups/:id/cart/:itemId` | set qty / remove |
| DELETE | `/customer-groups/:id/cart` | clear |
| POST | `/customer-groups/:id/checkout` | check out the shared cart |
| GET | `/customer-groups/:id/analytics?startDate&endDate` | analytics |

### Frontend (storefront, `RequireRole([CUSTOMER])`)
- `GroupsPage` — `/shop/groups`: my groups, create, join-by-code. Invite links
  `/shop/groups?join=CODE` open the join modal prefilled.
- `GroupDetailPage` — `/shop/groups/:id`: live shared cart, members (owner can
  remove), invite/share code, settings (rename/archive), checkout.
- `GroupAnalyticsPage` — `/shop/groups/:id/analytics`: KPIs + donut/area/bar +
  member & product tables + date range.
- Storefront nav gains a **Groups** tab.

---

## 8. Shop context — personal vs group (the "add to group cart" UX)

A persisted Redux slice `shopContext` (`{ mode: 'personal' | 'group', groupId,
groupName }`) decides where catalog "Add to cart" goes. In group mode the catalog
and product-detail `handleAdd` call the **group-cart API** instead of the personal
Redux cart; a storefront-wide `ShopContextBanner` shows the active group with a
one-tap "Switch to personal". "Shop for this group" on the cart panel sets the
context and routes to the catalog; leaving/archiving the active group clears it.

Data layer: `services/customer-groups.service.ts`, `queryKeys.customerGroups`,
one TanStack hook per endpoint under `features/customer-groups/hooks/`, types
under `types/customer-groups/` (re-exported via the `@/types` barrel).

---

## 9. Verification

```bash
# Backend (run inside the backend container or backend/)
pnpm exec tsc --noEmit
pnpm exec jest src/modules/customer-groups src/modules/customer-orders
pnpm run build

# Frontend
pnpm run typecheck
pnpm exec vitest run src/features/customer-groups
pnpm run build
```

**Manual E2E:** User A creates a group → shares the code → User B joins → both add
items (B sees A's add appear live) → A checks out → PayHere → orders stamped
`customerGroupId`, cart cleared for both → analytics shows spend by member /
product / time. A non-member gets `403` on the group's cart + analytics.

---

## 10. Scope & extension points

**v1 is groups + shared cart + analytics only.** Deliberately out of scope:
shared wallet / credit / loyalty pooling, split payment, ownership transfer,
email invites. Natural next steps: transfer ownership, group loyalty, group
credit (khata), bulk/group pricing, and a per-group socket room for cart sync.
