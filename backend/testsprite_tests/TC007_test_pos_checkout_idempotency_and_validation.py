import requests
import uuid
import time

BASE_URL = "http://localhost:5000/api/v1"
TIMEOUT = 30

ADMIN_CREDENTIALS = {"email": "admin@ledgerpro.com", "password": "Admin@123"}
MANAGER_CREDENTIALS = {"email": "manager.main@ledgerpro.com", "password": "Manager@123"}
CASHIER_CREDENTIALS = {"email": "cashier@ledgerpro.com", "password": "Cashier@123"}

def login(credentials):
    url = f"{BASE_URL}/auth/login"
    resp = requests.post(url, json={"email": credentials["email"], "password": credentials["password"]}, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed for {credentials['email']}"
    data = resp.json()
    return data["accessToken"], data["user"]

def test_pos_checkout_idempotency_and_validation():
    # Login as cashier (required role for legacy POST /pos/transactions)
    cashier_token, cashier_user = login(CASHIER_CREDENTIALS)
    headers_cashier = {"Authorization": f"Bearer {cashier_token}", "Content-Type": "application/json"}

    # Login as admin (can do POST /pos/sales)
    admin_token, admin_user = login(ADMIN_CREDENTIALS)
    headers_admin = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}

    # Helper to create legacy sale payload and call POST /pos/transactions
    def create_legacy_sale(idempotency_key):
        url = f"{BASE_URL}/pos/transactions"
        headers = headers_cashier.copy()
        headers["X-Idempotency-Key"] = idempotency_key
        payload = {
            "type": "Sale",
            "paymentMethod": "Cash",
            "items": [
                {
                    "productId": "00000000-0000-0000-0000-000000000001",  # dummy uuid, assuming seeded product
                    "quantity": 1,
                    "unitPrice": 10.0
                }
            ]
        }
        r = requests.post(url, headers=headers, json=payload, timeout=TIMEOUT)
        return r

    # 1. POST /api/v1/pos/transactions creates legacy sale with idempotency key
    idempotency_key = str(uuid.uuid4())
    resp1 = create_legacy_sale(idempotency_key)
    assert resp1.status_code == 201, f"Expected 201 Created for first legacy sale, got {resp1.status_code}"
    sale1 = resp1.json()
    sale_id = sale1.get("id") or sale1.get("saleId")

    try:
        # 2. Duplicate request with same idempotency key returns 409
        resp2 = create_legacy_sale(idempotency_key)
        assert resp2.status_code == 409, f"Expected 409 Conflict for duplicate idempotency key, got {resp2.status_code}"

        # Prepare valid payload for POST /pos/sales (multi-tender sale)
        # Must have either customerUserId or loyaltyCustomerId exclusively (XOR)
        # Use cashier role token for access (roles CASHIER,MANAGER,ADMIN allowed)
        # Use X-Idempotency-Key to be idempotent as well
        pos_sales_url = f"{BASE_URL}/pos/sales"
        headers_sales = headers_admin.copy()  # admin allowed

        # ===== Valid multi-tender sale with customerUserId only =====
        valid_idempotency_key_1 = str(uuid.uuid4())
        payload_valid_customer = {
            "customerUserId": cashier_user["id"],
            "cartDiscountAmount": 0,
            "items": [
                {
                    "productId": "00000000-0000-0000-0000-000000000001",
                    "quantity": 2.5,
                    "unitPrice": 20.0,
                    "discountPercentage": 10
                }
            ],
            "payment": {
                "paymentMethod": "Cash",
                "paymentAmount": 45.0
            }
        }
        headers_sales["X-Idempotency-Key"] = valid_idempotency_key_1
        resp_valid_customer = requests.post(pos_sales_url, headers=headers_sales, json=payload_valid_customer, timeout=TIMEOUT)
        assert resp_valid_customer.status_code == 201, f"Expected 201 Created for valid multi-tender sale with customerUserId; got {resp_valid_customer.status_code}"

        sale_created_customer = resp_valid_customer.json()
        sale_created_customer_id = sale_created_customer.get("id") or sale_created_customer.get("saleId")

        # ===== Valid multi-tender sale with loyaltyCustomerId only =====
        valid_idempotency_key_2 = str(uuid.uuid4())
        payload_valid_loyalty = {
            "loyaltyCustomerId": "00000000-0000-0000-0000-000000000010",  # dummy loyalty id
            "items": [
                {
                    "productId": "00000000-0000-0000-0000-000000000001",
                    "quantity": 1.5,
                    "unitPrice": 30.0
                }
            ],
            "payment": {
                "paymentMethod": "Card",
                "paymentAmount": 45.0
            }
        }
        headers_sales["X-Idempotency-Key"] = valid_idempotency_key_2
        resp_valid_loyalty = requests.post(pos_sales_url, headers=headers_sales, json=payload_valid_loyalty, timeout=TIMEOUT)
        assert resp_valid_loyalty.status_code == 201, f"Expected 201 Created for valid multi-tender sale with loyaltyCustomerId; got {resp_valid_loyalty.status_code}"

        sale_created_loyalty = resp_valid_loyalty.json()
        sale_created_loyalty_id = sale_created_loyalty.get("id") or sale_created_loyalty.get("saleId")

        # ===== Invalid payload: both customerUserId and loyaltyCustomerId set, expect 400 =====
        invalid_idempotency_key = str(uuid.uuid4())
        payload_invalid_both = {
            "customerUserId": cashier_user["id"],
            "loyaltyCustomerId": "00000000-0000-0000-0000-000000000010",
            "items": [
                {
                    "productId": "00000000-0000-0000-0000-000000000001",
                    "quantity": 1,
                    "unitPrice": 10.0
                }
            ],
            "payment": {
                "paymentMethod": "Cash",
                "paymentAmount": 10.0
            }
        }
        headers_sales["X-Idempotency-Key"] = invalid_idempotency_key
        resp_invalid = requests.post(pos_sales_url, headers=headers_sales, json=payload_invalid_both, timeout=TIMEOUT)
        assert resp_invalid.status_code == 400, f"Expected 400 Bad Request for payload with both customerUserId and loyaltyCustomerId; got {resp_invalid.status_code}"

    finally:
        # Clean up legacy sale created in first step if possible (only admin can delete sales if API exists)
        # The PRD does not mention a DELETE sale endpoint, so we skip cleanup for legacy sale and sales.
        # If there was an endpoint to void or delete sales it should be used here.
        pass

test_pos_checkout_idempotency_and_validation()