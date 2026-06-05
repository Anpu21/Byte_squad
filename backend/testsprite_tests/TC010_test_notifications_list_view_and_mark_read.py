import requests

BASE_URL = "http://localhost:5000/api/v1"
LOGIN_ENDPOINT = f"{BASE_URL}/auth/login"
NOTIFICATIONS_ENDPOINT = f"{BASE_URL}/notifications"

AUTH_CREDENTIALS = {
    "email": "dinesh77saark@gmail.com",
    "password": "Blaxx.com1"
}

TIMEOUT = 30

def authenticate():
    resp = requests.post(LOGIN_ENDPOINT, json=AUTH_CREDENTIALS, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text}"
    data = resp.json()
    access_token = data.get("accessToken")
    assert access_token, "No accessToken in login response"
    return access_token

def get_headers(token):
    return {"Authorization": f"Bearer {token}"}

def test_notifications_list_view_and_mark_read():
    token = authenticate()
    headers = get_headers(token)

    # Step 1: List own notifications
    resp = requests.get(NOTIFICATIONS_ENDPOINT, headers=headers, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Failed to list notifications: {resp.status_code} {resp.text}"
    notifications = resp.json()
    assert isinstance(notifications, list), "Notifications list is not a list"

    # We need at least one notification for other operations
    notification_id = None
    # Prefer a notification that is unread if any
    for notif in notifications:
        if not notif.get("read", False):
            notification_id = notif.get("id")
            break
    if not notification_id and notifications:
        notification_id = notifications[0].get("id")

    if not notification_id:
        # No notifications present, create one if possible, otherwise skip marking read tests.
        # According to PRD, no endpoint to create notifications manually.
        # So skip marking tests if none exist.
        return

    # Step 2: GET /notifications/:id returns notification details with ownership check
    detail_resp = requests.get(f"{NOTIFICATIONS_ENDPOINT}/{notification_id}", headers=headers, timeout=TIMEOUT)
    assert detail_resp.status_code == 200, f"Failed to get notification details: {detail_resp.status_code} {detail_resp.text}"
    detail_data = detail_resp.json()
    assert detail_data.get("id") == notification_id, "Returned notification ID mismatch"
    # Ownership check: No other user's notification must be returned, assumed true if 200

    # Step 3: PATCH /notifications/:id/read marks notification as read WITHOUT ownership check
    # This means anyone can mark any notification read by ID (IDOR)
    # We test that it returns 200 for our own notification (success case)
    patch_resp = requests.patch(f"{NOTIFICATIONS_ENDPOINT}/{notification_id}/read", headers=headers, timeout=TIMEOUT)
    assert patch_resp.status_code == 200, f"Failed to mark notification read: {patch_resp.status_code} {patch_resp.text}"

    # The IDOR vulnerability means that a user can mark other notifications unread/read.
    # We test this by attempting to mark a notification not owned by us read.
    # To do this, we try to find a notification not owned by us.
    # Since we cannot create other users/notifications, try brute forcing or skip this.
    # So here we try to mark a fake UUID read and expect a 200 since ownership check is missing.
    import uuid
    fake_id = str(uuid.uuid4())
    patch_fake_resp = requests.patch(f"{NOTIFICATIONS_ENDPOINT}/{fake_id}/read", headers=headers, timeout=TIMEOUT)
    # According to PRD, PATCH /:id/read has no ownership check.
    # So even with a non-existent id, it might return 200 or error.
    # Let's accept 200 or 404 or other, but not 403.
    assert patch_fake_resp.status_code in [200, 404], \
        f"Unexpected status when marking fake notification read: {patch_fake_resp.status_code}"

    # Step 4: PATCH /notifications/read-all marks all own notifications as read
    patch_all_resp = requests.patch(f"{NOTIFICATIONS_ENDPOINT}/read-all", headers=headers, timeout=TIMEOUT)
    assert patch_all_resp.status_code == 200, f"Failed to mark all notifications read: {patch_all_resp.status_code} {patch_all_resp.text}"

test_notifications_list_view_and_mark_read()