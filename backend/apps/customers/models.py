from django.db import models
from django.conf import settings
from apps.authentication.models import Customer, Company, User


class CustomerTag(models.Model):
    """Tags for categorizing customers (VIP, High Value, At Risk, etc.)"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='customer_tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#4c6fff', help_text='Hex color code')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_tags')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'customers_customertag'
        unique_together = ['company', 'name']
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.company.company_name})"


class CustomerProfile(models.Model):
    """Extended profile information for customers"""
    CUSTOMER_TYPE_CHOICES = [
        ('individual', 'Individual'),
        ('business', 'Business'),
    ]

    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='profile')
    customer_type = models.CharField(max_length=20, choices=CUSTOMER_TYPE_CHOICES, default='individual')
    company_size = models.CharField(max_length=50, blank=True, null=True, help_text='Only for business customers')
    industry = models.CharField(max_length=100, blank=True, null=True, help_text='Only for business customers')
    annual_revenue = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, help_text='Only for business customers')
    preferences = models.JSONField(default=dict, blank=True, help_text='Communication preferences, interests, etc.')
    tags = models.ManyToManyField(CustomerTag, blank=True, related_name='customer_profiles')
    lifetime_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text='Calculated total value')
    total_orders = models.IntegerField(default=0)
    last_order_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, help_text='Internal notes by company')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers_customerprofile'
        ordering = ['-created_at']

    def __str__(self):
        return f"Profile: {self.customer.user.email}"


class CustomerSegment(models.Model):
    """Customer segmentation for targeting and analytics"""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='customer_segments')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    criteria = models.JSONField(default=dict, help_text='Filter criteria for segment')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_segments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers_customersegment'
        unique_together = ['company', 'name']
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.company.company_name})"


class Order(models.Model):
    """Customer orders/purchases"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='orders')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    order_date = models.DateTimeField(auto_now_add=True, db_index=True)
    expected_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateField(null=True, blank=True)
    shipping_address = models.TextField()
    billing_address = models.TextField()
    payment_method = models.CharField(max_length=50, blank=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending', db_index=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_orders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers_order'
        ordering = ['-order_date']
        indexes = [
            models.Index(fields=['company', 'customer']),
            models.Index(fields=['company', 'status']),
            models.Index(fields=['order_date']),
        ]

    def __str__(self):
        return f"Order {self.order_number} - {self.customer.user.email}"


class OrderItem(models.Model):
    """Individual items within an order"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product_name = models.CharField(max_length=255)
    product_sku = models.CharField(max_length=100, blank=True)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'customers_orderitem'
        ordering = ['id']

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"

    def save(self, *args, **kwargs):
        # Auto-calculate total_price if not provided
        if not self.total_price:
            self.total_price = (self.unit_price * self.quantity) - self.discount + self.tax
        super().save(*args, **kwargs)


class CustomerInteraction(models.Model):
    """Log of all interactions with customers"""
    INTERACTION_TYPE_CHOICES = [
        ('call', 'Call'),
        ('email', 'Email'),
        ('meeting', 'Meeting'),
        ('support', 'Support'),
        ('purchase', 'Purchase'),
        ('inquiry', 'Inquiry'),
    ]

    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='customer_interactions')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='interactions')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='customer_interactions')
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPE_CHOICES, db_index=True)
    subject = models.CharField(max_length=255)
    description = models.TextField()
    sentiment = models.CharField(max_length=20, choices=SENTIMENT_CHOICES, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'customers_customerinteraction'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'customer']),
            models.Index(fields=['company', 'interaction_type']),
        ]

    def __str__(self):
        return f"{self.interaction_type} - {self.customer.user.email} - {self.created_at.strftime('%Y-%m-%d')}"
