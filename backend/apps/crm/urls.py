from django.urls import path
from .views import (
    LeadListCreateView, LeadDetailView, ConvertLeadView,
    AssignLeadView, LeadStatsView,
    PipelineListCreateView, PipelineDetailView, StageListCreateView,
    StageUpdateView, ReorderStagesView,
    DealListCreateView, DealDetailView, MoveDealStageView, CloseDealView, AssignDealView, DealStatsView, DealsByStageView,
    ActivityListCreateView, ActivityDetailView, LeadActivitiesView, DealActivitiesView, MarkActivityCompleteView
)

urlpatterns = [
    path('leads/', LeadListCreateView.as_view(), name='lead-list-create'),
    path('leads/stats/', LeadStatsView.as_view(), name='lead-stats'),
    path('leads/<int:pk>/', LeadDetailView.as_view(), name='lead-detail'),
    path('leads/<int:pk>/convert/', ConvertLeadView.as_view(), name='lead-convert'),
    path('leads/<int:pk>/assign/', AssignLeadView.as_view(), name='lead-assign'),
    # Pipelines
    path('pipelines/', PipelineListCreateView.as_view(), name='pipeline-list-create'),
    path('pipelines/<int:pk>/', PipelineDetailView.as_view(), name='pipeline-detail'),
    path('pipelines/<int:pk>/stages/', StageListCreateView.as_view(), name='stage-list-create'),
    path('stages/<int:pk>/', StageUpdateView.as_view(), name='stage-update'),
    path('pipelines/<int:pk>/reorder-stages/', ReorderStagesView.as_view(), name='pipeline-reorder-stages'),
    # Deals
    path('deals/', DealListCreateView.as_view(), name='deal-list-create'),
    path('deals/stats/', DealStatsView.as_view(), name='deal-stats'),
    path('deals/by-stage/', DealsByStageView.as_view(), name='deals-by-stage'),
    path('deals/<int:pk>/', DealDetailView.as_view(), name='deal-detail'),
    path('deals/<int:pk>/move-stage/', MoveDealStageView.as_view(), name='deal-move-stage'),
    path('deals/<int:pk>/close/', CloseDealView.as_view(), name='deal-close'),
    path('deals/<int:pk>/assign/', AssignDealView.as_view(), name='deal-assign'),
    # Activities
    path('activities/', ActivityListCreateView.as_view(), name='activity-list-create'),
    path('activities/<int:pk>/', ActivityDetailView.as_view(), name='activity-detail'),
    path('leads/<int:pk>/activities/', LeadActivitiesView.as_view(), name='lead-activities'),
    path('deals/<int:pk>/activities/', DealActivitiesView.as_view(), name='deal-activities'),
    path('activities/<int:pk>/complete/', MarkActivityCompleteView.as_view(), name='activity-complete'),
]
