import smtplib
import base64
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from django.conf import settings
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from .email_parser import clean_html
from apps.emails.models import Email, EmailAccount
from django.utils import timezone
from .encryption import decrypt_secret


def _get_default_account(user):
    return EmailAccount.objects.filter(user=user, is_default=True, is_active=True).first()


def send_email(to, subject, body_html, body_text, from_account=None, attachments=None, cc=None, bcc=None, reply_to_email: Email | None = None):
    """Send email via SMTP or Gmail API. Updates Email record status.

    Creates an Email + EmailThread if necessary before sending if from_account provided.
    """
    if from_account is None:
        from_account = _get_default_account(reply_to_email.created_by if reply_to_email else None)
    if from_account is None:
        raise ValueError("No sending account available")

    # Create or reuse thread
    if reply_to_email:
        thread = reply_to_email.thread
    else:
        from apps.emails.models import EmailThread
        thread = EmailThread.objects.create(
            company=from_account.company,
            email_account=from_account,
            subject=subject,
            participants=[from_account.email] + to,
            last_message_at=timezone.now(),
        )

    email = Email.objects.create(
        thread=thread,
        email_account=from_account,
        message_id=f"local-{thread.id}-{timezone.now().timestamp()}",
        from_email=from_account.email,
        from_name="",
        to_emails=to,
        cc_emails=cc or [],
        bcc_emails=bcc or [],
        subject=subject,
        body_text=body_text or (clean_html(body_html) if body_html else ""),
        body_html=body_html or "",
        direction=Email.DIRECTION_OUTBOUND,
        status=Email.STATUS_QUEUED,
        created_by=from_account.user,
        reply_to=reply_to_email,
    )

    try:
        if from_account.provider == EmailAccount.PROVIDER_GMAIL:
            _send_via_gmail_api(from_account, email)
        else:
            _send_via_smtp(from_account, email)
        email.status = Email.STATUS_SENT
        email.sent_at = timezone.now()
        email.save(update_fields=["status", "sent_at"])
    except Exception as exc:  # noqa: BLE001
        email.status = Email.STATUS_FAILED
        email.save(update_fields=["status"])
        raise
    return email


def _send_via_smtp(account: EmailAccount, email: Email):
    host = account.smtp_host or settings.EMAIL_HOST
    port = account.smtp_port or settings.EMAIL_PORT
    msg = MIMEMultipart("alternative")
    msg["Subject"] = email.subject
    msg["From"] = account.email
    msg["To"] = ",".join(email.to_emails)
    if email.cc_emails:
        msg["Cc"] = ",".join(email.cc_emails)
    if email.body_text:
        msg.attach(MIMEText(email.body_text, "plain"))
    if email.body_html:
        msg.attach(MIMEText(email.body_html, "html"))

    with smtplib.SMTP(host, port) as server:
        server.starttls()
        server.login(account.username, decrypt_secret(account.password))
        server.sendmail(account.email, email.to_emails + (email.cc_emails or []) + (email.bcc_emails or []), msg.as_string())


def _send_via_gmail_api(account: EmailAccount, email: Email):
    # Placeholder: expects account to have stored OAuth tokens in password field (encrypted)
    token_data = decrypt_secret(account.password)
    try:
        token_info = json.loads(token_data)
    except json.JSONDecodeError:
        token_info = {}
    creds = Credentials.from_authorized_user_info(token_info)
    service = build('gmail', 'v1', credentials=creds)
    from email.mime.text import MIMEText as _MT
    message = _MT(email.body_html or email.body_text)
    message['to'] = ",".join(email.to_emails)
    message['from'] = account.email
    message['subject'] = email.subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    service.users().messages().send(userId='me', body={'raw': raw}).execute()
