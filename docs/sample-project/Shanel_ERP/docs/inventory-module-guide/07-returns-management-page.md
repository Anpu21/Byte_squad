# Returns Management Page

Frontend file: `frontend/src/pages/Inventory/ReturnsManagement.jsx`

## What this page does

Processes and tracks returned items:

- search invoice
- inspect invoice items
- process return as good/bad quantities
- update/delete return logs

## Frontend flow

- Load returns: `GET /api/inventory/returns`
- Create return from modal: `POST /api/inventory/returns/process`
- Edit return: `PUT /api/inventory/returns/:RT_ID`
- Delete return: `DELETE /api/inventory/returns/:RT_ID`
- Invoice search helpers in modal:
  - `GET /api/inventory/invoice/:invoiceNo`
  - `GET /api/inventory/invoice-details/:saleId`

## Backend endpoints and logic

Handled by `returnController.js`.

- `processReturn`:
  - validates `Good_Qty + Bad_Qty == Total_Return_Qty`
  - creates one/two `ProductReturn` rows
  - if `Restock=1`, adds quantity back to `Shop` inventory.
- `getReturnLogs`:
  - raw SQL join on `product_return`, `product`, `sales`, `customer`.
- `updateReturn`:
  - reverses old inventory impact and applies new values.
- `deleteReturn`:
  - reverses inventory if deleted row had restock.

## DB/model usage

- `ProductReturn`
- `Inventory`
- raw SQL tables: `sales`, `sale_item`, `customer`, `unit_conversion`

## Important exam point

Returns are split logically by quality:  
good returns can restore stock; bad returns stay out of inventory.
