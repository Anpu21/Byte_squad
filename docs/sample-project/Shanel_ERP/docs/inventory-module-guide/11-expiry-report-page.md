# Expiry Report Page

Frontend file: `frontend/src/pages/Inventory/Reports/ExpiryReport.jsx`

## API used

- `GET /api/inventory/reports/expiry`

## Backend function

- `reportController.getExpiryReport`

## Backend SQL logic

- reads approved production batches
- joins product details
- calculates `Days_Left` using `DATEDIFF`
- orders nearest expiry first

## UI behavior

- status buckets:
  - `Expired`
  - `Critical` (<= 7 days)
  - `Warning` (<= 30 days)
  - `Good`
- print and PDF export supported

## Tables touched

- `PRODUCTION`
- `PRODUCT`
