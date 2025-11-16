from django.core.management.base import BaseCommand
from apps.emails.models import EmailTemplate, EmailAccount

DEFAULT_TEMPLATES = [
    {
        'name': 'Welcome Email',
        'subject': 'Welcome to {company_name}',
        'body_html': '<h1>Welcome {customer_name}</h1><p>Glad to have you with {company_name}.</p>',
        'category': 'customer'
    },
    {
        'name': 'Follow Up',
        'subject': 'Following up on our conversation',
        'body_html': '<p>Hello {customer_name}, just following up.</p>',
        'category': 'general'
    },
    {
        'name': 'Thank You',
        'subject': 'Thank you from {company_name}',
        'body_html': '<p>Thank you {customer_name} for your time.</p>',
        'category': 'customer'
    },
]


class Command(BaseCommand):
    help = 'Seed default email templates for each company user'

    def handle(self, *args, **options):
        created = 0
        # Use existing email accounts to determine companies
        for account in EmailAccount.objects.select_related('company', 'user').all():
            for tmpl in DEFAULT_TEMPLATES:
                if not EmailTemplate.objects.filter(company=account.company, name=tmpl['name']).exists():
                    EmailTemplate.objects.create(
                        company=account.company,
                        created_by=account.user,
                        name=tmpl['name'],
                        subject=tmpl['subject'],
                        body_html=tmpl['body_html'],
                        category=tmpl['category'],
                    )
                    created += 1
        self.stdout.write(self.style.SUCCESS(f'Seeded {created} templates'))
