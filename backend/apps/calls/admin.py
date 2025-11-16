from django.contrib import admin
from .models import PhoneNumber, Call, CallRecording, CallNote, VoicemailMessage


@admin.register(PhoneNumber)
class PhoneNumberAdmin(admin.ModelAdmin):
    list_display = ['phone_number', 'company', 'user', 'number_type', 'is_active', 'is_default', 'created_at']
    list_filter = ['is_active', 'is_default', 'number_type', 'provider', 'created_at']
    search_fields = ['phone_number', 'twilio_phone_sid', 'company__company_name', 'user__email']
    readonly_fields = ['twilio_phone_sid', 'purchased_at', 'created_at']
    raw_id_fields = ['company', 'user']


@admin.register(Call)
class CallAdmin(admin.ModelAdmin):
    list_display = ['id', 'direction', 'from_number', 'to_number', 'status', 'duration', 'user', 'company', 'created_at']
    list_filter = ['direction', 'status', 'disposition', 'created_at']
    search_fields = ['from_number', 'to_number', 'twilio_call_sid', 'user__email', 'company__company_name']
    readonly_fields = ['twilio_call_sid', 'start_time', 'end_time', 'recording_url', 'recording_duration', 'price', 'created_at']
    raw_id_fields = ['company', 'phone_number', 'user', 'lead', 'deal', 'customer']
    date_hierarchy = 'created_at'


@admin.register(CallRecording)
class CallRecordingAdmin(admin.ModelAdmin):
    list_display = ['id', 'call', 'recording_sid', 'duration', 'file_size', 'created_at']
    list_filter = ['created_at']
    search_fields = ['recording_sid', 'call__twilio_call_sid']
    readonly_fields = ['recording_sid', 'created_at']
    raw_id_fields = ['call']


@admin.register(CallNote)
class CallNoteAdmin(admin.ModelAdmin):
    list_display = ['id', 'call', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['note', 'user__email', 'call__twilio_call_sid']
    readonly_fields = ['created_at']
    raw_id_fields = ['call', 'user']


@admin.register(VoicemailMessage)
class VoicemailMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'from_number', 'company', 'duration', 'is_listened', 'listened_by', 'created_at']
    list_filter = ['is_listened', 'created_at']
    search_fields = ['from_number', 'company__company_name', 'listened_by__email']
    readonly_fields = ['created_at']
    raw_id_fields = ['company', 'phone_number', 'listened_by']
    date_hierarchy = 'created_at'
