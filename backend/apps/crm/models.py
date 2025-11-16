from django.db import models
from django.utils import timezone
from django.conf import settings
from django.db.models import Q

User = settings.AUTH_USER_MODEL

class Lead(models.Model):
    LEAD_SOURCE_CHOICES = [
        ('website', 'Website'),
        ('referral', 'Referral'),
        ('cold_call', 'Cold Call'),
        ('social_media', 'Social Media'),
        ('event', 'Event'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('unqualified', 'Unqualified'),
        ('converted', 'Converted'),
    ]

    company = models.ForeignKey('authentication.Company', on_delete=models.CASCADE, related_name='leads')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leads_created')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads_assigned')
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=32, null=True, blank=True)
    company_name = models.CharField(max_length=255, null=True, blank=True)
    job_title = models.CharField(max_length=120, null=True, blank=True)
    lead_source = models.CharField(max_length=32, choices=LEAD_SOURCE_CHOICES)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='new')
    estimated_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    converted_to_deal = models.ForeignKey('crm.Deal', on_delete=models.SET_NULL, null=True, blank=True, related_name='converted_lead')
    converted_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['company', 'email']),
            models.Index(fields=['created_at']),
            models.Index(fields=['company', 'is_active']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

class Pipeline(models.Model):
    company = models.ForeignKey('authentication.Company', on_delete=models.CASCADE, related_name='pipelines')
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    is_default = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pipelines_created')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['company', 'name'], name='unique_pipeline_name_per_company'),
            models.UniqueConstraint(fields=['company', 'is_default'], condition=Q(is_default=True), name='unique_default_pipeline_per_company'),
        ]
        indexes = [
            models.Index(fields=['company', 'is_active']),
            models.Index(fields=['company', 'is_default']),
        ]

    def __str__(self):
        return f"{self.name} - {self.company.company_name}"

class DealStage(models.Model):
    pipeline = models.ForeignKey('crm.Pipeline', on_delete=models.CASCADE, related_name='stages')
    name = models.CharField(max_length=120)
    order = models.PositiveIntegerField()
    probability = models.PositiveIntegerField(help_text='Chance of winning (0-100)')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        constraints = [
            models.UniqueConstraint(fields=['pipeline', 'name'], name='unique_stage_name_per_pipeline'),
            models.UniqueConstraint(fields=['pipeline', 'order'], name='unique_stage_order_per_pipeline'),
        ]
        indexes = [
            models.Index(fields=['pipeline', 'is_active']),
            models.Index(fields=['pipeline', 'order']),
        ]

    def __str__(self):
        return f"{self.name} ({self.pipeline.name})"

class Deal(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('won', 'Won'),
        ('lost', 'Lost'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    company = models.ForeignKey('authentication.Company', on_delete=models.CASCADE, related_name='deals')
    pipeline = models.ForeignKey('crm.Pipeline', on_delete=models.CASCADE, related_name='deals')
    stage = models.ForeignKey('crm.DealStage', on_delete=models.CASCADE, related_name='deals')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='deals_created')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deals_assigned')
    lead = models.ForeignKey('crm.Lead', on_delete=models.SET_NULL, null=True, blank=True, related_name='deals')
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    value = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=8, default='USD')
    expected_close_date = models.DateField(null=True, blank=True)
    actual_close_date = models.DateField(null=True, blank=True)
    contact_name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=32, null=True, blank=True)
    company_name = models.CharField(max_length=255)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='open')
    lost_reason = models.TextField(null=True, blank=True)
    priority = models.CharField(max_length=16, choices=PRIORITY_CHOICES, default='medium')
    probability = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    won_at = models.DateTimeField(null=True, blank=True)
    lost_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['company', 'pipeline', 'stage']),
            models.Index(fields=['company', 'expected_close_date']),
            models.Index(fields=['created_at']),
            models.Index(fields=['company', 'is_active']),
        ]
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Sync probability with stage probability on create or stage change
        if self.stage:
            if self.pk is None:
                self.probability = self.stage.probability
            else:
                try:
                    previous = Deal.objects.get(pk=self.pk)
                    if previous.stage_id != self.stage_id:
                        self.probability = self.stage.probability
                except Deal.DoesNotExist:
                    self.probability = self.stage.probability
        if self.status == 'won' and self.won_at is None:
            self.won_at = timezone.now()
        if self.status == 'lost' and self.lost_at is None:
            self.lost_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.company.company_name})"

class Activity(models.Model):
    ACTIVITY_TYPE_CHOICES = [
        ('note', 'Note'),
        ('call', 'Call'),
        ('email', 'Email'),
        ('meeting', 'Meeting'),
        ('task', 'Task'),
    ]
    company = models.ForeignKey('authentication.Company', on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities_created')
    lead = models.ForeignKey('crm.Lead', on_delete=models.CASCADE, null=True, blank=True, related_name='activities')
    deal = models.ForeignKey('crm.Deal', on_delete=models.CASCADE, null=True, blank=True, related_name='activities')
    activity_type = models.CharField(max_length=32, choices=ACTIVITY_TYPE_CHOICES)
    subject = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['company', 'lead']),
            models.Index(fields=['company', 'deal']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        target = self.lead or self.deal
        return f"{self.activity_type} - {self.subject} ({target})"
