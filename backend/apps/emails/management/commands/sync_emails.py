from django.core.management.base import BaseCommand
from apps.emails.models import EmailAccount
from apps.emails.services.email_receiver import sync_emails


class Command(BaseCommand):
    help = 'Manual sync of all active email accounts'

    def handle(self, *args, **options):
        for account in EmailAccount.objects.filter(is_active=True, sync_enabled=True):
            count = sync_emails(account)
            self.stdout.write(self.style.SUCCESS(f"Synced {count} emails for {account.email}"))
