# Default seeded accounts (dev only)

> Loaded on demand from [`CLAUDE.md`](../CLAUDE.md).

| Role | Email | Password | Branch |
|---|---|---|---|
| Admin | `admin@ledgerpro.com` | `Admin@123` | Main |
| Manager | `manager.main@ledgerpro.com` | `Manager@123` | Main |
| Cashier | `cashier@ledgerpro.com` | `Cashier@123` | Main |
| Worker | `worker@ledgerpro.com` | `Worker@123` | Main |

Plus admin/manager/cashier/worker accounts for Downtown and Suburban branches (e.g. `worker2@ledgerpro.com`, `worker3@ledgerpro.com`, all `Worker@123`). Workers are branch-floor staff who act as couriers for stock-transfer delivery; each is linked to a `Courier` Employee row so attendance + working hours work. Full table in `README.md`.

> Customer accounts (`role=CUSTOMER`) carry a `current_balance` column on the `users` table — their running AR balance from the POS multi-tender credit flow. Movements are journaled in `credit_transactions` (charge / settlement / refund). The seeder creates four demo customers (`customer.ayesha@ledgerpro.com`, `customer.nuwan@…`, `customer.malini@…`, `customer.dinesh@…`, all `Customer@123`); real customers self-register via the storefront.

## Demo data per feature (dev seed)

Where to look after a fresh boot — every row below is created by the seed:

| Feature | Where | What's seeded |
|---|---|---|
| Suppliers & purchases | Purchases workspace | 2 suppliers, a sent PO, 2 GRNs (one ~15 days overdue → ageing has data), a partial bill-by-bill payment, a debit note |
| Discount schemes | `/admin/schemes` + the POS till | 4 rules: storewide bulk deal (3+ qty → 10%), main-branch category week (5%), 2-day flash sale (15%), and a paused expired promo |
| Shifts / Z-report | POS → shift controls | Yesterday's closed drawer for Emma Frost (LKR 50.50 short); open today's shift yourself to try the live flow |
| Receivables (AR) | Receivables page | Ayesha: 3 credit sales across the 90+/31–60/0–30 ageing buckets, LKR 50,000 limit, plus a real FIFO repayment (statement shows the settlement); Dinesh: one half-paid bill, no limit |
| Journal vouchers | Financial reports → Journals | Owner capital injection (Cash ↔ Equity) and a utilities payment (OpEx ↔ Bank) |
| Fiscal periods | Financial reports → Periods | The month five months back is locked |
| Salesman report | `/reports` | Aggregates the existing seeded sales per cashier |
| Barcode labels | Inventory → Labels | Uses the seeded product barcodes directly |
