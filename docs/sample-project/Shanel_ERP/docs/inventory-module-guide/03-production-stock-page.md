# Production Stock Page

Frontend file: `frontend/src/pages/Inventory/ProductionStock.jsx`

## What this page does

Handles production batch lifecycle:

- create new batch
- move status (`In_Progress` -> `Quality_Check` -> `Approved`)
- on approval, sync produced qty to inventory
- list approved batches with expiry info

## Frontend flow

1. On mount, `GET /api/production/stock-overview`.
2. Splits rows into:
   - `workingItems` (not approved)
   - `approvedItems`
3. Status update via `PUT /api/production/update/:id`.
4. Delete batch via `DELETE /api/production/:id`.
5. New batch created from `ProductionModal` using `POST /api/production/start`.

## Backend endpoints

From `productionRoutes.js`:

- `GET /stock-overview`
- `POST /start`
- `PUT /update/:id`
- `DELETE /:id`

## Backend logic highlights

- `getProductionData` computes UI completion stage values and `DaysToExpire`.
- `startProduction` inserts a new `Production` row with status `In_Progress`.
- `updateProductionStatus`:
  - transactional.
  - if new status is `Approved`, it finds/creates inventory at target location and adds produced qty.
  - location rule currently uses product type (`Company` -> `Production`, else `Shop`).
- `deleteProduction` removes batch.

## DB/model usage

- `Production`
- `Product`
- `Inventory`

## End-to-end data flow

User action in table/modal -> production API -> controller transaction -> `PRODUCTION` and sometimes `INVENTORY` updates -> refreshed page data.
