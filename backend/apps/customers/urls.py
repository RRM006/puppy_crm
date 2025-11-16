"""
Customer Management URL Configuration
"""

from django.urls import path
from apps.customers.views import (
    CustomerListView,
    CustomerDetailView,
    AssignAccountManagerView,
    VerifyCustomerView,
    UnlinkCustomerView,
    CustomerStatsView,
    CustomerTagListCreateView,
    CustomerTagDetailView,
    CustomerSegmentListCreateView,
    CustomerSegmentDetailView,
    CustomersBySegmentView,
    CustomerInteractionsView,
    # Order views
    OrderListCreateView,
    OrderDetailView,
    UpdateOrderStatusView,
    AddOrderItemView,
    RemoveOrderItemView,
    CustomerOrdersView,
    OrderStatsView,
)

app_name = 'customers'

urlpatterns = [
    # Customer endpoints
    path('', CustomerListView.as_view(), name='customer-list'),
    path('<int:customer_id>/', CustomerDetailView.as_view(), name='customer-detail'),
    path('<int:customer_id>/assign-manager/', AssignAccountManagerView.as_view(), name='assign-manager'),
    path('<int:customer_id>/verify/', VerifyCustomerView.as_view(), name='verify-customer'),
    path('<int:customer_id>/unlink/', UnlinkCustomerView.as_view(), name='unlink-customer'),
    
    # Statistics
    path('stats/', CustomerStatsView.as_view(), name='customer-stats'),
    
    # Tags
    path('tags/', CustomerTagListCreateView.as_view(), name='tag-list-create'),
    path('tags/<int:pk>/', CustomerTagDetailView.as_view(), name='tag-detail'),
    
    # Segments
    path('segments/', CustomerSegmentListCreateView.as_view(), name='segment-list-create'),
    path('segments/<int:pk>/', CustomerSegmentDetailView.as_view(), name='segment-detail'),
    path('segments/<int:segment_id>/customers/', CustomersBySegmentView.as_view(), name='segment-customers'),
    
    # Customer Interactions
    path('<int:customer_id>/interactions/', CustomerInteractionsView.as_view(), name='customer-interactions'),
]
