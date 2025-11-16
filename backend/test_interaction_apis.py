"""
Test Customer Interaction APIs - Phase 5.4
Tests interaction tracking, timeline, and statistics.
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
        print(response.text[:500])
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


def test_get_customer():
    """Get a customer ID for testing."""
    print_header("Test 2: Get Customer for Interaction Testing")
    
    # First check if we have customers
    url = f"{BASE_URL}/api/customers/"
    response = requests.get(url, headers=get_headers())
    
    if response.status_code == 200:
        data = response.json()
        if data.get('count', 0) > 0:
            test_data['customer_id'] = data['results'][0]['id']
            print(f"✓ Using customer ID: {test_data['customer_id']}")
            return True
    
    print("✗ No customers found")
    return False


def test_create_interaction():
    """Test creating a customer interaction."""
    print_header("Test 3: Create Customer Interaction")
    
    url = f"{BASE_URL}/api/interactions/"
    payload = {
        "customer_id": test_data['customer_id'],
        "interaction_type": "call",
        "subject": "Product inquiry call",
        "description": "Customer called to inquire about premium widget pricing and features. Showed strong interest.",
        "sentiment": "positive"
    }
    
    response = requests.post(url, json=payload, headers=get_headers())
    print_response(response)
    
    if response.status_code == 201:
        data = response.json()
        test_data['interaction_id'] = data['interaction']['id']
        print(f"✓ Interaction created - ID: {test_data['interaction_id']}")
        return True
    else:
        print("✗ Failed to create interaction")
        return False


def test_list_interactions():
    """Test listing interactions with filters."""
    print_header("Test 4: List Interactions")
    
    # Test basic listing
    url = f"{BASE_URL}/api/interactions/"
    response = requests.get(url, headers=get_headers())
    print("All interactions:")
    print_response(response)
    
    # Test with filters
    url = f"{BASE_URL}/api/interactions/?customer={test_data['customer_id']}&interaction_type=call"
    response = requests.get(url, headers=get_headers())
    print("\nFiltered by customer and type:")
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Interaction listing successful")
        return True
    else:
        print("✗ Failed to list interactions")
        return False


def test_get_interaction_detail():
    """Test getting interaction details."""
    print_header("Test 5: Get Interaction Details")
    
    url = f"{BASE_URL}/api/interactions/{test_data['interaction_id']}/"
    response = requests.get(url, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Interaction details retrieved successfully")
        return True
    else:
        print("✗ Failed to get interaction details")
        return False


def test_update_interaction():
    """Test updating an interaction."""
    print_header("Test 6: Update Interaction")
    
    url = f"{BASE_URL}/api/interactions/{test_data['interaction_id']}/"
    payload = {
        "subject": "Product inquiry call - Follow-up scheduled",
        "description": "Customer called to inquire about premium widget pricing. Follow-up demo scheduled for next week.",
        "sentiment": "positive"
    }
    
    response = requests.put(url, json=payload, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Interaction updated successfully")
        return True
    else:
        print("✗ Failed to update interaction")
        return False


def test_customer_interactions_timeline():
    """Test getting customer interaction timeline."""
    print_header("Test 7: Get Customer Interaction Timeline")
    
    url = f"{BASE_URL}/api/customers/{test_data['customer_id']}/interactions/"
    response = requests.get(url, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Customer timeline retrieved successfully")
        return True
    else:
        print("✗ Failed to get customer timeline")
        return False


def test_interaction_statistics():
    """Test getting interaction statistics."""
    print_header("Test 8: Get Interaction Statistics")
    
    url = f"{BASE_URL}/api/interactions/stats/"
    response = requests.get(url, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Interaction statistics retrieved successfully")
        return True
    else:
        print("✗ Failed to get interaction statistics")
        return False


def test_create_additional_interactions():
    """Test creating multiple interactions for better statistics."""
    print_header("Test 9: Create Additional Interactions")
    
    interactions = [
        {
            "interaction_type": "email",
            "subject": "Follow-up email",
            "description": "Sent product brochure and pricing details",
            "sentiment": "neutral"
        },
        {
            "interaction_type": "meeting",
            "subject": "Product demo",
            "description": "Conducted virtual product demonstration. Customer very impressed.",
            "sentiment": "positive"
        },
        {
            "interaction_type": "support",
            "subject": "Setup assistance",
            "description": "Helped customer with initial setup",
            "sentiment": "neutral"
        }
    ]
    
    url = f"{BASE_URL}/api/interactions/"
    success_count = 0
    
    for interaction in interactions:
        interaction['customer_id'] = test_data['customer_id']
        response = requests.post(url, json=interaction, headers=get_headers())
        if response.status_code == 201:
            success_count += 1
    
    print(f"Created {success_count}/{len(interactions)} additional interactions")
    
    if success_count == len(interactions):
        print("✓ All additional interactions created successfully")
        return True
    else:
        print(f"⚠ Only {success_count} interactions created")
        return False


def test_delete_interaction():
    """Test deleting an interaction."""
    print_header("Test 10: Delete Interaction")
    
    url = f"{BASE_URL}/api/interactions/{test_data['interaction_id']}/"
    response = requests.delete(url, headers=get_headers())
    print_response(response)
    
    if response.status_code == 200:
        print("✓ Interaction deleted successfully")
        return True
    else:
        print("✗ Failed to delete interaction")
        return False


def run_all_tests():
    """Run all interaction API tests in sequence."""
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 15 + "CUSTOMER INTERACTION API TESTS - PHASE 5.4" + " " * 19 + "║")
    print("╚" + "=" * 78 + "╝")
    
    tests = [
        ("Login", test_login),
        ("Get Customer", test_get_customer),
        ("Create Interaction", test_create_interaction),
        ("List Interactions", test_list_interactions),
        ("Get Interaction Details", test_get_interaction_detail),
        ("Update Interaction", test_update_interaction),
        ("Customer Timeline", test_customer_interactions_timeline),
        ("Interaction Statistics", test_interaction_statistics),
        ("Create Additional Interactions", test_create_additional_interactions),
        ("Delete Interaction", test_delete_interaction),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
            if not result and test_name in ["Login", "Get Customer"]:
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
        print("🎉 All tests passed! Customer Interaction APIs are working correctly.")
    else:
        print("⚠️  Some tests failed. Please review the errors above.")


if __name__ == "__main__":
    run_all_tests()
