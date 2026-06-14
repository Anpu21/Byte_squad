import requests

BASE_URL = "http://localhost:5000/api/v1"
TIMEOUT = 30

def test_auth_login_with_valid_and_invalid_credentials():
    login_url = f"{BASE_URL}/auth/login"
    valid_credentials = {
        "email": "admin@ledgerpro.com",
        "password": "Admin@123"
    }
    invalid_credentials = {
        "email": "admin@ledgerpro.com",
        "password": "WrongPassword"
    }

    # Test valid credentials
    try:
        valid_resp = requests.post(login_url, json=valid_credentials, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Valid login request failed: {str(e)}"
    assert valid_resp.status_code == 200, f"Expected 200 OK for valid credentials, got {valid_resp.status_code}"
    try:
        data = valid_resp.json()
    except Exception as e:
        assert False, f"Valid login response not JSON: {str(e)}"
    assert "accessToken" in data, "accessToken missing in valid login response"
    assert "refreshToken" in data, "refreshToken missing in valid login response"
    assert "user" in data and isinstance(data["user"], dict), "user object missing or invalid in valid login response"
    user = data["user"]
    assert "id" in user and user["id"], "User id missing or empty in response"
    assert "email" in user and user["email"] == valid_credentials["email"], "User email mismatch in response"
    assert "role" in user and isinstance(user["role"], str) and user["role"], "User role missing or invalid"
    # branchId can be None or UUID, no strict check here

    # Test invalid credentials
    try:
        invalid_resp = requests.post(login_url, json=invalid_credentials, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Invalid login request failed: {str(e)}"
    assert invalid_resp.status_code == 401, f"Expected 401 Unauthorized for invalid credentials, got {invalid_resp.status_code}"
    try:
        invalid_data = invalid_resp.json()
    except Exception:
        # Some APIs may return empty body or non-JSON
        invalid_data = {}
    # If JSON returned, expect error message about invalid credentials
    if invalid_data:
        msg = invalid_data.get("message") or invalid_data.get("error") or invalid_data.get("detail")
        assert msg and ("invalid" in msg.lower() or "unauthorized" in msg.lower()), \
            "Invalid credentials error message missing or not informative."

test_auth_login_with_valid_and_invalid_credentials()