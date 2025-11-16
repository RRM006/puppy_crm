from django.contrib import admin
from .models import (
    CustomerTag,
    CustomerProfile,
    CustomerSegment,
    Order,
    OrderItem,
    CustomerInteraction,
)


@admin.register(CustomerTag)
class CustomerTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'color', 'created_by', 'created_at']
    list_filter = ['company', 'created_at']
    search_fields = ['name', 'company__company_name']


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ['customer', 'customer_type', 'lifetime_value', 'total_orders', 'last_order_date']
    list_filter = ['customer_type', 'created_at']
    search_fields = ['customer__user__email', 'customer__user__first_name', 'customer__user__last_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CustomerSegment)
class CustomerSegmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'created_by', 'created_at']
    list_filter = ['company', 'created_at']
    search_fields = ['name', 'description']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'customer', 'company', 'status', 'payment_status', 'total_amount', 'order_date']
    list_filter = ['status', 'payment_status', 'order_date', 'company']
    search_fields = ['order_number', 'customer__user__email', 'title']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [OrderItemInline]


@admin.register(CustomerInteraction)
class CustomerInteractionAdmin(admin.ModelAdmin):
    list_display = ['customer', 'company', 'interaction_type', 'subject', 'sentiment', 'created_at']
    list_filter = ['interaction_type', 'sentiment', 'created_at', 'company']
    search_fields = ['customer__user__email', 'subject', 'description']
