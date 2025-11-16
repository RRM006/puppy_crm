import imapclient
from django.utils import timezone
from django.conf import settings
from django.core.files.base import ContentFile
from apps.emails.models import EmailAccount, EmailThread, Email, EmailAttachment
from .email_parser import parse_email_message
from .email_categorizer import categorize_email


def sync_emails(email_account: EmailAccount, limit: int = 20):
    """Sync latest emails via IMAP (simplified)."""
    if email_account.provider not in (EmailAccount.PROVIDER_IMAP, EmailAccount.PROVIDER_GMAIL):
        return 0
    emails_synced = 0
    # Placeholder IMAP logic
    if email_account.imap_host and email_account.imap_port:
        try:
            client = imapclient.IMAPClient(email_account.imap_host, port=email_account.imap_port, ssl=True)
            client.login(email_account.username, email_account.password)
            client.select_folder('INBOX')
            messages = client.search(['NOT', 'DELETED'])[-limit:]
            for msgid in messages:
                raw = client.fetch([msgid], ['RFC822'])[msgid][b'RFC822']
                parsed = parse_email_message(raw)
                thread = EmailThread.objects.create(
                    company=email_account.company,
                    email_account=email_account,
                    subject=parsed['headers'].get('Subject', '(No Subject)'),
                    participants=[parsed['headers'].get('From')],
                    last_message_at=timezone.now(),
                )
                email = Email.objects.create(
                    thread=thread,
                    email_account=email_account,
                    message_id=parsed['headers'].get('Message-ID', f'imap-{msgid}'),
                    from_email=parsed['headers'].get('From', ''),
                    subject=parsed['headers'].get('Subject', '(No Subject)'),
                    to_emails=[parsed['headers'].get('To', '')],
                    body_text=parsed['body_text'],
                    body_html=parsed['body_html'],
                    direction=Email.DIRECTION_INBOUND,
                    status=Email.STATUS_DELIVERED,
                )
                if parsed['attachments']:
                    for att in parsed['attachments']:
                        if att['data']:
                            EmailAttachment.objects.create(
                                email=email,
                                file_name=att['file_name'] or 'attachment.bin',
                                file_size=len(att['data']),
                                file_type=att['content_type'],
                                file_path=ContentFile(att['data'], name=att['file_name'] or 'attachment.bin'),
                            )
                    email.has_attachments = True
                    email.save(update_fields=["has_attachments"])
                categorize_email(email)
                emails_synced += 1
        except Exception:  # noqa: BLE001
            pass
    email_account.last_sync = timezone.now()
    email_account.save(update_fields=["last_sync"])
    return emails_synced
