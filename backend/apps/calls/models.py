from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class PhoneNumber(models.Model):
    """Phone numbers purchased from Twilio for the company"""
    NUMBER_TYPE_CHOICES = [
        ('Mobile', 'Mobile'),
        ('Landline', 'Landline'),
        ('VoIP', 'VoIP'),
    ]
    
    company = models.ForeignKey('authentication.Company', on_delete=models.CASCADE, related_name='phone_numbers')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='phone_numbers', help_text='Owner of the phone number')
    phone_number = models.CharField(max_length=20, help_text='E.164 format, e.g., +1234567890')
    country_code = models.CharField(max_length=5)
    number_type = models.CharField(max_length=20, choices=NUMBER_TYPE_CHOICES)
    provider = models.CharField(max_length=50, default='Twilio')
    twilio_phone_sid = models.CharField(max_length=100, unique=True, help_text="Twilio's SID for this number")
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False, help_text='Default number for user')
    capabilities = models.JSONField(default=dict, help_text='Voice, SMS, MMS capabilities')
    monthly_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    purchased_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'calls_phonenumber'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'is_active']),
            models.Index(fields=['user', 'is_default']),
        ]
    
    def __str__(self):
        return f"{self.phone_number} ({self.company.company_name})"


class Call(models.Model):
    """Call records for inbound and outbound calls"""
    DIRECTION_CHOICES = [
        ('Inbound', 'Inbound'),
        ('Outbound', 'Outbound'),
    ]
    
    STATUS_CHOICES = [
        ('Initiated', 'Initiated'),
        ('Ringing', 'Ringing'),
        ('InProgress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Failed', 'Failed'),
        ('Busy', 'Busy'),
        ('NoAnswer', 'No Answer'),
        ('Cancelled', 'Cancelled'),
    ]
    
    DISPOSITION_CHOICES = [
        ('Connected', 'Connected'),
        ('NoAnswer', 'No Answer'),
        ('Busy', 'Busy'),
        ('Failed', 'Failed'),
        ('Voicemail', 'Voicemail'),
        ('other', 'Other'),
    ]
    
    company = models.ForeignKey('authentication.Company', on_delete=models.CASCADE, related_name='calls')
    phone_number = models.ForeignKey(PhoneNumber, on_delete=models.SET_NULL, null=True, related_name='calls', help_text="Company's number used")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='calls', help_text='Company user who made/received call')
    lead = models.ForeignKey('crm.Lead', on_delete=models.SET_NULL, null=True, blank=True, related_name='calls')
    deal = models.ForeignKey('crm.Deal', on_delete=models.SET_NULL, null=True, blank=True, related_name='calls')
    customer = models.ForeignKey('authentication.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='calls')
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES)
    from_number = models.CharField(max_length=20)
    to_number = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Initiated')
    duration = models.IntegerField(null=True, blank=True, help_text='Duration in seconds')
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    recording_url = models.URLField(null=True, blank=True)
    recording_duration = models.IntegerField(null=True, blank=True, help_text='Recording duration in seconds')
    twilio_call_sid = models.CharField(max_length=100, unique=True, help_text="Twilio's call ID")
    price = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, help_text='Call cost')
    price_unit = models.CharField(max_length=10, default='USD')
    notes = models.TextField(blank=True, help_text='Call notes added by user')
    disposition = models.CharField(max_length=20, choices=DISPOSITION_CHOICES, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'calls_call'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'user']),
            models.Index(fields=['company', 'direction']),
            models.Index(fields=['company', 'status']),
            models.Index(fields=['company', 'created_at']),
            models.Index(fields=['lead']),
            models.Index(fields=['deal']),
            models.Index(fields=['customer']),
            models.Index(fields=['twilio_call_sid']),
        ]
    
    def __str__(self):
        return f"{self.direction} call from {self.from_number} to {self.to_number} - {self.status}"


class CallRecording(models.Model):
    """Recordings associated with calls"""
    call = models.ForeignKey(Call, on_delete=models.CASCADE, related_name='recordings')
    recording_url = models.URLField(help_text='Twilio recording URL')
    recording_sid = models.CharField(max_length=100, unique=True, help_text='Twilio recording SID')
    duration = models.IntegerField(help_text='Duration in seconds')
    file_size = models.IntegerField(null=True, blank=True, help_text='File size in bytes')
    transcription = models.TextField(null=True, blank=True, help_text='Transcription if enabled')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'calls_callrecording'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['call']),
            models.Index(fields=['recording_sid']),
        ]
    
    def __str__(self):
        return f"Recording for call {self.call.id} - {self.duration}s"


class CallNote(models.Model):
    """Notes added to calls by users"""
    call = models.ForeignKey(Call, on_delete=models.CASCADE, related_name='call_notes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='call_notes')
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'calls_callnote'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['call']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"Note by {self.user.email} on call {self.call.id}"


class VoicemailMessage(models.Model):
    """Voicemail messages received"""
    company = models.ForeignKey('authentication.Company', on_delete=models.CASCADE, related_name='voicemails')
    phone_number = models.ForeignKey(PhoneNumber, on_delete=models.SET_NULL, null=True, related_name='voicemails')
    from_number = models.CharField(max_length=20)
    duration = models.IntegerField(help_text='Duration in seconds')
    recording_url = models.URLField()
    transcription = models.TextField(null=True, blank=True)
    is_listened = models.BooleanField(default=False)
    listened_at = models.DateTimeField(null=True, blank=True)
    listened_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='listened_voicemails')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'calls_voicemailmessage'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'is_listened']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Voicemail from {self.from_number} - {self.duration}s"
