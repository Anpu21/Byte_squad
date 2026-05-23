# Purchase Report Page

Frontend file: `frontend/src/pages/Inventory/Reports/PurchaseReport.jsx`

## API used

- `GET /api/inventory/reports/purchases`

## Backend function

- `reportController.getPurchaseReport`

## Backend SQL logic

- joins purchase orders with suppliers
- returns PO number, supplier, date, amount, payment/status
- newest orders first

## UI behavior

- displays purchase summary table
- print and PDF export supported

## Tables touched

- `PURCHASE_ORDER`
- `SUPPLIER`
