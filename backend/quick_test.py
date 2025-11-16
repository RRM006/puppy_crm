"""Quick API test"""
import requests
import json

# Login first
response = requests.post("http://localhost:8000/api/auth/login/", json={
    "email": "testceo@example.com",
    "password": "TestPass123!"
})

if response.status_code == 200:
    token = response.json()['tokens']['access']
    print(f"✓ Logged in successfully")
    print(f"Token: {token[:50]}...")
    
    # Try to get customers
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get("http://localhost:8000/api/customers/", headers=headers)
    
    print(f"\nCustomers API Response:")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
else:
    print(f"✗ Login failed: {response.status_code}")
    print(response.text)
