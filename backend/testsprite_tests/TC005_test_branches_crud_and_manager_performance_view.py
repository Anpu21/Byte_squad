import requests
import uuid

BASE_URL = "http://localhost:5000/api/v1"
TIMEOUT = 30

ADMIN_EMAIL = "admin@ledgerpro.com"
ADMIN_PASSWORD = "Admin@123"
MANAGER_EMAIL = "manager.main@ledgerpro.com"
MANAGER_PASSWORD = "Manager@123"

def authenticate(email, password):
    url = f"{BASE_URL}/auth/login"
    payload = {
        "email": email,
        "password": password
    }
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed with status {resp.status_code}"
    data = resp.json()
    assert "accessToken" in data and "refreshToken" in data
    return data["accessToken"]

def test_branches_crud_and_manager_performance_view():
    admin_token = authenticate(ADMIN_EMAIL, ADMIN_PASSWORD)
    manager_token = authenticate(MANAGER_EMAIL, MANAGER_PASSWORD)

    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_manager = {"Authorization": f"Bearer {manager_token}"}

    branch_data = {
        "code": f"BR{str(uuid.uuid4().int)[:3].zfill(3)}",
        "name": "Test Branch Name",
        "addressLine1": "123 Admin Road",
        "phone": "+94112223344",
        "email": "testbranch@example.com"
    }
    created_branch = None
    try:
        # 1. POST /api/v1/branches with admin JWT: create branch
        resp = requests.post(f"{BASE_URL}/branches", json=branch_data, headers=headers_admin, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Expected 201 Created but got {resp.status_code}"
        created_branch = resp.json()
        assert "id" in created_branch and created_branch["code"] == branch_data["code"]

        branch_id = created_branch["id"]

        # 2. GET /api/v1/branches with admin JWT: list branches
        resp = requests.get(f"{BASE_URL}/branches", headers=headers_admin, timeout=TIMEOUT)
        assert resp.status_code == 200
        branches = resp.json()
        assert isinstance(branches, list)
        # The list should include the created branch
        assert any(b["id"] == branch_id for b in branches)

        # 3. GET /api/v1/branches/:id with admin JWT: get branch details
        resp = requests.get(f"{BASE_URL}/branches/{branch_id}", headers=headers_admin, timeout=TIMEOUT)
        assert resp.status_code == 200
        branch_detail = resp.json()
        assert branch_detail["id"] == branch_id
        assert branch_detail["code"] == branch_data["code"]

        # 4. GET /api/v1/branches/my-performance with manager JWT: get manager branch KPIs
        resp = requests.get(f"{BASE_URL}/branches/my-performance", headers=headers_manager, timeout=TIMEOUT)
        assert resp.status_code == 200
        performance = resp.json()
        # Basic sanity checks on performance data keys (expected typical KPI keys)
        assert isinstance(performance, dict)
        # We expect some keys like 'totalSales' or 'kpis' may be included - at least check exists
        assert len(performance) > 0

        # 5. PATCH /api/v1/branches/:id/toggle-active with admin JWT: toggle branch active state
        orig_is_active = branch_detail.get("isActive", True)
        resp = requests.patch(f"{BASE_URL}/branches/{branch_id}/toggle-active", headers=headers_admin, timeout=TIMEOUT)
        assert resp.status_code == 200
        toggled_branch = resp.json()
        assert toggled_branch["id"] == branch_id
        # isActive should be toggled (boolean flip)
        assert toggled_branch.get("isActive") is not None
        assert toggled_branch.get("isActive") != orig_is_active

    finally:
        # Cleanup: Delete created branch if exists
        if created_branch:
            requests.delete(f"{BASE_URL}/branches/{created_branch['id']}", headers=headers_admin, timeout=TIMEOUT)

test_branches_crud_and_manager_performance_view()
