# Authentication API Test Script
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

print("=" * 60)
print("PUPPY CRM - Authentication API Tests")
print("=" * 60)

# Test 1: Health Check
print("\n1. Testing Health Check...")
try:
    response = requests.get(f"{BASE_URL}/health/", timeout=5)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)

# Test 2: Register Company User
print("\n2. Testing Company Registration...")
company_data = {
    "email": "ceo2@newcompany.com",  # Use different email
    "password": "SecurePass123!",
    "password2": "SecurePass123!",
    "first_name": "Alice",
    "last_name": "Johnson",
    "company_name": "New Tech Company",
    "phone": "+1555555555",
    "employee_count": 100
}
try:
    response = requests.post(f"{BASE_URL}/auth/register/company/", json=company_data, timeout=5)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    if response.status_code == 201:
        company_tokens = result.get('tokens', {})
        company_user_id = result.get('user', {}).get('id')
        print(f"\n✅ Company user registered successfully!")
        print(f"User ID: {company_user_id}")
    else:
        # Still try to get tokens from login for refresh test
        company_tokens = None
except Exception as e:
    print(f"ERROR: {e}")
    company_tokens = None

# Test 3: Register Customer User
print("\n3. Testing Customer Registration...")
customer_data = {
    "email": "customer@testmail.com",
    "password": "SecurePass123!",
    "password2": "SecurePass123!",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+1987654321",
    "address": "123 Main St, City, Country"
}
try:
    response = requests.post(f"{BASE_URL}/auth/register/customer/", json=customer_data, timeout=5)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    if response.status_code == 201:
        customer_tokens = result.get('tokens', {})
        customer_user_id = result.get('user', {}).get('id')
        print(f"\n✅ Customer user registered successfully!")
        print(f"User ID: {customer_user_id}")
except Exception as e:
    print(f"ERROR: {e}")

# Test 4: Login with Company User
print("\n4. Testing Login (Company User)...")
login_data = {
    "email": "ceo@testcompany.com",
    "password": "SecurePass123!"
}
try:
    response = requests.post(f"{BASE_URL}/auth/login/", json=login_data, timeout=5)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    if response.status_code == 200:
        access_token = result.get('tokens', {}).get('access')
        # Get tokens for refresh test if not already set
        if 'company_tokens' not in locals() or not company_tokens:
            company_tokens = result.get('tokens', {})
        print(f"\n✅ Login successful!")
        print(f"Access token (first 50 chars): {access_token[:50]}...")
except Exception as e:
    print(f"ERROR: {e}")

# Test 5: Get User Info with Token
print("\n5. Testing Get User Info (Me endpoint)...")
if 'access_token' in locals() and access_token:
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        response = requests.get(f"{BASE_URL}/auth/me/", headers=headers, timeout=5)
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200:
            print(f"\n✅ User info retrieved successfully!")
            print(f"Account type: {result.get('account_type')}")
            if result.get('account_type') == 'company':
                print(f"Company: {result.get('company', {}).get('company_name')}")
    except Exception as e:
        print(f"ERROR: {e}")
else:
    print("Skipped (no access token from previous test)")

# Test 6: Test Invalid Login
print("\n6. Testing Invalid Login...")
invalid_login = {
    "email": "wrong@email.com",
    "password": "WrongPassword123!"
}
try:
    response = requests.post(f"{BASE_URL}/auth/login/", json=invalid_login, timeout=5)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    if response.status_code == 401:
        print(f"\n✅ Invalid login correctly rejected!")
except Exception as e:
    print(f"ERROR: {e}")

# Test 7: Test Token Refresh
print("\n7. Testing Token Refresh...")
if 'company_tokens' in locals() and company_tokens:
    refresh_token = company_tokens.get('refresh')
    refresh_data = {"refresh": refresh_token}
    try:
        response = requests.post(f"{BASE_URL}/auth/token/refresh/", json=refresh_data, timeout=5)
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200:
            new_access = result.get('access')
            print(f"\n✅ Token refresh successful!")
            print(f"New access token (first 50 chars): {new_access[:50]}...")
    except Exception as e:
        print(f"ERROR: {e}")
else:
    print("Skipped (no refresh token from registration test)")

print("\n" + "=" * 60)
print("All tests completed!")
print("=" * 60)
