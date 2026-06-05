import requests
import uuid

BASE_URL = "http://localhost:5000/api/v1"
TIMEOUT = 30

# Credentials
ADMIN_EMAIL = "admin@ledgerpro.com"
ADMIN_PASSWORD = "Admin@123"

MANAGER_EMAIL = "manager.main@ledgerpro.com"
MANAGER_PASSWORD = "Manager@123"

CASHIER_EMAIL = "cashier@ledgerpro.com"
CASHIER_PASSWORD = "Cashier@123"

HEADERS_JSON = {"Content-Type": "application/json"}

def login(email, password):
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    assert "data" in data and "accessToken" in data["data"] and "user" in data["data"], f"Login response missing keys: {data}"
    return data["data"]["accessToken"], data["data"]["user"]

def create_product(admin_token):
    # Create a minimal product needed for stock transfer (admin or manager)
    product_payload = {
        "name": f"Test Product {uuid.uuid4()}",
        "barcode": f"TESTBARCODE{uuid.uuid4().hex[:8]}",
        "category": "TestCategory",
        "costPrice": 10.0,
        "sellingPrice": 15.0,
    }
    resp = requests.post(
        f"{BASE_URL}/products",
        headers={"Authorization": f"Bearer {admin_token}", **HEADERS_JSON},
        json=product_payload,
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json()

def create_stock_for_branch(admin_token, product_id, branch_id, quantity=100):
    # Create inventory record with sufficient stock
    inventory_payload = {
        "productId": product_id,
        "branchId": branch_id,
        "quantity": quantity,
    }
    resp = requests.post(
        f"{BASE_URL}/inventory",
        headers={"Authorization": f"Bearer {admin_token}", **HEADERS_JSON},
        json=inventory_payload,
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json()

def get_branch_list(token):
    resp = requests.get(
        f"{BASE_URL}/branches",
        headers={"Authorization": f"Bearer {token}"},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json()

def create_stock_transfer_request(manager_token, product_id, requested_quantity=5, dest_branch_id=None, request_reason="Integration test transfer"):
    payload = {
        "productId": product_id,
        "requestedQuantity": requested_quantity,
        "requestReason": request_reason,
    }
    if dest_branch_id:
        payload["destinationBranchId"] = dest_branch_id

    resp = requests.post(
        f"{BASE_URL}/stock-transfers",
        headers={"Authorization": f"Bearer {manager_token}", **HEADERS_JSON},
        json=payload,
        timeout=TIMEOUT,
    )
    if resp.status_code == 403:
        return None, resp
    resp.raise_for_status()
    return resp.json(), resp

def approve_stock_transfer(admin_token, transfer_id, source_branch_id, approved_quantity):
    payload = {
        "sourceBranchId": source_branch_id,
        "approvedQuantity": approved_quantity,
        "approvalNote": "Approved by test case",
    }
    resp = requests.patch(
        f"{BASE_URL}/stock-transfers/{transfer_id}/approve",
        headers={"Authorization": f"Bearer {admin_token}", **HEADERS_JSON},
        json=payload,
        timeout=TIMEOUT,
    )
    return resp

def ship_stock_transfer(token, transfer_id, expect_status=200):
    resp = requests.patch(
        f"{BASE_URL}/stock-transfers/{transfer_id}/ship",
        headers={"Authorization": f"Bearer {token}"},
        timeout=TIMEOUT,
    )
    if resp.status_code != expect_status:
        resp.raise_for_status()
    return resp

def receive_stock_transfer(token, transfer_id, expect_status=200):
    resp = requests.patch(
        f"{BASE_URL}/stock-transfers/{transfer_id}/receive",
        headers={"Authorization": f"Bearer {token}"},
        timeout=TIMEOUT,
    )
    if resp.status_code != expect_status:
        resp.raise_for_status()
    return resp

def delete_stock_transfer(admin_token, transfer_id):
    # Not defined in PRD, no delete endpoint for stock transfer; skip deletion.
    # Normally you'd cancel or reject, but for test cleanup purpose we can do cancel if needed.
    try:
        resp = requests.patch(
            f"{BASE_URL}/stock-transfers/{transfer_id}/cancel",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=TIMEOUT,
        )
        if resp.status_code == 200:
            return True
    except Exception:
        pass
    return False

def test_stock_transfers_state_machine_and_branch_enforcement():
    # 1. LOGIN: Admin, Manager, Cashier
    admin_token, admin_user = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    manager_token, manager_user = login(MANAGER_EMAIL, MANAGER_PASSWORD)
    cashier_token, cashier_user = login(CASHIER_EMAIL, CASHIER_PASSWORD)

    assert admin_user["role"].upper() == "ADMIN"
    assert manager_user["role"].upper() == "MANAGER"
    assert cashier_user["role"].upper() == "CASHIER"

    # 2. GET BRANCHES to find source and destination branch IDs
    branches = get_branch_list(admin_token)
    # We'll pick two different branches, must have at least 2
    assert len(branches) >= 2, "At least two branches required for stock transfer test"
    branch_source = None
    branch_destination = None
    # We know from PRD that manager is assigned to BR001 "Main" branch, find BR001 or use first branch for source
    for b in branches:
        if b.get("code") == "BR001":
            branch_source = b
            break
    if not branch_source:
        branch_source = branches[0]
    # Choose a different branch as destination if possible
    for b in branches:
        if b["id"] != branch_source["id"]:
            branch_destination = b
            break
    if not branch_destination:
        # If only one branch exists, destination = source (to test branch enforcement should still work)
        branch_destination = branch_source

    source_branch_id = branch_source["id"]
    destination_branch_id = branch_destination["id"]

    # 3. CREATE PRODUCT as Admin for stock transfers
    product = create_product(admin_token)
    product_id = product["id"]

    # 4. CREATE INVENTORY in source branch with sufficient quantity as Admin
    inventory = create_stock_for_branch(admin_token, product_id, source_branch_id, quantity=100)

    # 5. MANAGER creates stock transfer request (POST /stock-transfers) - should create PENDING
    transfer_request, resp = create_stock_transfer_request(
        manager_token, product_id, requested_quantity=5, dest_branch_id=destination_branch_id, request_reason="Test transfer request"
    )
    assert resp.status_code == 201, "Manager should be able to create a stock transfer request"
    transfer_id = transfer_request["id"]

    try:
        # Validate status is PENDING
        assert transfer_request.get("status") == "PENDING"

        # 6. ADMIN approves stock transfer with source branch and approved quantity (PATCH /stock-transfers/:id/approve)
        approve_resp = approve_stock_transfer(admin_token, transfer_id, source_branch_id, approved_quantity=5)
        assert approve_resp.status_code == 200
        approve_data = approve_resp.json()
        assert approve_data.get("status") == "APPROVED"
        assert approve_data.get("approvedQuantity") == 5

        # 7. MANAGER tries to ship with correct source branch and should succeed (PATCH /stock-transfers/:id/ship)
        # Use manager token from source branch (it's BR001 "Main")
        ship_resp = ship_stock_transfer(manager_token, transfer_id, expect_status=200)
        ship_data = ship_resp.json()
        assert ship_data.get("status") == "IN_TRANSIT"

        # 8. MANAGER tries to ship from wrong branch should get 403 (patch ship with cashier token from different branch or simulate request with wrong branch enforcement)
        # We simulate cashier token to ship - Expect 403 forbidden because cashier is not admin/manager
        ship_resp_invalid = requests.patch(
            f"{BASE_URL}/stock-transfers/{transfer_id}/ship",
            headers={"Authorization": f"Bearer {cashier_token}"},
            timeout=TIMEOUT,
        )
        assert ship_resp_invalid.status_code == 403 or ship_resp_invalid.status_code == 401  # 401 Unauthorized or 403 Forbidden for invalid role

        # 9. MANAGER (destination branch) receives the stock (PATCH /stock-transfers/:id/receive)
        # First login a manager for destination branch is NOT given; only one manager main exists at BR001,
        # So use admin token to receive on behalf of destination branch as admin - admin not branch-scoped
        receive_resp = receive_stock_transfer(admin_token, transfer_id, expect_status=200)
        receive_data = receive_resp.json()
        assert receive_data.get("status") == "COMPLETED"

        # 10. MANAGER from wrong destination branch tries receive - expect 403
        # For branch enforcement, simulate with manager token (BR001) where destination branch is different, thus expect 403
        # Only one manager for BR001 "Main" branch. If destination branch != source branch, this should reject.
        if destination_branch_id != source_branch_id:
            receive_resp_invalid = requests.patch(
                f"{BASE_URL}/stock-transfers/{transfer_id}/receive",
                headers={"Authorization": f"Bearer {manager_token}"},
                timeout=TIMEOUT,
            )
            assert receive_resp_invalid.status_code == 403

    finally:
        # Cleanup: Cancel stock transfer if still pending or approved to avoid leftover state
        # Can only cancel PENDING or APPROVED, now it's COMPLETED so should skip
        delete_stock_transfer(admin_token, transfer_id)


test_stock_transfers_state_machine_and_branch_enforcement()
