# Inventory Reports Hub Page

Frontend file: `frontend/src/pages/Inventory/Reports/InventoryReports.jsx`

## What this page does

Acts as a report launcher.  
Clicking a report card loads table data dynamically and allows PDF export.

## Frontend flow

1. User clicks a report card.
2. `loadReport(report)` calls endpoint from that card.
3. Response fills generic table using column map by report key.
4. Export uses `generatePDF(...)`.

## Report endpoints used

- `/api/inventory/reports/current-stock`
- `/api/inventory/reports/production`
- `/api/inventory/reports/purchases`
- `/api/inventory/reports/transfers`
- `/api/inventory/reports/expiry`
- `/api/inventory/reports/supplier-purchases`

## Backend mapping

All above endpoints are in `reportRoutes.js` -> `reportController.js`.

## DB strategy

`reportController` mainly uses raw SQL per report type, returning `{ success, data }`.

## Why this page is useful in evaluation

You can explain this as a reusable reporting UI:

- single table renderer
- endpoint-driven content
- shared PDF export logic
- no repeated report-page boilerplate.
