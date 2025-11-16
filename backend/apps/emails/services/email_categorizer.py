from django.conf import settings
from apps.emails.models import Email, EmailThread

COMPLAINT_KEYWORDS = {"complaint", "issue", "problem", "refund", "unhappy", "angry"}


def categorize_email(email: Email):
    """Rule-based categorization with optional AI override."""
    body = (email.body_text or "")[:2000].lower()
    sender = email.from_email.lower()
    category = EmailThread.CATEGORY_PRIMARY

    if any(k in body for k in COMPLAINT_KEYWORDS):
        category = EmailThread.CATEGORY_COMPLAINT
    # Placeholder checks for lead/deal/customer relationships
    if email.thread.lead_id:
        category = EmailThread.CATEGORY_LEAD
    elif email.thread.deal_id:
        category = EmailThread.CATEGORY_DEAL
    elif email.thread.customer_id:
        category = EmailThread.CATEGORY_CUSTOMER

    sentiment = None

    if getattr(settings, 'AI_EMAIL_SORTING_ENABLED', False):
        try:
            from .ai_categorizer import ai_categorize_email
            ai_result = ai_categorize_email(email)
            category = ai_result.get('category', category)
            sentiment = ai_result.get('sentiment')
        except Exception:  # noqa: BLE001
            pass  # fallback silently

    thread = email.thread
    thread.category = category
    if sentiment:
        thread.sentiment = sentiment
    thread.save(update_fields=["category", "sentiment"] if sentiment else ["category"])
    return category
