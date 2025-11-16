from celery import shared_task
from celery.utils.log import get_task_logger
from apps.emails.models import Email, EmailAccount, EmailRule
from apps.emails.services.email_sender import send_email
from apps.emails.services.email_receiver import sync_emails
from apps.emails.services.email_categorizer import categorize_email


logger = get_task_logger(__name__)


@shared_task(bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 3, 'countdown': 10})
def send_email_task(self, email_id: int):
    email = Email.objects.get(id=email_id)
    try:
        send_email(email.to_emails, email.subject, email.body_html, email.body_text, from_account=email.email_account, reply_to_email=email.reply_to)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Send failed for email %s: %s", email_id, exc)
        raise


@shared_task
def sync_email_account_task(email_account_id: int):
    account = EmailAccount.objects.get(id=email_account_id)
    return sync_emails(account)


@shared_task
def sync_all_accounts_task():
    for account in EmailAccount.objects.filter(is_active=True, sync_enabled=True):
        sync_email_account_task.delay(account.id)
    return True


@shared_task
def process_email_rules_task(email_id: int):
    email = Email.objects.get(id=email_id)
    categorize_email(email)
    rules = EmailRule.objects.filter(company=email.email_account.company, is_active=True)
    applied = 0
    for rule in rules:
        # Simple keyword condition matching in subject/body
        keywords = rule.conditions.get('keywords', []) if isinstance(rule.conditions, dict) else []
        if keywords and not any(k.lower() in (email.subject.lower() + email.body_text.lower()) for k in keywords):
            continue
        action = rule.actions.get('action') if isinstance(rule.actions, dict) else None
        if action == 'send_template' and rule.template_id:
            try:
                from apps.emails.services.email_sender import send_email
                template = rule.template
                context = {'company_name': email.email_account.company.company_name}
                from apps.emails.services.template_renderer import render_template
                rendered = render_template(template, context)
                send_email(
                    to=[email.from_email],
                    subject=rendered['subject'],
                    body_html=rendered['body_html'],
                    body_text=rendered['body_text'],
                    from_account=email.email_account,
                )
                applied += 1
            except Exception:  # noqa: BLE001
                continue
    return applied
