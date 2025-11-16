"""
Direct Django shell script to verify user setup and create test customer
"""
import os
import django
import sys

# Setup Django
sys.path.insert(0, r'h:\puppy_crm\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User, Company, CompanyUser, Customer, CustomerCompany
from apps.customers.models import CustomerProfile
from datetime import date, datetime

print("=" * 80)
print("Verifying Test User Setup and Creating Test Customer")
print("=" * 80)

# Check if test user exists
try:
    user = User.objects.get(email='testceo@example.com')
    print(f"\n✓ Found user: {user.first_name} {user.last_name} (ID: {user.id})")
    print(f"  Account type: {user.account_type}")
    print(f"  Email: {user.email}")
    
    # Check CompanyUser relationship
    try:
        company_user = CompanyUser.objects.select_related('company').get(user=user, is_active=True)
        print(f"\n✓ Found CompanyUser relationship:")
        print(f"  Company: {company_user.company.company_name}")
        print(f"  Role: {company_user.role}")
        print(f"  Is Active: {company_user.is_active}")
        
        # Check for existing customers via CustomerCompany relationship
        customer_companies = CustomerCompany.objects.filter(company=company_user.company).select_related('customer__user')
        if customer_companies.exists():
            print(f"\n✓ Found {customer_companies.count()} existing customers:")
            for cc in customer_companies:
                print(f"  - {cc.customer.user.get_full_name()} (Customer ID: {cc.customer.id}, Email: {cc.customer.user.email})")
        else:
            print("\n→ No customers found. Creating test customer...")
            
            # Create test customer user
            customer_user = User.objects.create_user(
                username="john.doe@testcustomer.com",
                email="john.doe@testcustomer.com",
                password="TestCustomer123!",
                first_name="John",
                last_name="Doe",
                account_type="customer",
                phone="+1555123456"
            )
            
            # Create customer profile
            customer = Customer.objects.create(
                user=customer_user,
                address="123 Test Street",
                city="Test City",
                country="USA"
            )
            
            # Link customer to company
            customer_company = CustomerCompany.objects.create(
                customer=customer,
                company=company_user.company,
                verified=True,
                verified_at=datetime.now(),
                added_by=user,
                customer_since=datetime.now(),
                customer_status='active',
                notes="Test customer for order API testing"
            )
            
            # Create customer profile with extended info
            customer_profile = CustomerProfile.objects.create(
                customer=customer,
                customer_type='business',
                company_size='10-50',
                industry='Technology',
                notes="Test customer for API testing"
            )
            
            print(f"\n✓ Created test customer:")
            print(f"  User ID: {customer_user.id}")
            print(f"  Customer ID: {customer.id}")
            print(f"  Name: {customer_user.get_full_name()}")
            print(f"  Email: {customer_user.email}")
            print(f"  Linked to Company: {company_user.company.company_name}")
        
        print("\n✓ Setup complete! Ready to run order API tests.")
        
    except CompanyUser.DoesNotExist:
        print("\n✗ ERROR: No CompanyUser relationship found!")
        print("  User cannot access company APIs without this relationship.")
        
except User.DoesNotExist:
    print("\n✗ ERROR: Test user not found!")
    print("  Please run setup_test_user.py first.")

print("=" * 80)
