"""
URL Configuration for Customer Portal APIs - Phase 5.5
"""
from django.urls import path
from apps.customers.views import (
    CustomerDashboardView,
    CustomerMyOrdersView,
    CustomerOrderDetailView,
    CustomerMyCompaniesView,
    CustomerRequestVerificationView,
    CustomerOrderTrackingView,
)

urlpatterns = [
    # Customer Portal
    path('dashboard/', CustomerDashboardView.as_view(), name='customer-dashboard'),
    path('my-orders/', CustomerMyOrdersView.as_view(), name='customer-my-orders'),
    path('orders/<int:order_id>/', CustomerOrderDetailView.as_view(), name='customer-order-detail'),
    path('my-companies/', CustomerMyCompaniesView.as_view(), name='customer-my-companies'),
    path('request-verification/<int:company_id>/', CustomerRequestVerificationView.as_view(), name='customer-request-verification'),
    path('orders/<int:order_id>/tracking/', CustomerOrderTrackingView.as_view(), name='customer-order-tracking'),
]
