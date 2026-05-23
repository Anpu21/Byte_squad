# Inventory + Production Module Overview

This project separates concerns clearly:

- Frontend pages call REST APIs using `axios`.
- Express route files map URLs to controller functions.
- Controllers run business logic and update DB through Sequelize models or raw SQL.

## Main route mounts

Configured in `backend/server.js`:

- `/api/inventory` -> `routes/inventory/inventory.js`
- `/api/production` -> `routes/inventory/productionRoutes.js`
- `/api/inventory/sales` -> `routes/inventory/salesRoutes.js`
- `/api/inventory/transfers` -> `routes/inventory/transferRoutes.js`
- `/api/inventory/reports` -> `routes/inventory/reportRoutes.js`

## Core controllers

- `inventoryController.js` (dashboard, products, product inventory, unit conversions)
- `productionController.js` (production batches + approval to inventory)
- `adjustmentController.js` (stock adjustments with reverse logic)
- `transferController.js` (location transfer with transaction safety)
- `returnController.js` (returns with optional restock)
- `salesController.js` (shop stock + recent stock movement)
- `reportController.js` (report SQL endpoints)
- `supplierController.js` (supplier lookup/create)

## Core data tables/models used

- `PRODUCT`
- `INVENTORY`
- `PRODUCTION`
- `UNIT_CONVERSION`
- `STOCK_TRANSFER`
- `STOCK_ADJUSTMENT`
- `PRODUCT_RETURN`
- reporting tables/views like `PURCHASE_ORDER`, `SUPPLIER`, `stock_movement`, `sales`, `sale_item`

## Important flow rule to remember

Most stock-changing operations are wrapped in DB transactions (`sequelize.transaction`) in controllers.  
This is critical for your evaluation: it prevents half-updated inventory when errors happen.
