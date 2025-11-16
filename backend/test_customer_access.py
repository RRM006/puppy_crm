"""Test customer API access"""
import requests
import json

BASE_URL = "http://127.0.0.1:8001/api"
EMAIL = "testceo@example.com"
PASSWORD = "TestPass123!"

# Login
print("1. Logging in...")
login_response = requests.post(
    f"{BASE_URL}/auth/login/",
    json={"email": EMAIL, "password": PASSWORD}
)

print(f"Login Status: {login_response.status_code}")
if login_response.status_code != 200:
    print("Login failed:")
    print(json.dumps(login_response.json(), indent=2))
    exit(1)

tokens = login_response.json()['tokens']
headers = {
    "Authorization": f"Bearer {tokens['access']}",
    "Content-Type": "application/json"
}
print("✓ Login successful\n")

# Get customers
print("2. Testing customer list endpoint...")
customers_response = requests.get(f"{BASE_URL}/customers/", headers=headers)
print(f"Status: {customers_response.status_code}")
print(f"Response: {customers_response.text[:500]}")

if customers_response.status_code != 200:
    print("\n✗ Failed to access customers endpoint")
else:
    print("\n✓ Successfully accessed customers endpoint")
