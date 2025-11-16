"""
Test Customer Portal APIs - Phase 5.5
Tests customer-facing portal endpoints (B2C).
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
# Customer credentials (will need to be created)
CUSTOMER_EMAIL = "john.doe@testcustomer.com"
CUSTOMER_PASSWORD = "TestCustomer123!"

# Test data storage
tokens = {}
test_data = {}


def print_header(text):
    """Print a formatted test section header."""
    print("\n" + "=" * 80)
    print(f" {text}")
    print("=" * 80)


def print_response(response):
    """Print formatted response data."""
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print(json.dumps(data, indent=2))
    except:
        print(response.text[:500])
    print("-" * 80)


def test_customer_login():
    """Test customer login."""
    print_header("Test 1: Customer Login")
    
    url = f"{BASE_URL}/api/auth/login/"
    payload = {
        "email": CUSTOMER_EMAIL,
        "password": CUSTOMER_PASSWORD
    }
    
    response = requests.post(url, json=payload)
    print_response(response)
    
    if response.status_code == 200:
        data = response.json()
        tokens['access'] = data['tokens']['access']
        tokens['refresh'] = data['tokens']['refresh']
        print("✓ Customer login successful")
        return True
    else:
        print("✗ Customer login failed")
        return False


def get_headers():
    """Get headers with authentication token."""
    return {
        "Authorization": f"Bearer {tokens['access']}",
        "Content-Type": "application/json"
    }


def test_customer_dashboard():
    """Test customer dashboard."""
    print_header("Test 2: Customer Dashboard")
    
    url = f"{BASE_URL}/api/customer/dashboard/"
    response = requests.get(url, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        data = response.json()
        # Save data for later tests
        if data.get('recent_orders'):
            test_data['order_id'] = data['recent_orders'][0]['id']
        print("✓ Dashboard loaded successfully")
        return True
    else:
        print("✗ Failed to load dashboard")
        return False


def test_my_companies():
    """Test listing customer's companies."""
    print_header("Test 3: My Companies")
    
    url = f"{BASE_URL}/api/customer/my-companies/"
    response = requests.get(url, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('results'):
            test_data['company_id'] = data['results'][0]['company_id']
        print("✓ Companies listed successfully")
        return True
    else:
        print("✗ Failed to list companies")
        return False


def test_my_orders():
    """Test listing customer's orders."""
    print_header("Test 4: My Orders")
    
    # Test basic listing
    url = f"{BASE_URL}/api/customer/my-orders/"
    response = requests.get(url, headers=get_headers())
    print("All orders:")
    print_response(response)
    
    # Test with filters if we have a company
    if 'company_id' in test_data:
        url = f"{BASE_URL}/api/customer/my-orders/?company={test_data['company_id']}"
        response = requests.get(url, headers=get_headers())
        print("\nFiltered by company:")
        print_response(response)
    
    if response.status_code == 200:
        print("✓ Orders listed successfully")
        return True
    else:
        print("✗ Failed to list orders")
        return False


def test_order_detail():
    """Test viewing order details."""
    print_header("Test 5: Order Details")
    
    if 'order_id' not in test_data:
        print("⚠ No order ID available - skipping test")
        return True
    
    url = f"{BASE_URL}/api/customer/orders/{test_data['order_id']}/"
    response = requests.get(url, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Order details retrieved successfully")
        return True
    else:
        print("✗ Failed to get order details")
        return False


def test_order_tracking():
    """Test order tracking."""
    print_header("Test 6: Order Tracking")
    
    if 'order_id' not in test_data:
        print("⚠ No order ID available - skipping test")
        return True
    
    url = f"{BASE_URL}/api/customer/orders/{test_data['order_id']}/tracking/"
    response = requests.get(url, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Order tracking retrieved successfully")
        return True
    else:
        print("✗ Failed to get order tracking")
        return False


def test_request_verification():
    """Test requesting verification from a company."""
    print_header("Test 7: Request Verification")
    
    if 'company_id' not in test_data:
        print("⚠ No company ID available - skipping test")
        return True
    
    url = f"{BASE_URL}/api/customer/request-verification/{test_data['company_id']}/"
    response = requests.post(url, headers=get_headers())
    print_response(response)
    
    if response.status_code in [200, 201]:
        print("✓ Verification request processed successfully")
        return True
    else:
        print("✗ Failed to request verification")
        return False


def run_all_tests():
    """Run all customer portal API tests in sequence."""
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 17 + "CUSTOMER PORTAL API TESTS - PHASE 5.5" + " " * 21 + "║")
    print("╚" + "=" * 78 + "╝")
    
    tests = [
        ("Customer Login", test_customer_login),
        ("Customer Dashboard", test_customer_dashboard),
        ("My Companies", test_my_companies),
        ("My Orders", test_my_orders),
        ("Order Details", test_order_detail),
        ("Order Tracking", test_order_tracking),
        ("Request Verification", test_request_verification),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
            if not result and test_name == "Customer Login":
                print("\n⚠️  Critical test failed. Stopping test execution.")
                print("Note: Make sure customer user exists with credentials:")
                print(f"  Email: {CUSTOMER_EMAIL}")
                print(f"  Password: {CUSTOMER_PASSWORD}")
                break
        except Exception as e:
            print(f"\n⚠️  Exception in {test_name}: {str(e)}")
            results.append((test_name, False))
    
    # Print summary
    print_header("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print("\n" + "-" * 80)
    print(f"Total: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print("=" * 80 + "\n")
    
    if passed == total:
        print("🎉 All tests passed! Customer Portal APIs are working correctly.")
    else:
        print("⚠️  Some tests failed. Please review the errors above.")


if __name__ == "__main__":
    run_all_tests()
