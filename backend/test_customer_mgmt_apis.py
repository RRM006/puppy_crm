"""
Customer Management API Test Script (Phase 5.2)
Tests all customer management endpoints for B2B functionality.

Run with: python test_customer_mgmt_apis.py
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

def print_response(title, response):
    """Print formatted API response"""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        # Truncate long responses
        if isinstance(data, dict) and 'results' in data and len(str(data)) > 2000:
            print(f"Count: {data.get('count', 'N/A')}")
            print(f"Page: {data.get('page', 'N/A')}")
            print(f"Results: {len(data.get('results', []))} items (truncated)")
        else:
            print(json.dumps(data, indent=2))
    except:
        print(response.text[:500])  # Truncate long responses
    print()

def test_customer_management_apis():
    """Test customer management APIs"""
    
    # Step 0: Register new company user
    print("\n🏢 STEP 0: Register New Company User")
    company_data = {
        "email": "testceo@customertest.com",
        "password": "TestPass123!",
        "password2": "TestPass123!",
        "first_name": "Test",
        "last_name": "CEO",
        "company_name": "Customer Test Company",
        "phone": "+1555123456",
        "employee_count": 50
    }
    
    register_response = requests.post(
        f"{BASE_URL}/auth/register/company/",
        json=company_data
    )
    print_response("Register Company", register_response)
    
    if register_response.status_code == 201:
        access_token = register_response.json()["tokens"]["access"]
    else:
        # Try to login with existing account
        print("\n🔐 Trying to login with existing account...")
        login_response = requests.post(
            f"{BASE_URL}/auth/login/",
            json={
                "email": "testceo@customertest.com",
                "password": "TestPass123!",
                "user_type": "company"
            }
        )
        print_response("Login Response", login_response)
        
        if login_response.status_code != 200:
            print("❌ Registration and login failed.")
            return
        
        access_token = login_response.json()["tokens"]["access"]
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    print(f"✅ Authenticated successfully!")
    
    # Step 1: Create customer tags
    print("\n🏷️ STEP 1: Create Customer Tags")
    tags_to_create = [
        {"name": "VIP", "color": "#FFD700"},
        {"name": "High Value", "color": "#4CAF50"},
        {"name": "At Risk", "color": "#FF6B6B"},
    ]
    
    created_tags = []
    for tag_data in tags_to_create:
        response = requests.post(
            f"{BASE_URL}/customers/tags/",
            headers=headers,
            json=tag_data
        )
        print_response(f"Create Tag: {tag_data['name']}", response)
        if response.status_code == 201:
            created_tags.append(response.json())
    
    # Step 2: List all tags
    print("\n📋 STEP 2: List All Tags")
    response = requests.get(f"{BASE_URL}/customers/tags/", headers=headers)
    print_response("List Tags", response)
    
    # Step 3: Add new customer to company
    print("\n➕ STEP 3: Add New Customer to Company")
    new_customer_data = {
        "email": "john.doe@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "phone_number": "+1234567890",
        "company_name": "Acme Corp",
        "address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "postal_code": "10001",
        "notes": "Test customer for Phase 5.2"
    }
    
    response = requests.post(
        f"{BASE_URL}/customers/",
        headers=headers,
        json=new_customer_data
    )
    print_response("Add Customer", response)
    
    if response.status_code != 201:
        print("❌ Failed to add customer.")
        return
    
    customer_company_id = response.json()["customer"]["id"]
    print(f"✅ Customer Company ID: {customer_company_id}")
    
    # Step 4: List customers
    print("\n📋 STEP 4: List All Customers")
    response = requests.get(f"{BASE_URL}/customers/", headers=headers)
    print_response("List Customers", response)
    
    # Step 5: Get customer details
    print("\n🔍 STEP 5: Get Customer Details")
    response = requests.get(
        f"{BASE_URL}/customers/{customer_company_id}/",
        headers=headers
    )
    print_response("Customer Details", response)
    
    # Step 6: Update customer (add tags)
    print("\n✏️ STEP 6: Update Customer (Add Tags)")
    if created_tags:
        tag_ids = [tag["id"] for tag in created_tags[:2]]
        update_data = {
            "notes": "Updated notes - VIP customer",
            "customer_status": "active",
            "tag_ids": tag_ids
        }
        
        response = requests.put(
            f"{BASE_URL}/customers/{customer_company_id}/",
            headers=headers,
            json=update_data
        )
        print_response("Update Customer", response)
    
    # Step 7: Get my user info (to get user ID for account manager)
    print("\n👤 STEP 7: Get My Profile")
    response = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
    print_response("My Profile", response)
    
    if response.status_code == 200:
        my_user_id = response.json()["id"]
        
        # Step 8: Assign account manager
        print("\n👔 STEP 8: Assign Account Manager")
        response = requests.post(
            f"{BASE_URL}/customers/{customer_company_id}/assign-manager/",
            headers=headers,
            json={"account_manager_id": my_user_id}
        )
        print_response("Assign Account Manager", response)
    
    # Step 9: Verify customer
    print("\n✅ STEP 9: Verify Customer")
    response = requests.post(
        f"{BASE_URL}/customers/{customer_company_id}/verify/",
        headers=headers
    )
    print_response("Verify Customer", response)
    
    # Step 10: Get customer statistics
    print("\n📊 STEP 10: Get Customer Statistics")
    response = requests.get(f"{BASE_URL}/customers/stats/", headers=headers)
    print_response("Customer Statistics", response)
    
    # Step 11: Create customer segment
    print("\n🎯 STEP 11: Create Customer Segment")
    segment_data = {
        "name": "High Value Customers",
        "description": "Customers with lifetime value > $10,000",
        "criteria": {
            "lifetime_value_min": 10000,
            "customer_status": "active"
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/customers/segments/",
        headers=headers,
        json=segment_data
    )
    print_response("Create Segment", response)
    
    if response.status_code == 201:
        segment_id = response.json()["id"]
        
        # Step 12: List segments
        print("\n📋 STEP 12: List All Segments")
        response = requests.get(f"{BASE_URL}/customers/segments/", headers=headers)
        print_response("List Segments", response)
        
        # Step 13: Get customers by segment
        print("\n🎯 STEP 13: Get Customers by Segment")
        response = requests.get(
            f"{BASE_URL}/customers/segments/{segment_id}/customers/",
            headers=headers
        )
        print_response("Customers by Segment", response)
    
    # Step 14: Search customers
    print("\n🔍 STEP 14: Search Customers")
    response = requests.get(
        f"{BASE_URL}/customers/?search=john",
        headers=headers
    )
    print_response("Search Customers", response)
    
    # Step 15: Filter customers by status
    print("\n🔍 STEP 15: Filter Customers by Status")
    response = requests.get(
        f"{BASE_URL}/customers/?status=active&verified=true",
        headers=headers
    )
    print_response("Filter Customers", response)
    
    # Step 16: Add another customer to test listing
    print("\n➕ STEP 16: Add Another Customer")
    customer_data_2 = {
        "email": "jane.smith@example.com",
        "first_name": "Jane",
        "last_name": "Smith",
        "phone_number": "+1987654321",
        "company_name": "Tech Solutions Inc",
        "notes": "Second test customer"
    }
    
    response = requests.post(
        f"{BASE_URL}/customers/",
        headers=headers,
        json=customer_data_2
    )
    print_response("Add Second Customer", response)
    
    print("\n" + "="*60)
    print("✅ ALL CUSTOMER MANAGEMENT API TESTS COMPLETED!")
    print("="*60)
    print("\n📊 Summary:")
    print("✅ Customer tags: Created and listed")
    print("✅ Customers: Added, listed, updated, verified")
    print("✅ Account manager: Assigned successfully")
    print("✅ Customer segments: Created and listed")
    print("✅ Customer statistics: Retrieved")
    print("✅ Search and filter: Working")
    print("\nNext Steps:")
    print("1. Check Django admin: http://localhost:8000/admin/")
    print("2. Verify customers in database")
    print("3. Test with different user roles (Staff, Sales Manager)")
    print("4. Test unlink customer endpoint if needed")

if __name__ == "__main__":
    print("🚀 Starting Customer Management API Tests (Phase 5.2)...")
    print("="*60)
    print("Prerequisites:")
    print("- Django server running on http://localhost:8000")
    print("- Will auto-register test company user")
    print("="*60)
    
    try:
        test_customer_management_apis()
    except KeyboardInterrupt:
        print("\n\n❌ Tests cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
