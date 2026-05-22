# Supplier Purchase Report Page

Frontend file: `frontend/src/pages/Inventory/Reports/SupplierPurchaseReport.jsx`

## API used

- `GET /api/inventory/reports/supplier-purchases`

## Backend function

- `reportController.getSupplierPurchaseReport`

## Backend SQL logic

- groups purchase orders by supplier
- computes:
  - total order count
  - total spend per supplier
- sorts by highest spend first

## UI behavior

- renders supplier-wise spend summary
- supports PDF export

## Tables touched

- `SUPPLIER`
- `PURCHASE_ORDER`
