# Inventory Dashboard Page

Frontend file: `frontend/src/pages/Inventory/InventoryDashboard.jsx`

## What this page does

Shows summary cards, low stock chart, distribution pie, stock alerts, and latest transfers.

## Frontend flow

1. On mount, `fetchData()` runs.
2. Calls `GET /api/inventory/dashboard-stats`.
3. Stores response in `data` state:
   - `stockLevel`
   - `distribution`
   - `alerts`
   - `transfers`
   - `summary`
4. Passes data to child components:
   - `InventoryMetrics`
   - `StockChart`
   - `DistributionPie`
   - `StockAlerts`
   - `StockTransfers`

## Backend endpoint

- Route: `routes/inventory/inventory.js`
- Endpoint: `GET /dashboard-stats`
- Controller: `inventoryController.getDashboardStats`

## Backend logic summary

`getDashboardStats` builds one combined payload:

- Top critical stock items (product + summed inventory)
- Low-stock alert list (`total <= Min_Stock`)
- Product distribution by `P_Type`
- Recent transfer history from `STOCK_TRANSFER`
- Summary counters (company items, other items, production stock, shop stock, alerts count)

## DB/model usage

- `Product`
- `Inventory`
- `Supplier`
- `StockTransfer`

## End-to-end data flow

UI mount -> axios call -> Express route -> controller aggregates multiple queries -> JSON response -> widgets render.
