"""
Test Order Management APIs - Phase 5.3
Tests all order CRUD operations, item management, and statistics.
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
EMAIL = "testceo@example.com"
PASSWORD = "TestPass123!"

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
        print(response.text)
    print("-" * 80)


def test_login():
    """Test user login and get tokens."""
    print_header("Test 1: Login")
    
    url = f"{BASE_URL}/api/auth/login/"
    payload = {
        "email": EMAIL,
        "password": PASSWORD
    }
    
    response = requests.post(url, json=payload)
    print_response(response)
    
    if response.status_code == 200:
        data = response.json()
        tokens['access'] = data['tokens']['access']
        tokens['refresh'] = data['tokens']['refresh']
        print("✓ Login successful - Tokens saved")
        return True
    else:
        print("✗ Login failed")
        return False


def get_headers():
    """Get headers with authentication token."""
    return {
        "Authorization": f"Bearer {tokens['access']}",
        "Content-Type": "application/json"
    }


def test_get_customers():
    """Get list of customers to use in order tests."""
    print_header("Test 2: Get Customers (for order creation)")
    
    url = f"{BASE_URL}/api/customers/"
    response = requests.get(url, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        data = response.json()
        if data['results']:
            test_data['customer_id'] = data['results'][0]['id']
            test_data['customer_name'] = data['results'][0]['name']
            print(f"✓ Using customer ID {test_data['customer_id']} ({test_data['customer_name']}) for tests")
            return True
        else:
            print("✗ No customers found - Please create a customer first")
            return False
    else:
        print("✗ Failed to get customers")
        return False


def test_create_order():
    """Test creating a new order with items."""
    print_header("Test 3: Create Order with Items")
    
    url = f"{BASE_URL}/api/orders/"
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    payload = {
        "customer_id": test_data['customer_id'],
        "title": "Test Order - Product Purchase",
        "description": "Test order created via API test script",
        "currency": "USD",
        "expected_delivery_date": tomorrow,
        "shipping_address": "123 Test Street, Test City, TC 12345",
        "billing_address": "123 Test Street, Test City, TC 12345",
        "payment_method": "credit_card",
        "notes": "This is a test order",
        "items": [
            {
                "product_name": "Premium Widget",
                "product_sku": "TEST-WDG-001",
                "quantity": 2,
                "unit_price": 99.99,
                "discount": 10.00,
                "tax": 15.00
            },
            {
                "product_name": "Basic Widget",
                "product_sku": "TEST-WDG-002",
                "quantity": 1,
                "unit_price": 49.99,
                "discount": 0.00,
                "tax": 4.00
            }
        ]
    }
    
    response = requests.post(url, json=payload, headers=get_headers())
    print_response(response)
    
    if response.status_code == 201:
        data = response.json()
        test_data['order_id'] = data['order']['id']
        test_data['order_number'] = data['order']['order_number']
        test_data['item_ids'] = [item['id'] for item in data['order']['items']]
        print(f"✓ Order created successfully - ID: {test_data['order_id']}, Number: {test_data['order_number']}")
        return True
    else:
        print("✗ Failed to create order")
        return False


def test_list_orders():
    """Test listing all orders with filtering."""
    print_header("Test 4: List Orders with Filters")
    
    # Test basic listing
    url = f"{BASE_URL}/api/orders/"
    response = requests.get(url, headers=get_headers())
    print("All orders:")
    print_response(response)
    
    # Test with filters
    url = f"{BASE_URL}/api/orders/?status=pending&sort_by=-order_date"
    response = requests.get(url, headers=get_headers())
    print("\nFiltered by status=pending, sorted by newest:")
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Order listing successful")
        return True
    else:
        print("✗ Failed to list orders")
        return False


def test_get_order_detail():
    """Test getting order details."""
    print_header("Test 5: Get Order Details")
    
    url = f"{BASE_URL}/api/orders/{test_data['order_id']}/"
    response = requests.get(url, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Order details retrieved successfully")
        return True
    else:
        print("✗ Failed to get order details")
        return False


def test_update_order_status():
    """Test updating order status."""
    print_header("Test 6: Update Order Status to Processing")
    
    url = f"{BASE_URL}/api/orders/{test_data['order_id']}/update-status/"
    payload = {
        "status": "processing",
        "notes": "Order is being prepared for shipment"
    }
    
    response = requests.post(url, json=payload, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Order status updated successfully")
        return True
    else:
        print("✗ Failed to update order status")
        return False


def test_add_order_item():
    """Test adding an item to existing order."""
    print_header("Test 7: Add Item to Order")
    
    url = f"{BASE_URL}/api/orders/{test_data['order_id']}/add-item/"
    payload = {
        "product_name": "Extra Widget",
        "product_sku": "TEST-WDG-003",
        "quantity": 1,
        "unit_price": 29.99,
        "discount": 0.00,
        "tax": 2.50
    }
    
    response = requests.post(url, json=payload, headers=get_headers())
    print_response(response)
    
    if response.status_code == 201:
        data = response.json()
        test_data['item_ids'].append(data['item']['id'])
        print("✓ Item added successfully")
        return True
    else:
        print("✗ Failed to add item")
        return False


def test_update_order():
    """Test updating order information."""
    print_header("Test 8: Update Order (Add Tracking Number)")
    
    url = f"{BASE_URL}/api/orders/{test_data['order_id']}/"
    payload = {
        "status": "shipped",
        "payment_status": "paid",
        "tracking_number": "TRACK123456789",
        "notes": "Package shipped via FedEx Express"
    }
    
    response = requests.put(url, json=payload, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Order updated successfully")
        return True
    else:
        print("✗ Failed to update order")
        return False


def test_customer_orders():
    """Test getting orders for a specific customer."""
    print_header("Test 9: Get Customer Orders")
    
    url = f"{BASE_URL}/api/orders/customer/{test_data['customer_id']}/"
    response = requests.get(url, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Customer orders retrieved successfully")
        return True
    else:
        print("✗ Failed to get customer orders")
        return False


def test_order_statistics():
    """Test getting order statistics."""
    print_header("Test 10: Get Order Statistics")
    
    url = f"{BASE_URL}/api/orders/stats/"
    response = requests.get(url, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Order statistics retrieved successfully")
        return True
    else:
        print("✗ Failed to get order statistics")
        return False


def test_remove_order_item():
    """Test removing an item from order."""
    print_header("Test 11: Remove Item from Order")
    
    # Remove the extra item we added (not one of the original items)
    item_to_remove = test_data['item_ids'][-1]
    url = f"{BASE_URL}/api/orders/{test_data['order_id']}/items/{item_to_remove}/"
    
    response = requests.delete(url, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Item removed successfully")
        return True
    else:
        print("✗ Failed to remove item")
        return False


def test_cancel_order():
    """Test cancelling an order."""
    print_header("Test 12: Cancel Order")
    
    url = f"{BASE_URL}/api/orders/{test_data['order_id']}/"
    response = requests.delete(url, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Order cancelled successfully")
        return True
    else:
        print("✗ Failed to cancel order")
        return False


def run_all_tests():
    """Run all order API tests in sequence."""
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 20 + "ORDER MANAGEMENT API TESTS - PHASE 5.3" + " " * 20 + "║")
    print("╚" + "=" * 78 + "╝")
    
    tests = [
        ("Login", test_login),
        ("Get Customers", test_get_customers),
        ("Create Order", test_create_order),
        ("List Orders", test_list_orders),
        ("Get Order Details", test_get_order_detail),
        ("Update Order Status", test_update_order_status),
        ("Add Order Item", test_add_order_item),
        ("Update Order", test_update_order),
        ("Get Customer Orders", test_customer_orders),
        ("Get Order Statistics", test_order_statistics),
        ("Remove Order Item", test_remove_order_item),
        ("Cancel Order", test_cancel_order),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
            if not result and test_name in ["Login", "Get Customers"]:
                print("\n⚠️  Critical test failed. Stopping test execution.")
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
        print("🎉 All tests passed! Order Management APIs are working correctly.")
    else:
        print("⚠️  Some tests failed. Please review the errors above.")


if __name__ == "__main__":
    run_all_tests()
