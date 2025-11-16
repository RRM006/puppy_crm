"""
URL Configuration for Customer Interaction APIs - Phase 5.4
"""
from django.urls import path
from apps.customers.views import (
    InteractionListCreateView,
    InteractionDetailView,
    CustomerInteractionsView,
    InteractionStatsView,
)

urlpatterns = [
    # Customer Interactions
    path('', InteractionListCreateView.as_view(), name='interaction-list-create'),
    path('<int:interaction_id>/', InteractionDetailView.as_view(), name='interaction-detail'),
    path('stats/', InteractionStatsView.as_view(), name='interaction-stats'),
]
