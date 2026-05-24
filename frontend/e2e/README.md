# Cashier POS — E2E smoke

Playwright is **not installed** in this workspace at the close of Phase 14.
Wiring it up is project infrastructure work that lives outside the Shanel
port plan. The cashier-POS smoke is therefore captured manually below; the
test scaffold is preserved as `cashier-pos.spec.ts.todo` so a future
infrastructure pass can wire it without rewriting the scenario.

## Manual smoke (run after Phase 14 commits)

Prerequisites:

```bash
docker compose up -d postgres
pnpm --filter backend start:dev &
pnpm --filter frontend dev &
```

1. Open `http://localhost:5173/login`.
2. Sign in as `cashier1@ledgerpro.dev` / `Cashier@123`.
3. Navigate to `/pos`. Confirm the three-region layout: item table on the
   left, customer info + information box + invoice totals + action buttons
   on the right.
4. Type `Bread` (or any seeded product) into the search box. Pick the first
   result. Verify the row appears in the cart with retail price, qty=1,
   tax + discount columns editable.
5. Click **Charge** (or press **F12**). Confirm the payment modal opens
   with the cash tender field pre-filled to the invoice total.
6. Press **Confirm**. Expect:
   - The modal closes.
   - The cart clears.
   - The browser print dialog appears (the 80mm receipt template renders).
   - The cashier session strip on the right refreshes the `Next invoice`
     preview to the next number in the sequence.
7. Press **F10**. The right-edge recent-sales sidebar slides in; the sale
   you just created should appear at the top with a Paid badge.
8. Click the new sale row. The bill-preview modal opens with the same
   receipt body.
9. Press **F5** (clear cart) on an empty cart — the action is disabled.
   Add an item, press **F5**, confirm in the prompt. The cart clears.

## Future automation

Once Playwright is wired into the project, port the steps above into
`cashier-pos.spec.ts` using these selectors that the assembled UI already
exposes:

- `page.getByLabel('Email')` / `page.getByLabel('Password')`
- `page.getByRole('button', { name: 'Sign in' })`
- `page.getByPlaceholder(/search by code or name/i)`
- `page.getByRole('button', { name: /Charge|F12/i })`
- `page.getByLabel(/cash tendered/i)`
- `page.getByText(/INV-\d{4}-\d{6}/)`

The scaffold lives at `cashier-pos.spec.ts.todo` in this directory.
