# Sales Stock Page

Frontend file: `frontend/src/pages/Inventory/SalesStock.jsx`

## What this page does

Shows finished goods stock in shop context:

- stock overview table
- reserved quantity from active unpaid sales
- recent stock-in list
- recent stock-out list

## Frontend flow

Uses `Promise.all` to call:

- `GET /api/inventory/sales/stock-overview`
- `GET /api/inventory/sales/recent-stock-in`
- `GET /api/inventory/sales/recent-stock-out`

Then fills:

- metrics cards
- finished goods table
- two movement tables

## Backend endpoints

From `salesRoutes.js` and `salesController.js`.

## Backend logic summary

- `getSalesStockOverwiew`:
  - reads `Inventory` for `Location='Shop'`
  - joins product details
  - gets reserved qty by raw SQL (`sale_item` + `sales`)
  - computes available = total - reserved.
- `getRecentStockIn`:
  - raw SQL on `stock_movement` filtered to in-types.
- `getRecentStockOut`:
  - raw SQL on `stock_movement` filtered to out-types.

## DB/model usage

- `Inventory`
- `Product`
- `Production`
- raw SQL tables: `stock_movement`, `sale_item`, `sales`

## Evaluation talking point

This page is analytical: it combines transactional inventory + order reservation to show real available sellable stock.
