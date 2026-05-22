# Product Page (Company/Other/Raw)

Frontend file: `frontend/src/pages/Inventory/ProductPage.jsx`

## What this page does

Manages product master data:

- list/search/filter products
- add/edit/delete product
- barcode print
- quick stock add
- supplier + unit conversion support via modals

## Frontend flow

1. `fetchProducts()` calls `GET /api/inventory/products`.
2. Products stored in local state and filtered by:
   - `typeFilter`
   - search
   - active stock
   - company source (Shanel/Ishara)
3. Create/update done in `ProductModal`:
   - `POST /api/inventory/products`
   - `PUT /api/inventory/products/:id`
4. Delete calls `DELETE /api/inventory/products/:id`.
5. Quick update quantity posts to adjustment API:
   - `POST /api/inventory/adjustments/adjust`
   - uses `Adjustment_Type = Stock_Take`

## Backend endpoints involved

- Product endpoints in `inventoryController`:
  - `GET /products`
  - `POST /products`
  - `PUT /products/:id`
  - `DELETE /products/:id`
- Unit helper endpoints:
  - `GET /available-base-units`
  - `GET /available-alternative-units`
- Supplier endpoints:
  - `GET /suppliers`
  - `POST /suppliers`
- Quick stock:
  - `POST /adjustments/adjust`

## Backend logic highlights

- `getProducts`: returns product fields + aggregated `stockCount` + unit conversions.
- `addProduct`:
  - supports image upload (`upload.single('image')`)
  - creates base and alternative unit conversions
  - may create initial inventory based on type and Ishara flag.
- `updateProduct`:
  - validates required business fields
  - transactional update
  - syncs unit conversions while preserving existing unit IDs where possible.
- `createAdjustment` (quick stock):
  - reads existing inventory
  - applies delta
  - writes adjustment log + inventory update in one transaction.

## DB/model usage

- `Product`
- `Inventory`
- `UnitConversion`
- `Supplier`
- `StockAdjustment`

## Evaluation talking point

This page is not "just CRUD"; it is a master-data plus inventory-entry gateway.  
Product type and Ishara flag decide where initial stock is inserted (`Shop` vs `Production`).
