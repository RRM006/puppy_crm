from django.urls import path
from .views import (
    EmailAccountListCreateView, EmailAccountDetailView, GmailConnectView, GmailCallbackView,
    SyncEmailAccountView, SetDefaultAccountView, SendEmailView, EmailInboxView,
    EmailThreadDetailView, MarkAsReadView, MarkAsStarredView, DeleteEmailView,
    EmailOpenTrackingView, EmailLinkClickView, SuggestReplyView, ReplyEmailView,
    EmailSearchView, EmailCategoriesView,
    EmailTemplateListCreateView, EmailTemplateDetailView, TemplatePreviewView, DuplicateTemplateView
)

urlpatterns = [
    path('accounts/', EmailAccountListCreateView.as_view()),
    path('accounts/<int:pk>/', EmailAccountDetailView.as_view()),
    path('connect-gmail/', GmailConnectView.as_view()),
    path('gmail-callback/', GmailCallbackView.as_view()),
    path('accounts/<int:pk>/sync/', SyncEmailAccountView.as_view()),
    path('accounts/<int:pk>/set-default/', SetDefaultAccountView.as_view()),
    path('send/', SendEmailView.as_view()),
    path('inbox/', EmailInboxView.as_view()),
    path('threads/<int:pk>/', EmailThreadDetailView.as_view()),
    path('threads/<int:pk>/mark-read/', MarkAsReadView.as_view()),
    path('threads/<int:pk>/star/', MarkAsStarredView.as_view()),
    path('emails/<int:pk>/', DeleteEmailView.as_view()),
    path('track/open/<str:token>/', EmailOpenTrackingView.as_view()),
    path('track/click/<str:token>/', EmailLinkClickView.as_view()),
    path('emails/<int:pk>/suggest-reply/', SuggestReplyView.as_view()),
    path('emails/<int:pk>/reply/', ReplyEmailView.as_view()),
    path('search/', EmailSearchView.as_view()),
    path('categories/', EmailCategoriesView.as_view()),
    # Templates
    path('templates/', EmailTemplateListCreateView.as_view()),
    path('templates/<int:pk>/', EmailTemplateDetailView.as_view()),
    path('templates/<int:pk>/duplicate/', DuplicateTemplateView.as_view()),
    path('templates/preview/', TemplatePreviewView.as_view()),
]
