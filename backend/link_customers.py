"""Link existing customers to test company"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import Customer, User, Company, CustomerCompany, CompanyUser

# Get test CEO user
ceo_email = "testceo@example.com"
try:
    ceo_user = User.objects.get(email=ceo_email)
    print(f'Found CEO user: {ceo_user.email}')
    
    # Get their company
    try:
        company_user = CompanyUser.objects.get(user=ceo_user)
        company = company_user.company
        print(f'Found company: {company.company_name} (ID: {company.id})')
        
        # Get customers not linked to this company
        all_customers = Customer.objects.all()
        print(f'\nTotal customers: {all_customers.count()}')
        
        # Link the first 3 customers to this company
        linked_count = 0
        for customer in all_customers[:3]:
            # Check if already linked
            existing = CustomerCompany.objects.filter(
                customer=customer,
                company=company
            ).exists()
            
            if not existing:
                CustomerCompany.objects.create(
                    customer=customer,
                    company=company,
                    verified=True,
                    added_by=ceo_user
                )
                print(f'✓ Linked {customer.user.email} to {company.company_name}')
                linked_count += 1
            else:
                print(f'- {customer.user.email} already linked')
        
        print(f'\n✓ Linked {linked_count} new customers')
        
        # Show final count
        company_customers = CustomerCompany.objects.filter(company=company).count()
        print(f'Total customers for {company.company_name}: {company_customers}')
        
    except CompanyUser.DoesNotExist:
        print(f'✗ No company found for {ceo_email}')
        
except User.DoesNotExist:
    print(f'✗ User {ceo_email} not found')
