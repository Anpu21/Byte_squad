# Shop UX overhaul — design spec

**Date:** 2026-05-13
**Branch:** `dinesh`
**Status:** Approved (pending user spec review)
**Author:** Pair design with Dineshs737
**Related:** Customer-orders / PayHere / loyalty work already implemented in working tree on `dinesh`.

---

## 1. Context and goals

LedgerPro Shop already has end-to-end pickup orders with both manual and online (PayHere) payment, a loyalty backend (earn/redeem/reverse), and a recommendations endpoint. The remaining gap is **customer-facing surfaces**: customers cannot see their loyalty points anywhere except as an input on the checkout page, the PayHere redirect feels jarring (silent hidden-form auto-submit), and the storefront does not feel like a real e-commerce platform.

This spec covers a three-PR sequence that ships those missing surfaces.

### Out of scope

- Backend orders / PayHere / loyalty earn-redeem-reverse logic — already implemented.
- Migration application (`backend/migrations/2026-05-shop-orders-payments-loyalty.sql`) — must be applied on dev/prod manually before any of this ships.
- Personalised recommendations beyond category-match + top-sellers + buy-again. ML / collaborative filtering is YAGNI for v1.
- Wishlist, reviews, ratings — not requested.
- Admin or staff loyalty views — customer-facing only.

### Success criteria

- Customer can see their loyalty balance from any page in the shop.
- Customer can view full earn/redeem/reverse history at `/shop/rewards`.
- Customer who pays online sees a branded redirect page, not a flash of nothing.
- Catalog has a "Buy it again" section for repeat customers.
- Product detail page surfaces "You may also like" cross-sell.
- All new UI strictly uses design tokens and UI primitives from `rules.md` §5; CI typecheck stays green.

---

## 2. Architecture — three sequenced PRs

| # | PR | New backend? | Approx files | Independent? |
|---|---|---|---|---|
| **PR-1** | Payment gateway page | No | ~8 | Yes |
| **PR-2** | Loyalty surfaces | One new endpoint (`GET /loyalty/me/history`) + supporting types | ~20 | Yes |
| **PR-3** | Shop polish | No (reuses `/shop/products/recommended`, `/customer-orders/mine`) | ~12 | Yes |

PR-1, PR-2, PR-3 are independent. The recommended ship order is **PR-1 → PR-2 → PR-3** (smallest first, biggest last) but no PR blocks another. Each respects `rules.md` §15 "one concern per PR".

---

## 3. Shared design language (locked across all 3 PRs)

The visual language below is the contract every PR follows. Drift between PRs is a review-blocker.

### Loyalty identity

| Surface | Token / treatment |
|---|---|
| Icon | lucide-react `Sparkles` — never substituted with star/gift/coin |
| Accent background | `bg-warning-soft` |
| Accent text | `text-warning` |
| Neutral chip background | `bg-primary-soft` |
| Neutral chip text | `text-primary-soft-text` |
| Compact number format | `240 pts` (chips, badges) |
| Full number format | `240 points` (headings, KPIs) |
| Earned glyph | `+12` in `text-success` |
| Redeemed glyph | `−8` in `text-warning` |
| Reversed glyph | `+8` in `text-text-2` |
| Adjusted glyph | `±N` in `text-text-2` |

Numbers are always integers. The backend stores integer points; the frontend never formats decimals.

### Tone copy

- "You earned X points." — past, achievement
- "Use up to X points." — neutral, suggestion
- "Worth LKR X off." — explanatory, conversion
- Never mix "rewards" and "points" in one sentence. The page header uses "Rewards" once; the body uses "points".

### Visual tokens (recap from `rules.md` §5)

- Money: `formatCurrency(n)` from `lib/utils` → `"LKR 1,240.00"`. Never inline.
- Page header: `<h1 class="text-2xl font-bold text-text-1 tracking-tight">` to match existing shop pages.
- Card surface: `bg-surface border border-border rounded-md p-5` (or the `Card` primitive).
- Z-index: only from the named scale (`z-sticky`, `z-dropdown`, `z-overlay`, `z-modal`, `z-toast`).
- Mobile-first: table → card list at the `sm:` breakpoint, matching `MyOrdersTable` / `MyOrdersCardList`.
- Motion: limited to `animate-in fade-in slide-in-from-bottom-2 duration-300` (existing dropdown pattern) and `animate-spin` for spinners. No bespoke keyframes.

### Accessibility

- Every clickable is a `<button>` or `<Link>` — never `<div onClick>`.
- The header badge carries `aria-label="Loyalty points: 240"` because the chip text is compact.
- The history table uses `<th scope="col">` and a visually-hidden `<caption>`.
- Type/glyph carries earn/redeem signal in addition to colour (color is never the only signal).
- `<Link>` and `useNavigate` only — no `window.location.*`. The single legitimate `<form action>` is `PayhereRedirectForm` (submits to the external PayHere URL).

---

## 4. PR-1 — Payment gateway page

### Goal

Replace the silent hidden-form auto-submit with a branded `"Securely redirecting to PayHere…"` page that customers see for ~1.5 seconds before PayHere takes over.

### Routing

Add to `frontend/src/constants/routes.ts`:
```ts
SHOP_CHECKOUT_PAY: '/shop/checkout/pay',
```

Add to `frontend/src/routes/routes.config.tsx`:
```ts
{
    path: FRONTEND_ROUTES.SHOP_CHECKOUT_PAY,
    element: <PayhereGatewayPage />,
    allowedRoles: [UserRole.CUSTOMER],
    layout: 'customer-public',  // minimal chrome
},
```

### File map

```
frontend/src/
├── constants/routes.ts                                       (1 line)
├── routes/routes.config.tsx                                  (1 route entry)
├── features/checkout/hooks/useCheckout.ts                    (modify: navigate to gateway page)
├── pages/shop/CheckoutPage.tsx                               (remove inline PayhereRedirectForm)
├── features/payhere-gateway/
│   ├── components/PayhereGatewayCard.tsx                     (NEW — visible chrome)
│   └── hooks/usePayhereGateway.ts                            (NEW — countdown + cancel)
├── pages/shop/PayhereGatewayPage.tsx                         (NEW — < 60 lines)
└── features/checkout/components/PayhereRedirectForm.tsx       (kept as utility, now used by gateway page)
```

### Data flow

1. Customer on `/shop/checkout` selects `paymentMode: online` and submits.
2. `useCheckout.onSubmit` calls `POST /api/v1/customer-orders` — backend creates the order + `payhere_payment_attempts` row, returns `{ order, payment }`.
3. `useCheckout` dispatches `clearShopCart()`, then navigates:
   ```ts
   navigate(FRONTEND_ROUTES.SHOP_CHECKOUT_PAY, {
       state: { payment, orderCode, branchName, finalTotal, itemCount },
   });
   ```
4. `PayhereGatewayPage` reads `location.state`; if missing, it redirects to `/shop/my-orders` (defensive).
5. `usePayhereGateway` starts a 2-tick × 750 ms countdown; on each tick, decrements visible seconds; at 0, calls `formRef.current?.submit()`.
6. The `<PayhereRedirectForm>` posts to `payment.actionUrl` with all signed `payment.fields` as hidden inputs — PayHere takes over.
7. PayHere returns the customer to `/shop/orders/:code?payment=return` (paid) or `?payment=cancel` (cancelled at PayHere) — both handled by existing `OrderConfirmationPage`.

### Cancel behaviour

Cancel button navigates the customer to `/shop/orders/:code` (existing public confirmation page). The order is already created and visible there; customers can verify the pending status and retry payment from `My Orders` or wait.

The cancel button does NOT navigate to `/shop/checkout` because the cart was cleared on submit — that would land the customer on an empty cart with no context. It does NOT navigate to `/shop/my-orders` because the customer might not understand why they're being dropped into a list; the single-order confirmation page is the clearest landing.

### `usePayhereGateway` (sketch)

```ts
interface GatewayState {
    payment: IPayhereCheckoutPayload;
    orderCode: string;
    branchName: string;
    finalTotal: number;
    itemCount: number;
}

export function usePayhereGateway() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as GatewayState | null;
    const formRef = useRef<HTMLFormElement | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(2);
    const [cancelled, setCancelled] = useState(false);

    useEffect(() => {
        if (!state || cancelled) return;
        if (secondsLeft <= 0) {
            formRef.current?.submit();
            return;
        }
        const id = setTimeout(() => setSecondsLeft((s) => s - 1), 750);
        return () => clearTimeout(id);
    }, [state, secondsLeft, cancelled]);

    const cancel = () => {
        setCancelled(true);
        navigate(
            FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION.replace(':code', state!.orderCode),
            { replace: true },
        );
    };

    return { state, formRef, secondsLeft, cancel };
}
```

### Visual

```
┌─────────────────────────────────────────────────┐
│            [LedgerPro Logo]                     │
│                                                 │
│  Securely redirecting to PayHere…               │  text-text-2
│                                                 │
│         [animate-spin, primary tint]            │
│                                                 │
│  Paying LKR 1,240.00 for ORD-A7QXM3K2           │  text-text-1 font-semibold
│  3 items · Pickup at Kandy                      │  text-text-2 text-xs
│                                                 │
│  Redirecting in 2…                              │  text-text-3 text-xs
│  ──────────────────────────────────────         │
│  [✕ Cancel and view order]                      │  Button variant="ghost"
│                                                 │
│  <PayhereRedirectForm hidden ref={formRef} />  │
└─────────────────────────────────────────────────┘
```

Card centred with `max-w-md mx-auto mt-16`, surface tokens only.

### Edge cases

| Case | Behavior |
|---|---|
| `/shop/checkout/pay` opened directly with no `location.state` | Redirect to `/shop/my-orders`. |
| Customer clicks cancel | Navigate to `/shop/orders/:code` with `replace: true`. |
| Customer refreshes the page during the 1.5 s window | `location.state` is lost → redirects to `/shop/my-orders`. Acceptable — the order exists and is reachable. |
| Customer opens a second tab and adds items meanwhile | Out of scope; cart was cleared on submit and we do not guard. |
| Network failure at PayHere | PayHere's own error page surfaces. We do not catch — fail path is PayHere → return URL `?payment=cancel`. |

### Testing

- **Unit (frontend):** `usePayhereGateway.test.ts` with fake timers — countdown decrements, cancel sets `cancelled`, form submits at 0.
- **Component:** `PayhereGatewayCard.test.tsx` — renders order code + total, shows cancel button, calls handler.
- **No e2e** — we do not own the PayHere endpoint. We assert the form has the right hidden fields.

### Diff size

~250 lines added, ~30 modified, 0 removed. Within `rules.md` §17 limits.

---

## 5. PR-2 — Loyalty surfaces

### Goal

Surface loyalty everywhere a customer naturally looks: header, profile, dedicated rewards page, and order confirmation.

### Backend addition

**New endpoint:** `GET /api/v1/loyalty/me/history?limit=20&offset=0`

```
backend/src/
├── common/routes/app.routes.ts                                (add LOYALTY.HISTORY: 'me/history')
├── modules/loyalty/
│   ├── dto/list-loyalty-history-query.dto.ts                  (NEW)
│   ├── types/
│   │   ├── index.ts                                            (NEW barrel)
│   │   └── loyalty-history-entry.type.ts                       (NEW)
│   ├── loyalty.repository.ts                                   (add listEntries)
│   ├── loyalty.service.ts                                      (add listHistory)
│   ├── loyalty.controller.ts                                   (add @Get('me/history'))
│   └── loyalty.repository.spec.ts                              (NEW)
```

**Repository:**
```ts
async listEntries(
    userId: string,
    limit: number,
    offset: number,
): Promise<{ rows: LoyaltyLedgerEntry[]; total: number }> {
    const [rows, total] = await this.ledgerRepo.findAndCount({
        where: { userId },
        relations: ['order'],     // surface orderCode via order.orderCode
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
    });
    return { rows, total };
}
```

**Service:** thin pass-through, clamps `limit` to `[1, 100]` (default 20) and `offset` to `>= 0` (default 0). Maps each row to `{ id, type, points, description, orderCode, createdAt }`.

**Controller:**
```ts
@Get(APP_ROUTES.LOYALTY.HISTORY)
listHistory(
    @CurrentUser('id') userId: string,
    @Query() query: ListLoyaltyHistoryQueryDto,
) {
    return this.loyalty.listHistory(userId, query);
}
```

**DTO:**
```ts
export class ListLoyaltyHistoryQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number;
}
```

**Response (wrapped by TransformInterceptor):**
```ts
{
    success: true,
    data: {
        entries: ILoyaltyHistoryEntry[];
        total: number;
        limit: number;
        offset: number;
    },
    message: 'Success'
}
```

### Frontend file map

```
frontend/src/
├── constants/routes.ts                            (SHOP_REWARDS: '/shop/rewards')
├── routes/routes.config.tsx                       (1 route entry)
├── lib/queryKeys.ts                                (loyalty.history({ limit, offset }))
├── services/loyalty.service.ts                    (add getHistory method)
├── types/loyalty/
│   ├── loyalty-ledger-entry-type.type.ts          (NEW — as-const mirror of backend enum)
│   ├── loyalty-history-entry.type.ts              (NEW — ILoyaltyHistoryEntry)
│   ├── loyalty-history-response.type.ts           (NEW — ILoyaltyHistoryResponse)
│   └── index.ts                                    (add exports)
├── features/loyalty/
│   ├── components/
│   │   ├── LoyaltyHeaderBadge.tsx                 (NEW)
│   │   ├── LoyaltyProfileCard.tsx                 (NEW)
│   │   ├── LoyaltyBalanceHero.tsx                 (NEW)
│   │   ├── LoyaltyKpis.tsx                        (NEW)
│   │   ├── LoyaltyHowItWorks.tsx                  (NEW)
│   │   ├── LoyaltyHistoryList.tsx                 (NEW)
│   │   ├── LoyaltyHistoryRow.tsx                  (NEW)
│   │   ├── LoyaltyEmpty.tsx                       (NEW)
│   │   └── PointsEarnedBanner.tsx                 (NEW)
│   └── hooks/
│       ├── useLoyaltySummary.ts                   (NEW)
│       └── useLoyaltyHistory.ts                   (NEW)
├── layouts/CustomerLayout.tsx                      (slot in LoyaltyHeaderBadge)
├── pages/shop/RewardsPage.tsx                     (NEW — < 80 lines)
├── pages/shop/ProfilePage.tsx                     (slot in LoyaltyProfileCard)
└── pages/shop/OrderConfirmationPage.tsx           (slot in PointsEarnedBanner)
```

### Components

**`LoyaltyHeaderBadge`** — in `CustomerLayout` header, between `My Orders` and `ThemeToggle`. Hidden on mobile (`hidden sm:inline-flex`). Clicking it navigates to `/shop/rewards`.

```
┌──────────────────────────────────────┐
│ ✨ 240 pts                            │   bg-warning-soft text-warning rounded-full
└──────────────────────────────────────┘   px-3 h-9 text-[13px] font-medium
```

Hidden when:
- User is not authenticated, or
- User is not a customer.

When `pointsBalance === 0` AND `lifetimePointsEarned === 0` AND `lifetimePointsRedeemed === 0` (true zero state) → render `✨ Earn rewards` as a discovery affordance, not the bare `0 pts`.

**`LoyaltyProfileCard`** — on `/shop/profile`:

```
┌─ Loyalty rewards ──────────────────────────────────┐
│  ┌── Current balance ─┐  Lifetime earned    312    │
│  │  ✨               │  Lifetime redeemed   72     │
│  │     240           │                              │
│  │  points           │  How it works:                │
│  └────────────────────┘    • Earn 1 pt per LKR 100   │
│                            • 1 pt = LKR 1 off        │
│                            • Up to 20% off per order │
│  [View activity →]                                   │
└──────────────────────────────────────────────────────┘
```

`View activity` is a `<Link to={FRONTEND_ROUTES.SHOP_REWARDS}>`.

**`/shop/rewards` page** composes `LoyaltyBalanceHero`, `LoyaltyKpis`, `LoyaltyHowItWorks`, `LoyaltyHistoryList`:

```
✨ Rewards                                        [< back to shop]
──────────────────────────────────────────────────────────────
┌──────────────────────────────────────────────────┐
│  Available balance                                │
│  240 points                                       │
│  Worth up to LKR 240 off your next order          │
└──────────────────────────────────────────────────┘

┌─ Earned (lifetime) ─┐ ┌─ Redeemed ─┐ ┌─ Net ─┐
│      312            │ │     72     │ │  240  │
└─────────────────────┘ └─────────────┘ └───────┘

How it works  ▼   (collapsible — open on desktop, closed on mobile)

Activity
─────────────────────────────────────────────
+12   Earned     ORD-A7QXM3K2     2 days ago
−8    Redeemed   ORD-A7QXM3K2     2 days ago
+18   Earned     ORD-B2KP9MQ      5 days ago
…
[Load more]   ← only shows when offset + limit < total
```

Mobile: history table → card list at `sm:` breakpoint.

**Row tokens:**
- Earned: `+12` in `text-success`, `Sparkles` icon, label "Earned"
- Redeemed: `−8` in `text-warning`, `Minus` icon, label "Redeemed"
- Reversed: `+8` in `text-text-2`, `RotateCcw` icon, label "Reversed"
- Adjusted: `±N` in `text-text-2`, `Edit3` icon, label "Adjusted"

Order code is `<Link to={SHOP_ORDER_CONFIRMATION.replace(':code', orderCode)}>` (clickable to view the order). When `orderCode === null`, no link.

**`PointsEarnedBanner`** — on `/shop/orders/:code`, above the QR card, when `order.status === 'completed'` AND `order.loyaltyPointsEarned > 0`:

```
┌──────────────────────────────────────────────────────┐
│  ✨  You earned 12 points!                            │   bg-warning-soft
│      View your rewards →                              │   animate-in fade-in slide-in-from-bottom-2
└──────────────────────────────────────────────────────┘
```

Banner is `<Link>` wrapper to `/shop/rewards` for the whole surface.

### Hooks

**`useLoyaltySummary`** — single source of truth for balance + lifetime numbers:

```ts
export function useLoyaltySummary() {
    const { user, isAuthenticated } = useAuth();
    return useQuery({
        queryKey: queryKeys.loyalty.mine(),
        queryFn: loyaltyService.getMine,
        enabled: isAuthenticated && user?.role === UserRole.CUSTOMER,
        staleTime: 30_000,
    });
}
```

Used by `LoyaltyHeaderBadge`, `LoyaltyProfileCard`, `LoyaltyBalanceHero`, `LoyaltyKpis`, `useCheckout`.

**`useLoyaltyHistory`** — paginated, load-more semantics:

```ts
export function useLoyaltyHistory(pageSize = 20) {
    const [offset, setOffset] = useState(0);
    const query = useQuery({
        queryKey: queryKeys.loyalty.history({ limit: pageSize, offset }),
        queryFn: () => loyaltyService.getHistory({ limit: pageSize, offset }),
    });
    return {
        ...query,
        offset,
        loadMore: () => setOffset((o) => o + pageSize),
    };
}
```

Local list state appends pages — simpler than `useInfiniteQuery` and fine for the expected <100-entry workload.

### Cache invalidation

On any mutation that affects loyalty (order create with redeem, order fulfill that awards, order cancel that reverses), the caller invalidates both:

```ts
queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.mine() });
queryClient.invalidateQueries({ queryKey: ['loyalty', 'history'] });   // prefix match
```

Added to:
- `useCheckout.onSubmit` success path
- `useMyOrdersPage.onCancel` success path

### Edge cases

| Case | Behavior |
|---|---|
| Customer has 0 points AND 0 lifetime activity | Badge renders `✨ Earn rewards`; profile card shows zero state; rewards page shows `LoyaltyEmpty` ("Place your first pickup order to start earning") |
| `GET /loyalty/me` fails (network) | Badge hidden silently; card/page shows generic error state with a retry button |
| History endpoint returns empty | "No activity yet" with the explainer always visible |
| `order.loyaltyPointsEarned === 0` (e.g. tiny order < LKR 100) | Banner is not rendered |
| User is on `/shop/orders/:code` for an order not their own (public access) | Banner still renders if the order has earned points — it's celebratory, not sensitive |
| Customer is admin/manager/cashier | Badge / card / rewards link not rendered (`useLoyaltySummary` is enabled only for customers) |

### Testing

- **Backend:** `loyalty.repository.spec.ts` covers `listEntries` pagination & ordering. `loyalty.service.spec.ts` covers limit clamping.
- **Frontend:** `useLoyaltySummary.test.ts`, `useLoyaltyHistory.test.ts`, `LoyaltyHeaderBadge.test.tsx` (variant rendering), `PointsEarnedBanner.test.tsx` (renders/hides correctly).

### Diff size

~700 lines added, ~50 modified. ~20 files. One concern.

---

## 6. PR-3 — Shop polish

### Goal

Make the storefront feel like a real e-commerce platform across catalog, product detail, cart, and checkout. No backend change.

### 6.1 Catalog page (`/shop`)

```
Current:                              New:
┌──────────────────────────┐         ┌────────────────────────────────────┐
│ Browse products           │         │  ┌── Hero ──────────────────────┐ │
│ Showing items at Kandy.   │         │  │ Welcome back, Dinesh         │ │
│ [Filters bar (inline)]    │         │  │ Pickup at Kandy ▾  ✨ 240 pts │ │
│ Recommended for you ▶▶    │         │  └──────────────────────────────┘ │
│ All products grid         │         │  Category chips (horiz scroll)     │
└──────────────────────────┘         │  [All] [Beverages] [Snacks] …      │
                                      │  Buy it again  (4 items)           │
                                      │  Recommended for you  (4 items)    │
                                      │  All products grid + search        │
                                      └────────────────────────────────────┘
```

**New files:**
- `features/shop-catalog/components/CatalogHero.tsx`
- `features/shop-catalog/components/CategoryChips.tsx`
- `features/shop-catalog/components/BuyAgainSection.tsx`
- `features/shop-catalog/hooks/useBuyAgain.ts`
- `features/shop-catalog/lib/buy-again.ts` (pure helper)

**Modified files:**
- `pages/shop/CatalogPage.tsx`
- `features/shop-catalog/hooks/useCatalogPage.ts`
- `features/shop-catalog/components/CatalogFilters.tsx` (drop the category `<select>`, keep search)

**Buy again — derivation rules:**
- Read existing `/customer-orders/mine` via TanStack Query (already loaded by `useMyOrdersPage` elsewhere, so cache hit is likely).
- Filter to orders with `status IN ('pending', 'accepted', 'completed')` — exclude cancelled / rejected / expired.
- Flatten items, count per `productId`, sort by count desc.
- Cross-reference against the catalog products at the current branch — keep only `stockStatus !== 'out'` AND still-active products.
- Dedupe against `recommendedProducts` (buy-again wins if collision).
- Take top 4. Hide section if `< 1`.

`buy-again.ts` exposes a pure helper for easy unit testing:
```ts
export function buyAgainCandidates(
    orders: ICustomerOrder[],
    catalog: IShopProduct[],
    recommendedIds: ReadonlyArray<string>,
    limit = 4,
): IShopProduct[];
```

**Category chips** replace the category `<select>` dropdown. Horizontal scroll on mobile (`overflow-x-auto snap-x`), wrap on desktop. Active: `bg-primary text-text-inv`; inactive: `bg-surface-2 text-text-2 hover:bg-surface`. "All" pseudo-chip with `value=""`.

### 6.2 Product detail (`/shop/products/:id`)

**New files:**
- `features/product-detail/components/RelatedProductsSection.tsx`
- `features/product-detail/hooks/useRelatedProducts.ts`

**Modified files:**
- `pages/shop/ProductDetailPage.tsx`
- `features/product-detail/hooks/useProductDetail.ts` (extend to expose `relatedProducts`)

**Adds:**
1. **`RelatedProductsSection`** at the bottom of the page, header "You may also like". Reads `/shop/products/recommended?branchId&productId&limit=4`.
2. **Sticky add-to-cart on mobile** — when scrolled past the inline button, a `z-sticky` footer bar appears with name + price + add-to-cart. Hidden at `sm:` breakpoint.
3. **Low-stock urgency hint** — when `inv_quantity <= low_stock_threshold` AND `> 0`, show `Only N left` in `text-warning` under the price.

### 6.3 Cart drawer + page

**Modified files:**
- `components/shop/CartDrawer.tsx`
- `pages/shop/CartPage.tsx`

**Adds:**
1. **Loyalty preview** in drawer footer and on `CartPage` summary (only when logged-in customer with a balance OR a meaningful subtotal):
   ```
   Subtotal              LKR 1,240.00
   ✨ You'll earn ~12 pts on pickup
   [Checkout]
   ```
   Calculation: `Math.floor(subtotal / 100)`. No API call.

2. **Stale-stock indicator per line** — if the customer's pickup branch changed and an item now has `stockStatus === 'out'` at the new branch, show `Out of stock at <branch>` warning. Reads the same `shopProductsService.listProducts` cache as the catalog; no new query.

### 6.4 Checkout page

**New file:**
- `features/checkout/components/LoyaltyPointsInput.tsx` (extracted out of inline form, exposes "Use max" button)

**Modified files:**
- `pages/shop/CheckoutPage.tsx`
- `features/checkout/components/CheckoutOrderSummary.tsx` (cleaner before/after breakdown)

**Adds:**
1. **"Use max" button** next to the loyalty points input — sets value to `maxRedeemable` in one click.
2. **Before/after breakdown** in `CheckoutOrderSummary`:
   ```
   Subtotal              LKR 1,240.00
   − Loyalty discount    −LKR 0.00
   ───────────────────
   Total                 LKR 1,240.00
   You'll earn           ~12 points
   ```

### Edge cases

| Case | Behavior |
|---|---|
| Customer with no past orders | `BuyAgainSection` returns `null` → does not render |
| Customer cancels every past order | Same — buy-again list is empty, section hidden |
| Buy-again products are all out of stock at current branch | All filtered out, section hidden |
| `recommended` endpoint returns a product that's also in buy-again | Buy-again wins; recommended dedupes |
| Sticky footer on product detail at desktop width | Hidden (`sm:hidden`) |
| Cart with stale-stock item | Indicator visible; checkout still allowed (backend rechecks stock and may 409 — already handled by `useCheckout.onSubmit`) |
| Loyalty preview when subtotal < LKR 100 | `Math.floor` returns 0 → renders `You'll earn 0 pts` — hide the preview line if 0 |

### Testing

- **Unit:** `buy-again.test.ts` for the pure helper — exhaustive (the only meaningful logic).
- **Component:** snapshot/render tests for `BuyAgainSection`, `CategoryChips`, `RelatedProductsSection`, `LoyaltyPointsInput`.
- **No e2e** — visual additions.

### Diff size

~600 lines added, ~80 modified. ~12 files.

---

## 7. Combined data flow (all 3 PRs shipped)

```
Customer browses /shop
├─ CatalogPage reads /shop/products + /shop/products/recommended + /customer-orders/mine
├─ CustomerLayout shows ✨ 240 pts (from /loyalty/me) + branch pill
├─ Click product → /shop/products/:id (reads /shop/products/:id + /shop/products/recommended?productId)
├─ Add to cart → drawer shows ✨ "You'll earn ~12 pts"
└─ Checkout → /shop/checkout
        ├─ Pay at pickup → POST /customer-orders → /shop/orders/:code
        └─ Pay online    → POST /customer-orders → /shop/checkout/pay (PR-1)
                                                  → PayHere → /shop/orders/:code?payment=return
                                                              + Confirmation shows ✨ "You earned 12 points!" (PR-2)
Customer views /shop/rewards (PR-2)
└─ Reads /loyalty/me + /loyalty/me/history
```

---

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Migration `2026-05-shop-orders-payments-loyalty.sql` not applied before backend boot | PR description + this spec repeat the requirement. Backend boots with `DB_SYNC=true` would auto-add columns but rename will not happen — manual apply is mandatory in any non-dev environment. |
| PayHere env vars unset → 503 on online checkout | `CheckoutPage` already surfaces backend `message` via `setError`. PR-1 does not change error handling. |
| `/loyalty/me/history` grows large for active customers | Server-side `limit/offset` pagination + existing `idx_loyalty_ledger_entries_user_id`. Frontend "Load more" never fetches all-at-once. |
| PR-3 catalog redesign drifts from existing visual language | Strict adherence to tokens and primitives. Reviewable PR scope. |
| Buy-again is empty for new customers | Component returns `null`. Catalog still has Recommended + grid. |
| Customer accidentally cancels at the gateway page mid-redirect | Order remains as `pending` + `payment_status='pending'`; customer can retry from `My Orders` (cancel + reorder) — acceptable v1 trade-off. A "Retry payment" button on the confirmation page is a future enhancement. |
| Multiple browser tabs racing through checkout | Cart cleared on submit; second tab will see empty cart on next render. We do not guard. |

---

## 9. Rollout sequence

1. **PR-1** — payment gateway page. Ship, verify online checkout in PayHere sandbox.
2. **PR-2** — loyalty surfaces + `/loyalty/me/history` endpoint. Ship, verify badge appears, history populates after a redeem + fulfill cycle.
3. **PR-3** — shop polish. Ship, monitor for visual regressions in catalog / product detail / cart / checkout.

Each PR is independently revertable. PR-2 and PR-3 may be reordered if priorities change. PR-1 should ship first because it is the smallest and unblocks confident online-payment QA.

---

## 10. Out of this spec — for future cycles

- "Retry payment" button on `OrderConfirmationPage` for `paymentMode='online'` + `paymentStatus='pending'` orders. Requires re-issuing a fresh `payhere_payment_attempts` row from the backend — likely a new `POST /customer-orders/:id/retry-payment` endpoint.
- Personalised recommendations beyond category + top-sellers + buy-again. Could read `loyalty_ledger_entries` for purchase frequency or build a collaborative filter.
- Wishlist / favourites.
- Loyalty tier system (bronze/silver/gold based on lifetime earned).
- Staff-facing loyalty admin (manual point adjustments via `LoyaltyLedgerEntryType.ADJUSTED`).
