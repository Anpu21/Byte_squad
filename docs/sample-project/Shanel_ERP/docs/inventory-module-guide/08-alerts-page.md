# Alerts Page

Frontend file: `frontend/src/pages/Inventory/AlertsPage.jsx`

## What this page does

Shows two alert categories:

- stock alerts (low/out-of-stock)
- expiry alerts (approved production nearing expiry)

## Frontend flow

On mount:

- `GET /api/inventory/dashboard-stats` for stock alerts
- `GET /api/production/stock-overview` for expiry alerts

Then page filters by tab:

- all stock alerts
- low stock subset
- expiry subset (<= 60 days)

## Backend data sources

- Stock alert data generated in `inventoryController.getDashboardStats`.
- Expiry data derived from `productionController.getProductionData` and filtered in frontend.

## DB/model usage behind APIs

- From dashboard API: `Product`, `Inventory`, `Supplier`
- From production API: `Production`, `Product`

## End-to-end flow

Page mount -> 2 parallel API calls -> client-side tab filters and badges -> actionable list with supplier contact for replenishment.
