import requests

BASE_URL = "http://localhost:5000/api/v1"
TIMEOUT = 30

# Seeded user credentials by role
USER_CREDENTIALS = {
    "ADMIN": {"email": "admin@ledgerpro.com", "password": "Admin@123"},
    "MANAGER": {"email": "manager.main@ledgerpro.com", "password": "Manager@123"},
    "CASHIER": {"email": "cashier@ledgerpro.com", "password": "Cashier@123"},
    "CUSTOMER": {"email": "customer.ayesha@ledgerpro.com", "password": "Customer@123"},
}

def login(email, password):
    url = f"{BASE_URL}/auth/login"
    payload = {"email": email, "password": password}
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    try:
        resp.raise_for_status()
    except requests.exceptions.HTTPError as e:
        assert False, f"Login failed for {email} with status {resp.status_code}, response: {resp.text}"
    data = resp.json()
    assert "data" in data and "accessToken" in data["data"], f"Login response missing 'accessToken': {data} for {email}"
    return data["data"]["accessToken"]

def get_current_user_profile(token):
    url = f"{BASE_URL}/users/profile"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()

def get_branches(token):
    url = f"{BASE_URL}/branches"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()

def patch_customer_branch(token, branch_id):
    url = f"{BASE_URL}/users/me/branch"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"branchId": branch_id}
    resp = requests.patch(url, json=payload, headers=headers, timeout=TIMEOUT)
    return resp

def test_users_customer_branch_selection_and_role_restriction():
    # Login CUSTOMER and get token
    customer_token = login(USER_CREDENTIALS["CUSTOMER"]["email"], USER_CREDENTIALS["CUSTOMER"]["password"])
    # Fetch list of branches to select one for the customer
    branches = get_branches(customer_token)
    assert isinstance(branches, list) and len(branches) > 0, "Branches list should be present and non-empty"
    selected_branch_id = branches[0].get("id")
    assert selected_branch_id, "Selected branch must have an id"

    # CUSTOMER patch preferred branch - Expect 200 and updated user with branchId matching
    resp = patch_customer_branch(customer_token, selected_branch_id)
    assert resp.status_code == 200, f"Expected 200 for CUSTOMER patching branch, got {resp.status_code}"
    user_data = resp.json()
    assert user_data.get("role") == "CUSTOMER", "User role in response should be CUSTOMER"
    # user_data may or may not have preferred branch under "branchId" or other field - match selected branchId
    user_branch_id = user_data.get("branchId") or user_data.get("preferredBranchId") or (user_data.get("preferredBranch") or {}).get("id")
    assert user_branch_id == selected_branch_id, "User's preferred branch must be updated to selected branch"

    # For each non-customer role, try to patch branch and expect 403
    for role in ["ADMIN", "MANAGER", "CASHIER"]:
        token = login(USER_CREDENTIALS[role]["email"], USER_CREDENTIALS[role]["password"])
        resp = patch_customer_branch(token, selected_branch_id)
        assert resp.status_code == 403, f"Expected 403 for role {role} patching branch, got {resp.status_code}"
        # Optional: verify error message in response body
        try:
            error_json = resp.json()
            # error message may vary, check presence of something identifying the error
            assert any(
                phrase in error_json.get("message", "").lower()
                for phrase in ["only customers", "forbidden", "unauthorized", "not allowed"]
            ), f"Unexpected error message for role {role}: {error_json.get('message')}"
        except Exception:
            pass

test_users_customer_branch_selection_and_role_restriction()
