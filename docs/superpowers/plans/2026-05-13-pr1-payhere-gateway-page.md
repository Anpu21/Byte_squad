# PR-1 — PayHere Gateway Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the silent hidden-form auto-submit on online checkout with a branded `/shop/checkout/pay` redirect page that shows order summary, a visible countdown, and a cancel-back path. No backend change.

**Architecture:** Three new frontend units — a `usePayhereGateway` hook (timer + cancel + form-submit orchestration), a `PayhereGatewayCard` presentational component, and a `PayhereGatewayPage` page. The existing `PayhereRedirectForm` is refactored to be a pure forwardRef-based render that no longer auto-submits — the hook now owns submission timing. `useCheckout` navigates to the new route with the payment payload in router state instead of rendering the form inline on `/shop/checkout`.

**Tech Stack:** React 19, TypeScript (strict, no `any`, no `as Foo` without runtime narrowing per `rules.md` §3), React Router 7, Tailwind 4 with semantic tokens only, Vitest 4 + `@testing-library/react` 16. Backend untouched.

**Reference docs:**
- Spec: `docs/superpowers/specs/2026-05-13-shop-ux-overhaul-design.md` §4 (this PR) and §3 (shared design language).
- Rules: `rules.md` §3 (TypeScript), §4 (React), §5 (TSX/layout), §13 (testing), §15 (commits).

---

## File map

**New:**
- `frontend/src/features/payhere-gateway/types/gateway-state.type.ts`
- `frontend/src/features/payhere-gateway/types/index.ts`
- `frontend/src/features/payhere-gateway/hooks/usePayhereGateway.ts`
- `frontend/src/features/payhere-gateway/hooks/usePayhereGateway.test.ts`
- `frontend/src/features/payhere-gateway/components/PayhereGatewayCard.tsx`
- `frontend/src/features/payhere-gateway/components/PayhereGatewayCard.test.tsx`
- `frontend/src/pages/shop/PayhereGatewayPage.tsx`

**Modified:**
- `frontend/src/constants/routes.ts` — add `SHOP_CHECKOUT_PAY`.
- `frontend/src/routes/routes.config.tsx` — add new route entry.
- `frontend/src/features/checkout/components/PayhereRedirectForm.tsx` — convert to `forwardRef`, drop auto-submit.
- `frontend/src/features/checkout/hooks/useCheckout.ts` — navigate to gateway page instead of returning local `payherePayload`.
- `frontend/src/pages/shop/CheckoutPage.tsx` — remove inline `PayhereRedirectForm` rendering and the `payherePayload`-dependent guards.

**Unchanged but referenced:**
- `frontend/src/types/customer-orders/payhere-checkout.type.ts` — exposes `IPayhereCheckoutPayload` (already exported via the `@/types` barrel).
- `frontend/src/components/ui/index.ts` — provides `Button` for the cancel button.
- `frontend/src/components/ui/Logo.tsx` — renders the branded logo.

---

## Conventions used in this plan

- Run commands from the **`frontend/`** directory unless otherwise noted.
- TypeScript strict mode is on. No `any`, no bare `as Foo` casts. Type guards narrow `unknown`.
- All tests live next to their unit (`<file>.test.ts(x)`). The Vitest config (`vitest.config.ts`) auto-includes them and `src/test/setup.ts` registers `@testing-library/jest-dom` matchers.
- Commits use Conventional Commits per `rules.md` §15.

---

## Task 1: Add the new route constant and the `GatewayState` type

**Why first:** Both the hook and the page depend on `FRONTEND_ROUTES.SHOP_CHECKOUT_PAY` and the shared `GatewayState` type. Locking the contract first prevents drift in later tasks.

**Files:**
- Modify: `frontend/src/constants/routes.ts`
- Create: `frontend/src/features/payhere-gateway/types/gateway-state.type.ts`
- Create: `frontend/src/features/payhere-gateway/types/index.ts`

- [ ] **Step 1.1 — Add the route constant.**

In `frontend/src/constants/routes.ts`, find the `SHOP_CHECKOUT` line (currently `SHOP_CHECKOUT: '/shop/checkout',`) and insert one line directly below it:

```ts
SHOP_CHECKOUT_PAY: '/shop/checkout/pay',
```

The constant ordering matters only for human readability — keep it near the other `SHOP_*` entries.

- [ ] **Step 1.2 — Create the `GatewayState` type.**

Write `frontend/src/features/payhere-gateway/types/gateway-state.type.ts`:

```ts
import type { IPayhereCheckoutPayload } from '@/types';

export interface GatewayState {
    payment: IPayhereCheckoutPayload;
    orderCode: string;
    branchName: string;
    finalTotal: number;
    itemCount: number;
}
```

- [ ] **Step 1.3 — Create the barrel.**

Write `frontend/src/features/payhere-gateway/types/index.ts`:

```ts
export * from './gateway-state.type';
```

- [ ] **Step 1.4 — Typecheck.**

Run: `pnpm run typecheck`
Expected: exit code 0, no output.

- [ ] **Step 1.5 — Commit.**

```bash
git add frontend/src/constants/routes.ts frontend/src/features/payhere-gateway/types/
git commit -m "feat(checkout): scaffold gateway-state type and SHOP_CHECKOUT_PAY route constant"
```

---

## Task 2: Refactor `PayhereRedirectForm` to forwardRef and drop auto-submit

**Why:** The hook (Task 3) must own submission timing. We make the form a pure render component the gateway page can submit on its own schedule.

**Files:**
- Modify: `frontend/src/features/checkout/components/PayhereRedirectForm.tsx`

- [ ] **Step 2.1 — Rewrite the component to forwardRef without auto-submit.**

Replace the entire contents of `frontend/src/features/checkout/components/PayhereRedirectForm.tsx` with:

```tsx
import { forwardRef } from 'react';
import type { IPayhereCheckoutPayload } from '@/types';

interface PayhereRedirectFormProps {
    payment: IPayhereCheckoutPayload;
}

export const PayhereRedirectForm = forwardRef<
    HTMLFormElement,
    PayhereRedirectFormProps
>(function PayhereRedirectForm({ payment }, ref) {
    return (
        <form
            ref={ref}
            method="post"
            action={payment.actionUrl}
            aria-hidden="true"
            className="hidden"
        >
            {Object.entries(payment.fields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
            ))}
        </form>
    );
});
```

Notes:
- We add `aria-hidden="true"` and `className="hidden"` because this form is never user-interactive — the gateway page's card carries the visible UX. Hidden inputs do not need to be in the tab order.
- We drop the `useEffect` that called `formRef.current?.submit()` — the hook now triggers submit.

- [ ] **Step 2.2 — Typecheck.**

Run: `pnpm run typecheck`
Expected: exit code 0, no output.

The existing import in `CheckoutPage.tsx` will keep compiling because the named export `PayhereRedirectForm` is preserved. The runtime behaviour now silently does nothing on its own — that's expected; the gateway page will take over in later tasks. We do **not** ship this single change alone (the verify pipeline doesn't fail, but the online checkout would visibly break). The plan keeps all the changes in one branch and we will only push after Task 9's full verify.

- [ ] **Step 2.3 — Commit.**

```bash
git add frontend/src/features/checkout/components/PayhereRedirectForm.tsx
git commit -m "refactor(checkout): expose PayhereRedirectForm ref, drop auto-submit"
```

---

## Task 3: Build `usePayhereGateway` hook (TDD)

**Files:**
- Create: `frontend/src/features/payhere-gateway/hooks/usePayhereGateway.test.ts`
- Create: `frontend/src/features/payhere-gateway/hooks/usePayhereGateway.ts`

- [ ] **Step 3.1 — Write the failing test file.**

Write `frontend/src/features/payhere-gateway/hooks/usePayhereGateway.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { usePayhereGateway } from './usePayhereGateway';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { GatewayState } from '../types';

const validState: GatewayState = {
    payment: {
        provider: 'payhere',
        actionUrl: 'https://sandbox.payhere.lk/pay/checkout',
        fields: { merchant_id: 'M', order_id: 'O', amount: '1240.00' },
    },
    orderCode: 'ORD-A7QXM3K2',
    branchName: 'Kandy',
    finalTotal: 1240,
    itemCount: 3,
};

function wrap(state: unknown): (props: { children: ReactNode }) => ReactNode {
    return ({ children }) => (
        <MemoryRouter
            initialEntries={[
                { pathname: FRONTEND_ROUTES.SHOP_CHECKOUT_PAY, state },
            ]}
        >
            <Routes>
                <Route
                    path={FRONTEND_ROUTES.SHOP_CHECKOUT_PAY}
                    element={children}
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION}
                    element={<div data-testid="order-confirmation" />}
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_MY_ORDERS}
                    element={<div data-testid="my-orders" />}
                />
            </Routes>
        </MemoryRouter>
    );
}

describe('usePayhereGateway', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns null state when location.state is missing', () => {
        const { result } = renderHook(() => usePayhereGateway(), {
            wrapper: wrap(null),
        });
        expect(result.current.state).toBeNull();
    });

    it('returns null state when location.state is malformed', () => {
        const { result } = renderHook(() => usePayhereGateway(), {
            wrapper: wrap({ random: 'object' }),
        });
        expect(result.current.state).toBeNull();
    });

    it('returns the gateway state when location.state is valid', () => {
        const { result } = renderHook(() => usePayhereGateway(), {
            wrapper: wrap(validState),
        });
        expect(result.current.state).toEqual(validState);
    });

    it('decrements secondsLeft on each tick', () => {
        const { result } = renderHook(() => usePayhereGateway(), {
            wrapper: wrap(validState),
        });
        expect(result.current.secondsLeft).toBe(2);

        act(() => {
            vi.advanceTimersByTime(750);
        });
        expect(result.current.secondsLeft).toBe(1);

        act(() => {
            vi.advanceTimersByTime(750);
        });
        expect(result.current.secondsLeft).toBe(0);
    });

    it('calls form.submit() when the countdown reaches zero', () => {
        const submit = vi.fn();
        const { result } = renderHook(() => usePayhereGateway(), {
            wrapper: wrap(validState),
        });
        // Attach a fake form element to the ref so the hook can submit it.
        Object.defineProperty(result.current.formRef, 'current', {
            value: { submit } as unknown as HTMLFormElement,
            writable: true,
        });

        act(() => {
            vi.advanceTimersByTime(750 * 2);
        });

        expect(submit).toHaveBeenCalledTimes(1);
    });

    it('cancel stops the timer and prevents submit', () => {
        const submit = vi.fn();
        const { result } = renderHook(() => usePayhereGateway(), {
            wrapper: wrap(validState),
        });
        Object.defineProperty(result.current.formRef, 'current', {
            value: { submit } as unknown as HTMLFormElement,
            writable: true,
        });

        act(() => {
            result.current.cancel();
        });
        act(() => {
            vi.advanceTimersByTime(750 * 5);
        });

        expect(submit).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 3.2 — Run the test, confirm it fails.**

Run: `pnpm run test -- usePayhereGateway`
Expected: FAIL — error `Cannot find module './usePayhereGateway'` (or equivalent).

- [ ] **Step 3.3 — Implement the hook.**

Write `frontend/src/features/payhere-gateway/hooks/usePayhereGateway.ts`:

```ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { GatewayState } from '../types';

function isGatewayState(value: unknown): value is GatewayState {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    if (typeof v.orderCode !== 'string') return false;
    if (typeof v.branchName !== 'string') return false;
    if (typeof v.finalTotal !== 'number') return false;
    if (typeof v.itemCount !== 'number') return false;
    if (!v.payment || typeof v.payment !== 'object') return false;
    const p = v.payment as Record<string, unknown>;
    if (typeof p.actionUrl !== 'string') return false;
    if (!p.fields || typeof p.fields !== 'object') return false;
    return true;
}

const COUNTDOWN_START_SECONDS = 2;
const TICK_MS = 750;

export interface UsePayhereGatewayReturn {
    state: GatewayState | null;
    formRef: React.RefObject<HTMLFormElement | null>;
    secondsLeft: number;
    cancel: () => void;
}

export function usePayhereGateway(): UsePayhereGatewayReturn {
    const navigate = useNavigate();
    const location = useLocation();
    const formRef = useRef<HTMLFormElement | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_START_SECONDS);
    const [cancelled, setCancelled] = useState(false);

    const state = isGatewayState(location.state) ? location.state : null;

    useEffect(() => {
        if (!state || cancelled) return;

        if (secondsLeft <= 0) {
            formRef.current?.submit();
            return;
        }

        const id = setTimeout(() => {
            setSecondsLeft((s) => s - 1);
        }, TICK_MS);
        return () => clearTimeout(id);
    }, [state, cancelled, secondsLeft]);

    const cancel = useCallback(() => {
        setCancelled(true);
        if (!state) return;
        navigate(
            FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION.replace(
                ':code',
                state.orderCode,
            ),
            { replace: true },
        );
    }, [navigate, state]);

    return { state, formRef, secondsLeft, cancel };
}
```

Notes:
- `useRef<HTMLFormElement | null>` is the correct React 19 ref typing for elements that can be momentarily unattached.
- The countdown timing is the constants `COUNTDOWN_START_SECONDS = 2` and `TICK_MS = 750` — total ~1.5 s before submit, matching the spec.
- `cancel` is wrapped in `useCallback` so the cancel handler is stable for the `Button onClick` prop in the card.
- The type guard `isGatewayState` lives in this file because nothing else needs it.

- [ ] **Step 3.4 — Run the tests, confirm they pass.**

Run: `pnpm run test -- usePayhereGateway`
Expected: PASS for all 6 tests.

- [ ] **Step 3.5 — Typecheck.**

Run: `pnpm run typecheck`
Expected: exit code 0.

- [ ] **Step 3.6 — Commit.**

```bash
git add frontend/src/features/payhere-gateway/hooks/
git commit -m "feat(payhere-gateway): add usePayhereGateway hook with countdown + cancel"
```

---

## Task 4: Build `PayhereGatewayCard` component (TDD)

**Files:**
- Create: `frontend/src/features/payhere-gateway/components/PayhereGatewayCard.test.tsx`
- Create: `frontend/src/features/payhere-gateway/components/PayhereGatewayCard.tsx`

- [ ] **Step 4.1 — Write the failing test file.**

Write `frontend/src/features/payhere-gateway/components/PayhereGatewayCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { PayhereGatewayCard } from './PayhereGatewayCard';
import type { GatewayState } from '../types';

const state: GatewayState = {
    payment: {
        provider: 'payhere',
        actionUrl: 'https://sandbox.payhere.lk/pay/checkout',
        fields: { merchant_id: 'M', order_id: 'O123', amount: '1240.00' },
    },
    orderCode: 'ORD-A7QXM3K2',
    branchName: 'Kandy',
    finalTotal: 1240,
    itemCount: 3,
};

function setup(secondsLeft = 2, onCancel = vi.fn()) {
    const ref = createRef<HTMLFormElement>();
    render(
        <MemoryRouter>
            <PayhereGatewayCard
                state={state}
                formRef={ref}
                secondsLeft={secondsLeft}
                onCancel={onCancel}
            />
        </MemoryRouter>,
    );
    return { ref, onCancel };
}

describe('PayhereGatewayCard', () => {
    it('renders the order code', () => {
        setup();
        expect(screen.getByText(/ORD-A7QXM3K2/)).toBeInTheDocument();
    });

    it('renders the formatted total in LKR', () => {
        setup();
        expect(screen.getByText(/LKR 1,240\.00/)).toBeInTheDocument();
    });

    it('renders the item count and branch name', () => {
        setup();
        expect(screen.getByText(/3 items/)).toBeInTheDocument();
        expect(screen.getByText(/Kandy/)).toBeInTheDocument();
    });

    it('renders 1 item singular when itemCount is 1', () => {
        const ref = createRef<HTMLFormElement>();
        render(
            <MemoryRouter>
                <PayhereGatewayCard
                    state={{ ...state, itemCount: 1 }}
                    formRef={ref}
                    secondsLeft={2}
                    onCancel={vi.fn()}
                />
            </MemoryRouter>,
        );
        expect(screen.getByText(/1 item /)).toBeInTheDocument();
    });

    it('renders the visible countdown', () => {
        setup(2);
        expect(screen.getByText(/Redirecting in 2/)).toBeInTheDocument();
    });

    it('calls onCancel when the cancel button is clicked', () => {
        const onCancel = vi.fn();
        setup(2, onCancel);
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('renders the hidden PayHere form with action URL and fields', () => {
        const { ref } = setup();
        expect(ref.current).not.toBeNull();
        expect(ref.current?.getAttribute('action')).toBe(
            'https://sandbox.payhere.lk/pay/checkout',
        );
        // hidden inputs are present
        const hidden = ref.current?.querySelectorAll('input[type="hidden"]');
        expect(hidden?.length).toBe(3);
    });
});
```

- [ ] **Step 4.2 — Run the test, confirm it fails.**

Run: `pnpm run test -- PayhereGatewayCard`
Expected: FAIL — `Cannot find module './PayhereGatewayCard'`.

- [ ] **Step 4.3 — Implement the component.**

Write `frontend/src/features/payhere-gateway/components/PayhereGatewayCard.tsx`:

```tsx
import type { RefObject } from 'react';
import { X } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { PayhereRedirectForm } from '@/features/checkout/components/PayhereRedirectForm';
import type { GatewayState } from '../types';

interface PayhereGatewayCardProps {
    state: GatewayState;
    formRef: RefObject<HTMLFormElement | null>;
    secondsLeft: number;
    onCancel: () => void;
}

export function PayhereGatewayCard({
    state,
    formRef,
    secondsLeft,
    onCancel,
}: PayhereGatewayCardProps) {
    const itemLabel = state.itemCount === 1 ? '1 item' : `${state.itemCount} items`;

    return (
        <div className="max-w-md mx-auto mt-16">
            <div className="bg-surface border border-border rounded-lg shadow-md-token p-8 text-center">
                <div className="flex justify-center mb-6">
                    <Logo />
                </div>

                <p className="text-text-2 text-sm mb-6">
                    Securely redirecting to PayHere&hellip;
                </p>

                <div
                    role="status"
                    aria-label="Redirecting"
                    className="flex justify-center mb-6"
                >
                    <div className="w-10 h-10 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
                </div>

                <p className="text-text-1 font-semibold mb-1">
                    Paying {formatCurrency(state.finalTotal)} for {state.orderCode}
                </p>
                <p className="text-text-2 text-xs mb-6">
                    {itemLabel} &middot; Pickup at {state.branchName}
                </p>

                <p
                    className="text-text-3 text-xs mb-6"
                    aria-live="polite"
                >
                    Redirecting in {secondsLeft}&hellip;
                </p>

                <div className="border-t border-border pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="w-full"
                    >
                        <X size={14} /> Cancel and view order
                    </Button>
                </div>

                <PayhereRedirectForm ref={formRef} payment={state.payment} />
            </div>
        </div>
    );
}
```

Notes:
- The component is presentational only — all timing/state lives in the hook.
- `formatCurrency` is the project's existing helper from `lib/utils` — never inline currency formatting (`rules.md` §5).
- Uses semantic tokens exclusively (`bg-surface`, `border-border`, `text-text-1/2/3`, `text-primary`, `border-border-strong`). No raw colors per `rules.md` §5.
- `shadow-md-token` matches the existing UI primitive shadow token used elsewhere (see `CustomerLayout` user menu).
- `role="status"` + `aria-live="polite"` on the countdown surfaces it to screen readers without interrupting.

- [ ] **Step 4.4 — Run the tests, confirm they pass.**

Run: `pnpm run test -- PayhereGatewayCard`
Expected: PASS for all 7 tests.

- [ ] **Step 4.5 — Typecheck.**

Run: `pnpm run typecheck`
Expected: exit code 0.

- [ ] **Step 4.6 — Commit.**

```bash
git add frontend/src/features/payhere-gateway/components/
git commit -m "feat(payhere-gateway): add PayhereGatewayCard component"
```

---

## Task 5: Build the `PayhereGatewayPage` page

**Why:** Composes the hook and the card, plus the no-state defensive redirect.

**Files:**
- Create: `frontend/src/pages/shop/PayhereGatewayPage.tsx`

- [ ] **Step 5.1 — Write the page.**

Write `frontend/src/pages/shop/PayhereGatewayPage.tsx`:

```tsx
import { Navigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { usePayhereGateway } from '@/features/payhere-gateway/hooks/usePayhereGateway';
import { PayhereGatewayCard } from '@/features/payhere-gateway/components/PayhereGatewayCard';

export function PayhereGatewayPage() {
    const p = usePayhereGateway();

    if (!p.state) {
        return <Navigate to={FRONTEND_ROUTES.SHOP_MY_ORDERS} replace />;
    }

    return (
        <PayhereGatewayCard
            state={p.state}
            formRef={p.formRef}
            secondsLeft={p.secondsLeft}
            onCancel={p.cancel}
        />
    );
}
```

Page size: **15 lines**, well under the `rules.md` §17 cap of 120.

- [ ] **Step 5.2 — Typecheck.**

Run: `pnpm run typecheck`
Expected: exit code 0.

- [ ] **Step 5.3 — Commit.**

```bash
git add frontend/src/pages/shop/PayhereGatewayPage.tsx
git commit -m "feat(payhere-gateway): add PayhereGatewayPage with no-state redirect guard"
```

---

## Task 6: Wire the new route into the router

**Files:**
- Modify: `frontend/src/routes/routes.config.tsx`

- [ ] **Step 6.1 — Add the import.**

In `frontend/src/routes/routes.config.tsx`, near the existing shop page imports (find the line `import { OrderConfirmationPage } from '@/pages/shop/OrderConfirmationPage';`), add directly below it:

```tsx
import { PayhereGatewayPage } from '@/pages/shop/PayhereGatewayPage';
```

- [ ] **Step 6.2 — Add the route entry.**

Inside the `ROUTES` array, find the `SHOP_CHECKOUT` entry. It currently looks like:

```tsx
{
    path: FRONTEND_ROUTES.SHOP_CHECKOUT,
    element: <CheckoutPage />,
    allowedRoles: [UserRole.CUSTOMER],
    layout: 'customer',
},
```

Insert **directly after** that closing brace, before the `SHOP_ORDER_CONFIRMATION` entry:

```tsx
{
    path: FRONTEND_ROUTES.SHOP_CHECKOUT_PAY,
    element: <PayhereGatewayPage />,
    allowedRoles: [UserRole.CUSTOMER],
    layout: 'customer-public',
},
```

Notes:
- `customer-public` layout matches the spec — minimal chrome, same layout `OrderConfirmationPage` uses (it does **not** require a branch to be set, which is irrelevant here but consistent).
- The route stays role-gated to `CUSTOMER` so staff cannot accidentally navigate to it.

- [ ] **Step 6.3 — Typecheck and lint.**

Run: `pnpm run typecheck && pnpm run lint`
Expected: both exit code 0.

- [ ] **Step 6.4 — Commit.**

```bash
git add frontend/src/routes/routes.config.tsx
git commit -m "feat(checkout): wire /shop/checkout/pay route to PayhereGatewayPage"
```

---

## Task 7: Make `useCheckout` navigate to the gateway page

**Why:** Replaces the inline `payherePayload` state with a route navigation. Drops three things from the hook's API: `payherePayload`, the empty-cart-with-payload allowance, and the side-effect of rendering a form on `/shop/checkout`.

**Files:**
- Modify: `frontend/src/features/checkout/hooks/useCheckout.ts`

- [ ] **Step 7.1 — Update `useCheckout`.**

Open `frontend/src/features/checkout/hooks/useCheckout.ts`. Make these specific changes:

**A. Remove the `payherePayload` state.** Delete this block (around the existing `useState` group):

```ts
const [payherePayload, setPayherePayload] =
    useState<IPayhereCheckoutPayload | null>(null);
```

**B. Remove the now-unused import.** In the import block near the top, change:

```ts
import type {
    CustomerOrderPaymentMode,
    IPayhereCheckoutPayload,
} from '@/types';
```

to:

```ts
import type { CustomerOrderPaymentMode } from '@/types';
```

**C. Add the branch-name lookup** so we can pass `branchName` to the gateway page. The `branch` memo already resolves the branch from `branches`; capture `branchName` after it. Locate:

```ts
const branch = useMemo(
    () => branches.find((b) => b.id === branchId) ?? null,
    [branches, branchId],
);
```

(no change to that block — but we will use `branch?.name ?? ''` below.)

**D. Replace the success path in `onSubmit`.** Find this exact block:

```ts
if (result.payment) {
    setPayherePayload(result.payment);
    return;
}
navigate(
    FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION.replace(
        ':code',
        result.order.orderCode,
    ),
);
```

Replace it with:

```ts
if (result.payment) {
    navigate(FRONTEND_ROUTES.SHOP_CHECKOUT_PAY, {
        state: {
            payment: result.payment,
            orderCode: result.order.orderCode,
            branchName: branch?.name ?? '',
            finalTotal: Number(result.order.finalTotal),
            itemCount: items.length,
        },
    });
    return;
}
navigate(
    FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION.replace(
        ':code',
        result.order.orderCode,
    ),
);
```

Notes:
- The `state` payload shape exactly matches the `GatewayState` type from Task 1.
- We read `items.length` **before** the `clearShopCart` dispatch above it — that dispatch ran before the payment branch, but `items` is a stable selector value captured at the start of `onSubmit`. (React's batched updates do not re-evaluate the selector synchronously.) If lint flags this, also capture the count at the top of the function: `const cartItemCount = items.length;` and use `cartItemCount` here.

**E. Remove `payherePayload` from the return value.** At the bottom `return { ... }` block, delete this line:

```ts
payherePayload,
```

- [ ] **Step 7.2 — Typecheck.**

Run: `pnpm run typecheck`
Expected: exit code 0.

This will surface a downstream error in `CheckoutPage.tsx` referencing `p.payherePayload` — that is fixed in Task 8. If typecheck shows ONLY errors about `payherePayload` in `CheckoutPage.tsx`, proceed to Task 8 without commit yet. Otherwise, fix the surfaced error before continuing.

- [ ] **Step 7.3 — Stage the file (no commit yet).**

```bash
git add frontend/src/features/checkout/hooks/useCheckout.ts
```

The commit happens after Task 8 because the two changes are coupled (the hook return and the page consumption).

---

## Task 8: Clean up `CheckoutPage.tsx`

**Files:**
- Modify: `frontend/src/pages/shop/CheckoutPage.tsx`

- [ ] **Step 8.1 — Strip the inline form and its guards.**

Open `frontend/src/pages/shop/CheckoutPage.tsx`. Make these specific changes:

**A. Remove the `PayhereRedirectForm` import.** Delete this line:

```ts
import { PayhereRedirectForm } from '@/features/checkout/components/PayhereRedirectForm';
```

**B. Simplify the empty-cart guard.** Change:

```tsx
if (p.items.length === 0 && !p.payherePayload) {
    return (
        <div className="text-center py-24 text-text-3 text-sm">
            Your cart is empty.
        </div>
    );
}
```

to:

```tsx
if (p.items.length === 0) {
    return (
        <div className="text-center py-24 text-text-3 text-sm">
            Your cart is empty.
        </div>
    );
}
```

**C. Remove the inline `<PayhereRedirectForm>`.** Delete this block:

```tsx
{p.payherePayload && (
    <PayhereRedirectForm payment={p.payherePayload} />
)}
```

**D. Simplify the submit-button disabled state.** Change:

```tsx
disabled={p.submitting || !p.branchId || !!p.payherePayload}
```

to:

```tsx
disabled={p.submitting || !p.branchId}
```

- [ ] **Step 8.2 — Typecheck + lint.**

Run: `pnpm run typecheck && pnpm run lint`
Expected: both exit code 0.

- [ ] **Step 8.3 — Run the full test suite.**

Run: `pnpm run test`
Expected: PASS — at least the hook tests, card tests, and the existing `notificationUtils.test.ts`.

- [ ] **Step 8.4 — Commit the coupled change.**

```bash
git add frontend/src/pages/shop/CheckoutPage.tsx
git commit -m "feat(checkout): redirect online payments to gateway page"
```

This is the commit that flips the user-facing behaviour. Before: silent auto-submit. After: branded gateway page.

---

## Task 9: Full verify and manual end-to-end smoke test

**Why:** PR-1 spans 8 commits across several files. The final verify proves nothing slipped, and the manual smoke confirms the new flow renders.

- [ ] **Step 9.1 — Run the full verify pipeline.**

Run from `frontend/`: `pnpm run verify`
Expected: exit code 0. This runs `typecheck → lint → test → build` in sequence.

If any step fails: read the failure, fix the issue inline (do not silence — `rules.md` §10 forbids swallowing errors), then re-run `pnpm run verify`.

- [ ] **Step 9.2 — Start the dev stack.**

In one terminal (from repo root):

```bash
docker compose up -d postgres
```

In a second terminal, from `backend/`:

```bash
pnpm run start:dev
```

In a third terminal, from `frontend/`:

```bash
pnpm run dev
```

Expected: backend listens on `:3000`, frontend on `:5173`.

If `PAYHERE_MERCHANT_ID` / `PAYHERE_MERCHANT_SECRET` are not set in `backend/.env`, the **online** flow will throw 503 at order creation time. The manual flow still works without those env vars. Note this in the PR description.

- [ ] **Step 9.3 — Manual smoke: pay-at-pickup unaffected.**

1. Log in as a customer.
2. Browse `/shop`, add 2 items to the cart.
3. Open `/shop/checkout`. Confirm "Pay at pickup" is the default segment.
4. Submit the form.
5. Expect navigation to `/shop/orders/:code` showing the QR.

This regression-tests that we did not break the manual path.

- [ ] **Step 9.4 — Manual smoke: online payment shows the gateway page.**

1. Add items, open `/shop/checkout`.
2. Switch the segment to "Pay online".
3. Submit.
4. Expect navigation to `/shop/checkout/pay` (URL bar changes).
5. Expect the page to show: logo, "Securely redirecting…", spinner, total + order code, "3 items · Pickup at <Branch>", and "Redirecting in 2…" decrementing to 1 then 0.
6. After ~1.5 s, expect a redirect to the configured PayHere sandbox URL (or the real PayHere if you have the env set).

If `PAYHERE_*` env vars are absent, expect the order creation in Step 7.3 to surface a backend error toast on `/shop/checkout` — the gateway page never loads. That is expected and out of scope for this PR.

- [ ] **Step 9.5 — Manual smoke: cancel works.**

Repeat steps 1–3 of Step 9.4. Within the 1.5 s window, click "Cancel and view order".
Expect navigation to `/shop/orders/<orderCode>` with the existing confirmation page rendering the pending order.

- [ ] **Step 9.6 — Manual smoke: direct route hit redirects.**

Without going through checkout, paste `http://localhost:5173/shop/checkout/pay` into the address bar.
Expect immediate redirect to `/shop/my-orders` (the defensive `<Navigate>` fallback).

- [ ] **Step 9.7 — Final summary commit (no code changes).**

If steps 9.1–9.6 all pass, there is no further commit. The branch is ready for PR.

Push and open the PR:

```bash
git push -u origin dinesh
gh pr create --title "feat(checkout): branded PayHere redirect gateway page" --body "$(cat <<'EOF'
## Summary
- Replaces the silent hidden-form auto-submit on online checkout with a dedicated `/shop/checkout/pay` page that shows order summary, a visible countdown, and a cancel-back path.
- `PayhereRedirectForm` is now a pure forwardRef-based render; the new `usePayhereGateway` hook owns submission timing.
- `useCheckout` navigates to the gateway page with order details in router state instead of rendering the form inline.

## Test plan
- [ ] `pnpm run verify` green in `frontend/`
- [ ] Manual: pay-at-pickup still navigates to `/shop/orders/:code`
- [ ] Manual: pay-online navigates to `/shop/checkout/pay`, shows countdown, auto-redirects to PayHere
- [ ] Manual: cancel button navigates to `/shop/orders/:code` with the pending order
- [ ] Manual: pasting `/shop/checkout/pay` directly redirects to `/shop/my-orders`

## Notes
- No backend change. No migration change.
- Requires `PAYHERE_MERCHANT_ID` + `PAYHERE_MERCHANT_SECRET` in the dev `.env` to exercise the online flow end-to-end.
- Follow-up PRs (per `docs/superpowers/specs/2026-05-13-shop-ux-overhaul-design.md`): PR-2 loyalty surfaces, PR-3 shop polish.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

This step ships PR-1.

---

## Self-review

**Spec coverage (against `docs/superpowers/specs/2026-05-13-shop-ux-overhaul-design.md` §4):**

| Spec requirement | Task |
|---|---|
| New `/shop/checkout/pay` route under `customer-public` layout | Task 1, Task 6 |
| `usePayhereGateway` hook with 2-tick × 750 ms countdown | Task 3 |
| `PayhereGatewayCard` with logo, summary, countdown, cancel button | Task 4 |
| `PayhereGatewayPage` with no-state redirect to `/shop/my-orders` | Task 5 |
| `useCheckout` navigates to gateway instead of inline state | Task 7 |
| `CheckoutPage` cleanup | Task 8 |
| `PayhereRedirectForm` refactor to forwardRef without auto-submit | Task 2 |
| Cancel → `/shop/orders/:code` (existing confirmation page) | Task 3 (hook), exercised in Task 9.5 |
| Tests for hook (countdown, cancel, submit, malformed state) | Task 3 |
| Tests for card (renders summary, calls cancel, hidden form fields) | Task 4 |
| Edge cases (direct hit, refresh, cancel) | Task 5 (guard), Task 9.4–9.6 (manual) |

All spec items mapped to a task.

**Placeholder scan:** no `TBD`, `TODO`, `???`, "implement later", "fill in", or "similar to" strings in this plan. Every code step contains the complete code an engineer needs.

**Type consistency:**
- `GatewayState` defined in Task 1 with five fields: `payment`, `orderCode`, `branchName`, `finalTotal`, `itemCount`. The hook (Task 3) reads exactly these. The card (Task 4) reads `state.orderCode`, `state.payment`, `state.finalTotal`, `state.branchName`, `state.itemCount` — match. The `useCheckout` payload (Task 7) writes all five fields with matching types. Consistent.
- `UsePayhereGatewayReturn` interface in Task 3 declares `state`, `formRef`, `secondsLeft`, `cancel`. The card props (Task 4) and the page composition (Task 5) consume `state`, `formRef`, `secondsLeft`, `cancel` (renamed to `onCancel` at the card boundary). Consistent.
- `PayhereRedirectForm`'s `forwardRef` signature in Task 2 (`forwardRef<HTMLFormElement, PayhereRedirectFormProps>`) matches the `RefObject<HTMLFormElement | null>` consumer in Task 4.
- `FRONTEND_ROUTES.SHOP_CHECKOUT_PAY` referenced in Tasks 3, 6, 7 — added in Task 1.

No inconsistencies found.
