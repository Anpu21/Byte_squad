# Default seeded accounts (dev only)

> Loaded on demand from [`CLAUDE.md`](../CLAUDE.md).

| Role | Email | Password | Branch |
|---|---|---|---|
| Admin | `admin@ledgerpro.com` | `Admin@123` | Main |
| Manager | `manager.main@ledgerpro.com` | `Manager@123` | Main |
| Cashier | `cashier@ledgerpro.com` | `Cashier@123` | Main |
| Worker | `worker@ledgerpro.com` | `Worker@123` | Main |

Plus admin/manager/cashier/worker accounts for Downtown and Suburban branches (e.g. `worker2@ledgerpro.com`, `worker3@ledgerpro.com`, all `Worker@123`). Workers are branch-floor staff who act as couriers for stock-transfer delivery; each is linked to a `Courier` Employee row so attendance + working hours work. Full table in `README.md`.

> Customer accounts (`role=CUSTOMER`) carry a `current_balance` column on the `users` table — their running AR balance from the POS multi-tender credit flow. Movements are journaled in `credit_transactions` (charge / settlement / refund). Customers self-register via the storefront; the seeder does not create customer rows.
