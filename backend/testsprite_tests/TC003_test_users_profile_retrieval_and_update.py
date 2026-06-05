import requests
import uuid

BASE_URL = "http://localhost:5000/api/v1"
LOGIN_URL = f"{BASE_URL}/auth/login"
PROFILE_URL = f"{BASE_URL}/users/profile"
TIMEOUT = 30

ADMIN_EMAIL = "admin@ledgerpro.com"
ADMIN_PASSWORD = "Admin@123"

def test_users_profile_retrieval_and_update():
    # Authenticate to get access token
    login_payload = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    login_response = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    tokens = login_response.json()
    access_token = tokens.get("data", {}).get("accessToken")
    assert access_token, "No accessToken returned"

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # GET /users/profile - retrieve current user profile
    get_profile_resp = requests.get(PROFILE_URL, headers=headers, timeout=TIMEOUT)
    assert get_profile_resp.status_code == 200, f"Failed to get user profile: {get_profile_resp.text}"
    profile_data = get_profile_resp.json()
    assert "email" in profile_data and profile_data["email"].lower() == ADMIN_EMAIL, "Email mismatch in profile"

    # PATCH /users/profile - update profile fields and validate
    # Prepare updated data with unique firstName and phone to avoid clashes and allow repeat tests
    updated_first_name = f"AdminTestFirst{uuid.uuid4().hex[:6]}"
    updated_phone = "+94111222333"
    patch_payload = {
        "firstName": updated_first_name,
        "phone": updated_phone
    }
    patch_resp = requests.patch(PROFILE_URL, headers=headers, json=patch_payload, timeout=TIMEOUT)
    assert patch_resp.status_code == 200, f"Failed to update user profile: {patch_resp.text}"
    updated_profile = patch_resp.json()
    assert updated_profile.get("firstName") == updated_first_name, "firstName not updated correctly"
    assert updated_profile.get("phone") == updated_phone, "phone not updated correctly"

    # Additional retrieval to validate the update persisted
    get_profile_resp_2 = requests.get(PROFILE_URL, headers=headers, timeout=TIMEOUT)
    assert get_profile_resp_2.status_code == 200, f"Failed to get user profile after update: {get_profile_resp_2.text}"
    profile_data_2 = get_profile_resp_2.json()
    assert profile_data_2.get("firstName") == updated_first_name, "firstName update not persisted"
    assert profile_data_2.get("phone") == updated_phone, "phone update not persisted"

test_users_profile_retrieval_and_update()
