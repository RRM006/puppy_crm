"""
Setup test user for order API testing
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

# Test credentials
TEST_EMAIL = "testceo@example.com"
TEST_PASSWORD = "TestPass123!"

print("=" * 80)
print("Setting up test user for Order API tests")
print("=" * 80)

# Try to login first
print("\n1. Checking if user exists...")
login_response = requests.post(
    f"{BASE_URL}/auth/login/",
    json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
)

if login_response.status_code == 200:
    print("✓ Test user already exists and credentials are correct")
    print(f"Email: {TEST_EMAIL}")
    print(f"Password: {TEST_PASSWORD}")
    tokens = login_response.json()
    print(f"\nAccess Token: {tokens['access_token'][:50]}...")
    print("\n✓ Ready to run order API tests!")
else:
    print("✗ User doesn't exist or credentials are incorrect")
    print("\n2. Creating new test company user...")
    
    register_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "password2": TEST_PASSWORD,
        "first_name": "Test",
        "last_name": "CEO",
        "company_name": "Test Company Inc",
        "phone": "+1234567890",
        "employee_count": 10
    }
    
    register_response = requests.post(
        f"{BASE_URL}/auth/register/company/",
        json=register_data
    )
    
    if register_response.status_code == 201:
        print("✓ Test user created successfully!")
        data = register_response.json()
        print(f"User ID: {data['user']['id']}")
        print(f"Company: {data['company']['name']}")
        print(f"Email: {TEST_EMAIL}")
        print(f"Password: {TEST_PASSWORD}")
        print("\n✓ Ready to run order API tests!")
    else:
        print(f"✗ Failed to create user:")
        print(json.dumps(register_response.json(), indent=2))

print("\n" + "=" * 80)
