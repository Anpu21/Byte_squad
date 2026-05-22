# Transfer Report Page

Frontend file: `frontend/src/pages/Inventory/Reports/TransferReport.jsx`

## API used

- `GET /api/inventory/reports/transfers`

## Backend function

- `reportController.getTransferReport`

## Backend SQL logic

- joins transfer rows with product details
- returns date, product, from/to locations, qty, status
- newest transfer first

## UI behavior

- renders stock movement history table
- supports PDF export

## Tables touched

- `STOCK_TRANSFER`
- `PRODUCT`
