# Production Report Page

Frontend file: `frontend/src/pages/Inventory/Reports/ProductionReport.jsx`

## API used

- `GET /api/inventory/reports/production`

## Backend function

- `reportController.getProductionReport`

## Backend SQL logic

- pulls approved production records
- joins product master data
- returns production date, batch no, qty, cost, status

## UI behavior

- table with produced batch details
- client-side efficiency progress bar visualization
- print and PDF export supported

## Tables touched

- `PRODUCTION`
- `PRODUCT`
