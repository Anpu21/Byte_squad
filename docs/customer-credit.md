# Customer Credit / Store-Tab ("Khata")

Digital loan-book for **physical / walk-in** customers: buy now, pay later.
The flow is **cashier → manager → customer**. A cashier enrolls a walk-in once;
a manager approves and sets a **credit limit** + **repayment term**; after that
the customer shops on credit until the limit, and repayments reduce the balance.

This is a dedicated module that **coexists** with the existing User-bound
receivables (`/accounting/receivables`). Credit sales are stamped with
`Sale.creditAccountId` (never `customerUserId`), so the two ledgers never
overlap. Walk-ins can't be `User`s (email + password are required), so they get
their own `CreditAccount` instead.

## Roles & decisions

| Concern | Behaviour |
|---|---|
| Over-limit purchase | **Blocked**; a manager authorizes at the counter via a short-lived step-up token (recorded as `Sale.creditOverrideByUserId`). |
| Overdue bills | **Warn but allow** — overdue shows in ageing/KPIs; the credit sale still proceeds. |
| Who records repayments | **Cashier, manager & admin** (branch-scoped). |
| Branch scope | **Per-branch** — each branch manager owns their credit customers; account, limit, balance, and lookups are branch-scoped. Admins are cross-branch. |

## Backend (`backend/src/modules/credit-accounts/`)

- **`CreditAccount`** (`credit_accounts`) — the khata: `accountNo` (`KH-…`),
  `holderName`, `phone`, `nic?`, `address?`, `branchId` (owner), `status`,
  `creditLimit?`, `creditTermDays?`, `currentBalance`, `requestedCreditLimit?`,
  workflow fields (`requestedByUserId`, `reviewedByUserId?`, notes), timestamps.
  Unique `(branchId, phone)`. Status enum (varchar-backed):
  `PENDING · ACTIVE · REJECTED · SUSPENDED · CLOSED`.
- **`CreditAccountTransaction`** (`credit_account_transactions`) — append-only
  loan-book ledger: `Credit_Taken` / `Credit_Paid`, `amount`, `runningBalance`,
  `referenceNo`, optional `saleId`.
- **`Sale` additions** — `creditAccountId?`, `dueDate?` (= saleDate +
  `creditTermDays`), `creditOverrideByUserId?`.

### Approval state machine

```
PENDING --approve(limit, termDays)--> ACTIVE      PENDING --reject(reason)--> REJECTED
ACTIVE  --suspend--> SUSPENDED                     ACTIVE/SUSPENDED --close--> CLOSED
```

### Endpoints (`/api/v1/credit-accounts`)

| Action | Route | Roles |
|---|---|---|
| Submit request (enrollment form) | `POST /` | Cashier, Manager, Admin |
| Search ACTIVE (POS picker) | `GET /search` | Cashier, Manager, Admin |
| Authorize over-limit (step-up) | `POST /authorize-override` | Cashier, Manager, Admin\* |
| List (balances + ageing) | `GET /` | Manager, Admin |
| Get / statement | `GET /:id`, `GET /:id/statement` | Manager, Admin |
| Approve / Reject / Suspend / Close / edit limit+term | `PATCH /:id/approve|reject|suspend|close`, `PATCH /:id` | Manager, Admin |
| Receive repayment | `POST /:id/payments` | Cashier, Manager, Admin |

\* The endpoint is called from the cashier's session but **validates the
supplied manager/admin credentials** (bcrypt) against a MANAGER/ADMIN of the
account's branch, then mints a ~5-minute JWT (`scope: credit_override`) that the
checkout passes back as `creditOverrideToken`.

### POS integration

Inside the existing checkout transaction, a credit sale calls
`creditAccounts.prepareCharge` (locks the account, asserts ACTIVE + branch,
enforces the limit unless a valid override token is present), stamps the sale's
due date, then `commitChargeWithManager` appends the `Credit_Taken` row and
advances `currentBalance`. Voids call `reverseChargeForSale`. Repayments
(`receivePayment`) FIFO-settle the oldest-due bills and post a `CREDIT` ledger
entry; ageing buckets key off `due_date` (notDue / 1–30 / 31–60 / 61–90 / 90+).

## Frontend

- **Data layer** — `types/credit-accounts/*`, `services/credit-accounts.service.ts`,
  `queryKeys.creditAccounts`, hooks in `features/credit-accounts/hooks/`.
- **Manager surface** — `/credit-accounts` (Finance nav, ADMIN+MANAGER):
  a `WorkspacePage` with **Approvals** (PENDING inbox) and **Accounts**
  (balances + ageing KPIs), approve/reject modals, and a statement modal
  (ledger + unpaid bills + FIFO repayment + limit/term edits + suspend/close).
- **POS** — `PosCreditAccountCard` (search/attach + inline enroll), a
  Cash/On-credit tender toggle (`PosCreditTenderPanel`), and
  `PosManagerOverrideModal` for over-limit charges. `'Credit'` emits
  `payment.creditAmount`; the payload carries top-level `creditAccountId` +
  `creditOverrideToken`.

## Follow-ups (not yet built)

- Show the credit account + due date on the printed receipt / bill template.
- Reactivate a SUSPENDED account from the statement modal (BE supports
  `SUSPENDED --approve--> ACTIVE`; the UI currently only suspends/closes).
- Persist an attached credit account across hold/resume of a held bill.
- Earn loyalty points on credit purchases (loyalty is currently skipped when a
  sale is charged on credit, to avoid the `creditAccountId` + `customerUserId`
  conflict).
- Optional split tender (part cash now, remainder on credit) — the tender math
  already supports it; the cashier UI is single-method today.
