# Stock Adjustment Page

Frontend file: `frontend/src/pages/Inventory/StockAdjustment.jsx`

## What this page does

Maintains adjustment logs for stock corrections:

- damage
- expired
- theft
- stock take

Includes add, edit, delete with inventory reversal safety.

## Frontend flow

1. On load: `GET /api/inventory/adjustments`.
2. Add from modal:
   - `POST /api/inventory/adjustments/adjust`
3. Edit from modal:
   - `PUT /api/inventory/adjustments/:id`
4. Delete row:
   - `DELETE /api/inventory/adjustments/:id`

## Backend endpoints

Handled by `adjustmentController.js`.

## Backend logic highlights

- `createAdjustment`:
  - reads current inventory quantity
  - computes `Difference` and `Physical_Qty`
  - writes adjustment row + updates inventory in one transaction.
- `updateAdjustment`:
  - reverses old adjustment effect
  - applies new effect
  - updates both adjustment row and inventory.
- `deleteAdjustment`:
  - reverses adjustment effect on inventory
  - deletes adjustment row.

## DB/model usage

- `StockAdjustment`
- `Inventory`
- `Product`

## End-to-end flow

UI modal submit -> adjustment API -> transactional correction in controller -> adjustment log + updated inventory -> table refresh.
