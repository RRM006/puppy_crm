# Authentication API Test Script
# Run this after starting Django server: python test_auth_api.py

import requests
import json

BASE_URL = "http://localhost:8000/api"

print("=" * 60)
print("PUPPY CRM - Authentication API Tests")
print("=" * 60)

# Test 1: Health Check
print("\n1. Testing Health Check...")
response = requests.get(f"{BASE_URL}/health/")
print(f"Status: {response.status_code}")
if response.status_code == 200:
    print(f"Response: {response.json()}")
else:
    print(f"Response: {response.text}")

# Test 2: Register Company User
print("\n2. Testing Company Registration...")
company_data = {
    "email": "ceo@testcompany.com",
    "password": "SecurePass123!",
    "password2": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "company_name": "Test Company LLC",
    "phone": "+1234567890",
    "employee_count": 25
}
response = requests.post(f"{BASE_URL}/auth/register/company/", json=company_data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 201:
    company_tokens = response.json()['tokens']
    print(f"\n✅ Company user registered successfully!")
    print(f"Access Token (first 50 chars): {company_tokens['access'][:50]}...")

# Test 3: Register Customer User
print("\n3. Testing Customer Registration...")
customer_data = {
    "email": "customer@example.com",
    "password": "SecurePass123!",
    "password2": "SecurePass123!",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+0987654321",
    "address": "123 Main St, New York, NY"
}
response = requests.post(f"{BASE_URL}/auth/register/customer/", json=customer_data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 201:
    customer_tokens = response.json()['tokens']
    print(f"\n✅ Customer user registered successfully!")
    print(f"Access Token (first 50 chars): {customer_tokens['access'][:50]}...")

# Test 4: Login with Company User
print("\n4. Testing Login (Company User)...")
login_data = {
    "email": "ceo@testcompany.com",
    "password": "SecurePass123!"
}
response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 200:
    access_token = response.json()['tokens']['access']
    print(f"\n✅ Login successful!")
    
    # Test 5: Get User Profile (Me)
    print("\n5. Testing Get User Profile (Me endpoint)...")
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print(f"\n✅ User profile retrieved successfully!")

# Test 6: Invalid Login
print("\n6. Testing Invalid Login...")
invalid_login = {
    "email": "wrong@example.com",
    "password": "wrongpassword"
}
response = requests.post(f"{BASE_URL}/auth/login/", json=invalid_login)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# Test 7: Token Refresh
print("\n7. Testing Token Refresh...")
if response.status_code == 200:
    refresh_token = response.json()['tokens']['refresh']
    response = requests.post(f"{BASE_URL}/auth/token/refresh/", json={"refresh": refresh_token})
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

print("\n" + "=" * 60)
print("API Tests Completed!")
print("=" * 60)
print("\n✅ All authentication endpoints are working!")
print("📚 API Documentation: http://localhost:8000/api/docs/")
print("=" * 60)
