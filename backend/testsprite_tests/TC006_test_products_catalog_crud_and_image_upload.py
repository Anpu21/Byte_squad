import requests
import uuid
import io
from PIL import Image

BASE_URL = "http://localhost:5000/api/v1"
TIMEOUT = 30

ADMIN_EMAIL = "admin@ledgerpro.com"
ADMIN_PASSWORD = "Admin@123"
MANAGER_EMAIL = "manager.main@ledgerpro.com"
MANAGER_PASSWORD = "Manager@123"

def login(email: str, password: str) -> str:
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password},
        timeout=TIMEOUT,
    )
    assert resp.status_code == 200, f"Login failed for {email}, status {resp.status_code}: {resp.text}"
    data = resp.json()
    assert "accessToken" in data
    return data["accessToken"]


def create_product(token: str, product_payload: dict) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(
        f"{BASE_URL}/products",
        json=product_payload,
        headers=headers,
        timeout=TIMEOUT,
    )
    assert resp.status_code == 201, f"Create product failed with status {resp.status_code}: {resp.text}"
    return resp.json()


def get_products(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/products", headers=headers, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Get products failed with status {resp.status_code}: {resp.text}"
    return resp.json()


def get_product(token: str, product_id: str):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/products/{product_id}", headers=headers, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Get product by id failed with status {resp.status_code}: {resp.text}"
    return resp.json()


def patch_product(token: str, product_id: str, payload: dict):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.patch(
        f"{BASE_URL}/products/{product_id}", json=payload, headers=headers, timeout=TIMEOUT
    )
    assert resp.status_code == 200, f"Patch product failed with status {resp.status_code}: {resp.text}"
    return resp.json()


def upload_product_image(token: str, product_id: str, image_bytes: bytes, filename="test_image.png"):
    headers = {"Authorization": f"Bearer {token}"}
    files = {
        "file": (filename, image_bytes, "image/png")
    }
    resp = requests.post(
        f"{BASE_URL}/products/{product_id}/image", files=files, headers=headers, timeout=TIMEOUT
    )
    assert resp.status_code == 200, f"Upload product image failed with status {resp.status_code}: {resp.text}"
    return resp.json()


def upload_product_image_large(token: str, product_id: str, image_bytes: bytes, filename="large_image.png"):
    headers = {"Authorization": f"Bearer {token}"}
    files = {
        "file": (filename, image_bytes, "image/png")
    }
    resp = requests.post(
        f"{BASE_URL}/products/{product_id}/image", files=files, headers=headers, timeout=TIMEOUT
    )
    # Expect 413 File too large
    assert resp.status_code == 413, f"Uploading large image expected 413 but got {resp.status_code}: {resp.text}"


def delete_product_image(token: str, product_id: str):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.delete(
        f"{BASE_URL}/products/{product_id}/image", headers=headers, timeout=TIMEOUT
    )
    assert resp.status_code == 200, f"Delete product image failed with status {resp.status_code}: {resp.text}"
    return resp.json()


def delete_product(token: str, product_id: str):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.delete(
        f"{BASE_URL}/products/{product_id}", headers=headers, timeout=TIMEOUT
    )
    assert resp.status_code == 204, f"Delete product failed with status {resp.status_code}: {resp.text}"


def generate_png_image_bytes(size=(100, 100), color=(255, 0, 0, 255)) -> bytes:
    img = Image.new("RGBA", size, color)
    with io.BytesIO() as output:
        img.save(output, format="PNG")
        return output.getvalue()


def generate_large_png_image_bytes(size=(3000, 3000), color=(255, 0, 0, 255)) -> bytes:
    # Approximately > 2MB image to trigger upload size limit
    return generate_png_image_bytes(size=size, color=color)


def test_products_catalog_crud_and_image_upload():
    # Login as admin and manager
    admin_token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    manager_token = login(MANAGER_EMAIL, MANAGER_PASSWORD)

    # We will test create with both roles, then cleanup

    # Common product payload
    product_payload = {
        "name": "TestProduct_" + str(uuid.uuid4()),
        "barcode": "TEST-" + str(uuid.uuid4()).replace("-", "")[:12],
        "category": "TestCategory",
        "costPrice": 10.50,
        "sellingPrice": 15.75,
        "taxRate": 7.5,
        "baseUnit": "unit",
        "sellableUnits": ["unit", "box"]
    }

    created_products = []

    try:
        # Admin creates product
        admin_product = create_product(admin_token, product_payload)
        assert admin_product["name"] == product_payload["name"]
        assert "id" in admin_product
        created_products.append((admin_token, admin_product["id"]))

        # Manager creates product
        # Modify barcode and name for uniqueness
        product_payload2 = product_payload.copy()
        product_payload2["barcode"] = "TEST-" + str(uuid.uuid4()).replace("-", "")[:12]
        product_payload2["name"] = "TestProduct_" + str(uuid.uuid4())
        manager_product = create_product(manager_token, product_payload2)
        assert manager_product["name"] == product_payload2["name"]
        assert "id" in manager_product
        created_products.append((manager_token, manager_product["id"]))

        # Use admin token for subsequent tests on admin_product

        # GET /api/v1/products lists products (should include created products)
        products_list = get_products(admin_token)
        product_ids = {p["id"] for p in products_list}
        assert admin_product["id"] in product_ids
        assert manager_product["id"] in product_ids

        # GET /api/v1/products/:id returns product details
        fetched_product = get_product(admin_token, admin_product["id"])
        assert fetched_product["id"] == admin_product["id"]
        assert fetched_product["name"] == admin_product["name"]

        # PATCH /api/v1/products/:id updates product
        update_payload = {"sellingPrice": 20.00, "taxRate": 10}
        updated_product = patch_product(admin_token, admin_product["id"], update_payload)
        assert updated_product["sellingPrice"] == 20.00
        assert updated_product["taxRate"] == 10

        # POST /api/v1/products/:id/image uploads product image with size limit

        # Generate valid small image (~ < 2MB)
        small_image_bytes = generate_png_image_bytes()
        uploaded_product = upload_product_image(admin_token, admin_product["id"], small_image_bytes)
        # Uploaded product should contain image properties or at least have same id confirmed
        assert uploaded_product["id"] == admin_product["id"]

        # Upload large image (> 2MB) expect 413
        large_image_bytes = generate_large_png_image_bytes()
        upload_product_image_large(admin_token, admin_product["id"], large_image_bytes)

        # DELETE /api/v1/products/:id/image deletes product image
        deleted_product = delete_product_image(admin_token, admin_product["id"])
        assert deleted_product["id"] == admin_product["id"]

    finally:
        # Cleanup created products
        for token, pid in created_products:
            try:
                delete_product(token, pid)
            except AssertionError:
                pass  # ignore already deleted or errors on cleanup


test_products_catalog_crud_and_image_upload()