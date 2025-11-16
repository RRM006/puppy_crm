"""Quick script to check and create test customer"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import Customer, User, Company, CustomerCompany

# Check existing customers
customers = Customer.objects.all()
print(f'Found {customers.count()} customers:')
for c in customers:
    companies_count = c.companies.count()
    print(f'  - {c.user.email} (ID: {c.id}, Companies: {companies_count})')

# Check if we have a test company
companies = Company.objects.filter(company_name__icontains='test')
print(f'\nFound {companies.count()} test companies:')
for comp in companies:
    print(f'  - {comp.company_name} (ID: {comp.id})')

# Create a test customer if needed
if customers.count() == 0:
    print('\n Creating test customer...')
    
    # Create customer user
    user = User.objects.create_user(
        email='testcustomer@example.com',
        password='TestPass123!',
        first_name='John',
        last_name='Doe',
        account_type='customer',
        phone='+1234567890'
    )
    
    # Create customer profile  
    customer = Customer.objects.create(
        user=user,
        date_of_birth='1990-01-01',
        address='123 Test St',
        city='Test City',
        country='USA'
    )
    
    # Link to first test company if available
    if companies.exists():
        company = companies.first()
        CustomerCompany.objects.create(
            customer=customer,
            company=company,
            verified=True,
            added_by=company.created_by
        )
        print(f'✓ Customer created and linked to {company.company_name}')
    else:
        print(f'✓ Customer created (not linked to any company)')
    
    print(f'  Email: {user.email}')
    print(f'  Password: TestPass123!')
    print(f'  Customer ID: {customer.id}')
else:
    print('\n✓ Test customers already exist')
