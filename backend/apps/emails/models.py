from django.conf import settings
from django.db import models
from django.utils import timezone

# Reference models via app labels to avoid tight coupling/import issues

class EmailAccount(models.Model):
    PROVIDER_GMAIL = 'gmail'
    PROVIDER_OUTLOOK = 'outlook'
    PROVIDER_SMTP = 'smtp'
    PROVIDER_IMAP = 'imap'
    PROVIDER_CHOICES = [
        (PROVIDER_GMAIL, 'Gmail'),
        (PROVIDER_OUTLOOK, 'Outlook'),
        (PROVIDER_SMTP, 'SMTP'),
        (PROVIDER_IMAP, 'IMAP'),
    ]

    company = models.ForeignKey('authentication.Company', on_delete=models.CASCADE, related_name='email_accounts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_accounts')
    email = models.EmailField()
    provider = models.CharField(max_length=32, choices=PROVIDER_CHOICES)
    smtp_host = models.CharField(max_length=255, blank=True)
    smtp_port = models.IntegerField(null=True, blank=True)
    imap_host = models.CharField(max_length=255, blank=True)
    imap_port = models.IntegerField(null=True, blank=True)
    username = models.CharField(max_length=255)
    password = models.CharField(max_length=512)  # encrypted storage placeholder
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    sync_enabled = models.BooleanField(default=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('company', 'email')
        indexes = [
            models.Index(fields=['company', 'email']),
            models.Index(fields=['user', 'is_default']),
        ]

    def __str__(self):
        return f"{self.email} ({self.company_id})"


class EmailThread(models.Model):
    CATEGORY_PRIMARY = 'primary'
    CATEGORY_SOCIAL = 'social'
    CATEGORY_PROMOTIONS = 'promotions'
    CATEGORY_UPDATES = 'updates'
    CATEGORY_LEAD = 'lead'
    CATEGORY_DEAL = 'deal'
    CATEGORY_CUSTOMER = 'customer'
    CATEGORY_COMPLAINT = 'complaint'
    CATEGORY_OTHER = 'other'
    CATEGORY_CHOICES = [
        (CATEGORY_PRIMARY, 'Primary'),
        (CATEGORY_SOCIAL, 'Social'),
        (CATEGORY_PROMOTIONS, 'Promotions'),
        (CATEGORY_UPDATES, 'Updates'),
        (CATEGORY_LEAD, 'Lead'),
        (CATEGORY_DEAL, 'Deal'),
        (CATEGORY_CUSTOMER, 'Customer'),
        (CATEGORY_COMPLAINT, 'Complaint'),
        (CATEGORY_OTHER, 'Other'),
    ]

    SENTIMENT_POSITIVE = 'positive'
    SENTIMENT_NEUTRAL = 'neutral'
    SENTIMENT_NEGATIVE = 'negative'
    SENTIMENT_CHOICES = [
        (SENTIMENT_POSITIVE, 'Positive'),
        (SENTIMENT_NEUTRAL, 'Neutral'),
        (SENTIMENT_NEGATIVE, 'Negative'),
    ]

    company = models.ForeignKey('authentication.Company', on_delete=models.CASCADE, related_name='email_threads')
    email_account = models.ForeignKey(EmailAccount, on_delete=models.CASCADE, related_name='threads')
    subject = models.CharField(max_length=500)
    participants = models.JSONField(default=list)
    lead = models.ForeignKey('crm.Lead', null=True, blank=True, on_delete=models.SET_NULL, related_name='email_threads')
    deal = models.ForeignKey('crm.Deal', null=True, blank=True, on_delete=models.SET_NULL, related_name='email_threads')
    customer = models.ForeignKey('authentication.Customer', null=True, blank=True, on_delete=models.SET_NULL, related_name='email_threads')
    last_message_at = models.DateTimeField()
    message_count = models.IntegerField(default=0)
    is_read = models.BooleanField(default=False)
    is_starred = models.BooleanField(default=False)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default=CATEGORY_PRIMARY)
    sentiment = models.CharField(max_length=16, choices=SENTIMENT_CHOICES, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['company', 'last_message_at']),
            models.Index(fields=['email_account', 'is_read']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return f"Thread: {self.subject[:50]} ({self.company_id})"


class Email(models.Model):
    DIRECTION_INBOUND = 'inbound'
    DIRECTION_OUTBOUND = 'outbound'
    DIRECTION_CHOICES = [
        (DIRECTION_INBOUND, 'Inbound'),
        (DIRECTION_OUTBOUND, 'Outbound'),
    ]

    STATUS_DRAFT = 'draft'
    STATUS_QUEUED = 'queued'
    STATUS_SENT = 'sent'
    STATUS_DELIVERED = 'delivered'
    STATUS_FAILED = 'failed'
    STATUS_BOUNCED = 'bounced'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_QUEUED, 'Queued'),
        (STATUS_SENT, 'Sent'),
        (STATUS_DELIVERED, 'Delivered'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_BOUNCED, 'Bounced'),
    ]

    thread = models.ForeignKey(EmailThread, on_delete=models.CASCADE, related_name='emails')
    email_account = models.ForeignKey(EmailAccount, on_delete=models.CASCADE, related_name='emails')
    message_id = models.CharField(max_length=255, unique=True)
    from_email = models.EmailField()
    from_name = models.CharField(max_length=255, blank=True)
    to_emails = models.JSONField(default=list)
    cc_emails = models.JSONField(null=True, blank=True)
    bcc_emails = models.JSONField(null=True, blank=True)
    subject = models.CharField(max_length=500)
    body_text = models.TextField()
    body_html = models.TextField(blank=True)
    direction = models.CharField(max_length=16, choices=DIRECTION_CHOICES)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    tracking_enabled = models.BooleanField(default=True)
    opens_count = models.IntegerField(default=0)
    clicks_count = models.IntegerField(default=0)
    reply_to = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='replies')
    has_attachments = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='sent_emails')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['thread', 'sent_at']),
            models.Index(fields=['email_account', 'status']),
            models.Index(fields=['direction']),
        ]

    def __str__(self):
        return f"Email {self.id} - {self.subject[:40]}"


class EmailAttachment(models.Model):
    email = models.ForeignKey(Email, on_delete=models.CASCADE, related_name='attachments')
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField()
    file_type = models.CharField(max_length=255)
    file_path = models.FileField(upload_to='email_attachments/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name


class EmailTemplate(models.Model):
    CATEGORY_LEAD = 'lead'
    CATEGORY_DEAL = 'deal'
    CATEGORY_CUSTOMER = 'customer'
    CATEGORY_GENERAL = 'general'
    CATEGORY_CHOICES = [
        (CATEGORY_LEAD, 'Lead'),
        (CATEGORY_DEAL, 'Deal'),
        (CATEGORY_CUSTOMER, 'Customer'),
        (CATEGORY_GENERAL, 'General'),
    ]

    company = models.ForeignKey('authentication.Company', on_delete=models.CASCADE, related_name='email_templates')
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=500)  # supports variables
    body_html = models.TextField()  # supports variables
    body_text = models.TextField(blank=True)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default=CATEGORY_GENERAL)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_templates')
    is_active = models.BooleanField(default=True)
    usage_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('company', 'name')
        indexes = [
            models.Index(fields=['company', 'category']),
        ]

    def __str__(self):
        return self.name


class EmailRule(models.Model):
    TRIGGER_EMAIL_RECEIVED = 'email_received'
    TRIGGER_EMAIL_SENT = 'email_sent'
    TRIGGER_LEAD_CREATED = 'lead_created'
    TRIGGER_DEAL_CREATED = 'deal_created'
    TRIGGER_CHOICES = [
        (TRIGGER_EMAIL_RECEIVED, 'EmailReceived'),
        (TRIGGER_EMAIL_SENT, 'EmailSent'),
        (TRIGGER_LEAD_CREATED, 'LeadCreated'),
        (TRIGGER_DEAL_CREATED, 'DealCreated'),
    ]

    company = models.ForeignKey('authentication.Company', on_delete=models.CASCADE, related_name='email_rules')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    trigger = models.CharField(max_length=64, choices=TRIGGER_CHOICES)
    conditions = models.JSONField(default=dict)
    actions = models.JSONField(default=dict)
    template = models.ForeignKey(EmailTemplate, null=True, blank=True, on_delete=models.SET_NULL, related_name='rules')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_rules')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class EmailSyncLog(models.Model):
    STATUS_RUNNING = 'running'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'
    STATUS_CHOICES = [
        (STATUS_RUNNING, 'Running'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
    ]

    email_account = models.ForeignKey(EmailAccount, on_delete=models.CASCADE, related_name='sync_logs')
    sync_started_at = models.DateTimeField(default=timezone.now)
    sync_completed_at = models.DateTimeField(null=True, blank=True)
    emails_synced = models.IntegerField(default=0)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_RUNNING)
    error_message = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Sync {self.id} - {self.email_account.email} ({self.status})"