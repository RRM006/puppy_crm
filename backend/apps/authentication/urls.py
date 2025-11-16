from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterCompanyView,
    RegisterCustomerView,
    LoginView,
    LogoutView,
    MeView,
    GoogleLoginView,
    GoogleSignupView,
    # Phase 3.2 - Company Profile APIs
    CompanyProfileView,
    CompanyTeamView,
    CompanyStatsView,
    # Phase 3.3 - Customer Profile APIs
    CustomerProfileView,
    CustomerCompaniesView,
    LinkToCompanyView,
    # Phase 3.4 - Team Invitation APIs
    InviteUserView,
    ListInvitationsView,
    CancelInvitationView,
    ValidateInvitationView,
    AcceptInvitationView,
)

urlpatterns = [
    path('register/company/', RegisterCompanyView.as_view(), name='register-company'),
    path('register/customer/', RegisterCustomerView.as_view(), name='register-customer'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Google OAuth endpoints
    path('google/login/', GoogleLoginView.as_view(), name='google-login'),
    path('google/signup/', GoogleSignupView.as_view(), name='google-signup'),
    
    # Phase 3.2 - Company Profile APIs
    path('company/profile/', CompanyProfileView.as_view(), name='company-profile'),
    path('company/team/', CompanyTeamView.as_view(), name='company-team'),
    path('company/stats/', CompanyStatsView.as_view(), name='company-stats'),
    
    # Phase 3.3 - Customer Profile APIs
    path('customer/profile/', CustomerProfileView.as_view(), name='customer-profile'),
    path('customer/companies/', CustomerCompaniesView.as_view(), name='customer-companies'),
    path('customer/link-company/', LinkToCompanyView.as_view(), name='customer-link-company'),

    # Phase 3.4 - Team Invitation APIs
    path('company/invite/', InviteUserView.as_view(), name='company-invite'),
    path('company/invitations/', ListInvitationsView.as_view(), name='company-invitations'),
    path('company/invitations/<int:invitation_id>/cancel/', CancelInvitationView.as_view(), name='company-invitation-cancel'),
    path('auth/validate-invitation/<str:token>/', ValidateInvitationView.as_view(), name='validate-invitation'),
    path('auth/accept-invitation/', AcceptInvitationView.as_view(), name='accept-invitation'),
]
