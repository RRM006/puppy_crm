"""
Order Management URL Configuration
"""

from django.urls import path
from apps.customers.views import (
    OrderListCreateView,
    OrderDetailView,
    UpdateOrderStatusView,
    AddOrderItemView,
    RemoveOrderItemView,
    CustomerOrdersView,
    OrderStatsView,
)

app_name = 'orders'

urlpatterns = [
    # Order endpoints
    path('', OrderListCreateView.as_view(), name='order-list-create'),
    path('<int:order_id>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:order_id>/update-status/', UpdateOrderStatusView.as_view(), name='update-status'),
    path('<int:order_id>/add-item/', AddOrderItemView.as_view(), name='add-item'),
    path('<int:order_id>/items/<int:item_id>/', RemoveOrderItemView.as_view(), name='remove-item'),
    
    # Customer orders
    path('customer/<int:customer_id>/', CustomerOrdersView.as_view(), name='customer-orders'),
    
    # Statistics
    path('stats/', OrderStatsView.as_view(), name='order-stats'),
]
