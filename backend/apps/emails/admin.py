from django.contrib import admin
from .models import EmailAccount, EmailThread, Email, EmailAttachment, EmailTemplate, EmailRule, EmailSyncLog

@admin.register(EmailAccount)
class EmailAccountAdmin(admin.ModelAdmin):
    list_display = ('email', 'company', 'user', 'provider', 'is_active', 'is_default', 'last_sync')
    list_filter = ('provider', 'is_active', 'is_default')
    search_fields = ('email', 'username')

@admin.register(EmailThread)
class EmailThreadAdmin(admin.ModelAdmin):
    list_display = ('subject', 'company', 'email_account', 'last_message_at', 'message_count', 'category', 'sentiment', 'is_read', 'is_starred')
    list_filter = ('category', 'sentiment', 'is_read', 'is_starred')
    search_fields = ('subject',)

@admin.register(Email)
class EmailAdmin(admin.ModelAdmin):
    list_display = ('subject', 'email_account', 'direction', 'status', 'sent_at', 'opens_count', 'clicks_count', 'has_attachments')
    list_filter = ('direction', 'status', 'has_attachments', 'tracking_enabled')
    search_fields = ('subject', 'from_email', 'message_id')

@admin.register(EmailAttachment)
class EmailAttachmentAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'email', 'file_size', 'file_type')
    search_fields = ('file_name', 'file_type')

@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'category', 'is_active', 'usage_count', 'created_at')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'subject')

@admin.register(EmailRule)
class EmailRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'trigger', 'is_active', 'created_at')
    list_filter = ('trigger', 'is_active')
    search_fields = ('name',)

@admin.register(EmailSyncLog)
class EmailSyncLogAdmin(admin.ModelAdmin):
    list_display = ('email_account', 'sync_started_at', 'sync_completed_at', 'emails_synced', 'status')
    list_filter = ('status',)
    search_fields = ('email_account__email',)
