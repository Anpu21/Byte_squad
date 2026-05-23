# Stock Transfer Page

Frontend file: `frontend/src/pages/Inventory/StockTransfer.jsx`

## What this page does

Transfers stock between locations and shows transfer history + live location quantities.

## Frontend flow

1. Load transfer history:
   - `GET /api/inventory/transfers/history`
2. Load products:
   - `GET /api/inventory/products`
3. For each product, fetch location split:
   - `GET /api/inventory/product/:productId/locations`
4. Create/edit transfer from modal:
   - `POST /api/inventory/transfers/create`
   - `PUT /api/inventory/transfers/:ST_ID`

## Backend endpoints

From `transferRoutes.js`:

- `GET /history`
- `POST /create`
- `PUT /:ST_ID`

Also uses inventory endpoint from `inventoryController`:

- `GET /product/:productId/locations`

## Backend logic highlights

- `createTransfer` (transactional):
  - validates source stock sufficiency
  - deducts from source inventory rows
  - adds to destination row (creates if needed)
  - writes `StockTransfer` history row.
- `updateTransfer` (transactional):
  - reverses previous transfer effect first
  - validates and applies new transfer
  - updates transfer record.
- `getTransferHistory` returns transfer list + computed metrics.

## DB/model usage

- `Inventory`
- `StockTransfer`
- `Product`

## Critical explanation for viva

Editing a transfer is not a simple overwrite.  
Controller first rolls back old quantities, then applies new values to keep inventory accurate.
