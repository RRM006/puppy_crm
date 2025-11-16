"""
URLs for calls app
"""
from django.urls import path
from . import views

app_name = 'calls'

urlpatterns = [
    # Phone Number Management
    path('phone-numbers/', views.PhoneNumberListView.as_view(), name='phone-number-list'),
    path('phone-numbers/available/', views.SearchAvailableNumbersView.as_view(), name='search-available-numbers'),
    path('phone-numbers/purchase/', views.PurchasePhoneNumberView.as_view(), name='purchase-phone-number'),
    path('phone-numbers/<int:pk>/', views.PhoneNumberDetailView.as_view(), name='phone-number-detail'),
    path('phone-numbers/<int:pk>/set-default/', views.SetDefaultNumberView.as_view(), name='set-default-number'),
    
    # Call Management
    path('', views.CallListView.as_view(), name='call-list'),
    path('make/', views.MakeCallView.as_view(), name='make-call'),
    path('<int:pk>/', views.CallDetailView.as_view(), name='call-detail'),
    path('<int:pk>/end/', views.EndCallView.as_view(), name='end-call'),
    path('<int:pk>/recording/', views.CallRecordingView.as_view(), name='call-recording'),
    path('<int:pk>/notes/', views.AddCallNoteView.as_view(), name='add-call-note'),
    path('stats/', views.CallStatsView.as_view(), name='call-stats'),
    
    # Voicemail
    path('voicemails/', views.VoicemailListView.as_view(), name='voicemail-list'),
    path('voicemails/<int:pk>/', views.VoicemailDetailView.as_view(), name='voicemail-detail'),
    
    # Webhooks (no auth required, signature verified)
    path('webhook/incoming/', views.TwilioIncomingCallWebhook, name='twilio-incoming-call'),
    path('webhook/status/', views.TwilioStatusCallbackWebhook, name='twilio-status-callback'),
    path('webhook/recording/', views.TwilioRecordingWebhook, name='twilio-recording-callback'),
]

