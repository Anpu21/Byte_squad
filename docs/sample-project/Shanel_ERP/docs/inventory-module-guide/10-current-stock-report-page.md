# Current Stock Report Page

Frontend file: `frontend/src/pages/Inventory/Reports/CurrentStockReport.jsx`

## API used

- `GET /api/inventory/reports/current-stock`

## Backend function

- `reportController.getCurrentStockReport`

## Backend SQL logic

Aggregates stock by product and location:

- production stock sum
- shop stock sum
- total stock sum

## UI behavior

- renders table of product code/name and stock columns
- status badge (`Low`/`Good`) based on `Total_Stock`
- supports print and PDF export

## Tables touched

- `PRODUCT`
- `INVENTORY`
