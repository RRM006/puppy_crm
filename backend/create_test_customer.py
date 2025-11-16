"""Create test customer for order API tests"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"
EMAIL = "testceo@example.com"
PASSWORD = "TestPass123!"

print("=" * 80)
print("Creating test customer for Order API tests")
print("=" * 80)

# Login
print("\n1. Logging in...")
login_response = requests.post(
    f"{BASE_URL}/auth/login/",
    json={"email": EMAIL, "password": PASSWORD}
)

if login_response.status_code != 200:
    print("✗ Login failed")
    exit(1)

tokens = login_response.json()['tokens']
headers = {
    "Authorization": f"Bearer {tokens['access']}",
    "Content-Type": "application/json"
}
print("✓ Login successful")

# Check if customer exists
print("\n2. Checking for existing customers...")
customers_response = requests.get(f"{BASE_URL}/customers/", headers=headers)
if customers_response.status_code == 200:
    data = customers_response.json()
    if data.get('count', 0) > 0:
        customer = data['results'][0]
        print(f"✓ Found existing customer: {customer['name']} (ID: {customer['id']})")
        print("\n✓ Ready to run order API tests!")
        exit(0)

# Create customer
print("\n3. Creating test customer...")
customer_data = {
    "email": "john.doe@testcustomer.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+1555123456",
    "company_name": "Test Customer Inc",
    "status": "active",
    "notes": "Test customer for order API testing"
}

create_response = requests.post(
    f"{BASE_URL}/customers/",
    json=customer_data,
    headers=headers
)

if create_response.status_code == 201:
    data = create_response.json()
    customer_id = data['customer']['id']
    print(f"✓ Customer created successfully!")
    print(f"ID: {customer_id}")
    print(f"Name: {data['customer']['name']}")
    print(f"Email: {data['customer']['email']}")
    print("\n✓ Ready to run order API tests!")
else:
    print(f"✗ Failed to create customer:")
    print(json.dumps(create_response.json(), indent=2))

print("=" * 80)
