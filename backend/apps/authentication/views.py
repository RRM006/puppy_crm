from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    RegisterCompanySerializer,
    RegisterCustomerSerializer,
    LoginSerializer,
    UserSerializer
)
from .models import Company, CompanyUser, Customer
from .google_auth import verify_google_token, get_user_info_from_google
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterCompanyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterCompanySerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegisterCustomerView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterCustomerSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            # Authenticate user (Django uses username field, but we're using email)
            user = authenticate(request, username=email, password=password)
            
            if user is not None:
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'detail': 'Invalid email or password.'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'detail': 'Successfully logged out.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'detail': 'Invalid token.'
            }, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_data = UserSerializer(user).data
        
        # Add company data if user is a company user
        if user.account_type == 'company':
            try:
                company_user = CompanyUser.objects.select_related('company').get(user=user, is_active=True)
                user_data['company'] = {
                    'id': company_user.company.id,
                    'name': company_user.company.company_name,
                    'role': company_user.role,
                    'phone': company_user.company.phone,
                    'employee_count': company_user.company.employee_count,
                }
            except CompanyUser.DoesNotExist:
                user_data['company'] = None
        
        # Add customer data if user is a customer
        elif user.account_type == 'customer':
            try:
                customer = Customer.objects.get(user=user)
                user_data['customer'] = {
                    'id': customer.id,
                    'address': customer.address,
                }
            except Customer.DoesNotExist:
                user_data['customer'] = None
        
        return Response(user_data, status=status.HTTP_200_OK)


class GoogleLoginView(APIView):
    """
    Google OAuth Login - for existing users only.
    
    Request body:
    {
        "token": "google_oauth_token_here"
    }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response({
                'detail': 'Google token is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify token with Google
        google_data = verify_google_token(token)
        
        if not google_data:
            return Response({
                'detail': 'Invalid Google token.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get user info from Google
        user_info = get_user_info_from_google(google_data)
        email = user_info['email']
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'detail': 'User not found. Please complete signup first.',
                'email': email
            }, status=status.HTTP_404_NOT_FOUND)


class GoogleSignupView(APIView):
    """
    Google OAuth Signup - create new user account.
    
    Request body for company:
    {
        "token": "google_oauth_token_here",
        "account_type": "company",
        "company_name": "My Company",
        "phone": "+1234567890",
        "employee_count": 50
    }
    
    Request body for customer:
    {
        "token": "google_oauth_token_here",
        "account_type": "customer",
        "phone": "+1234567890",
        "address": "123 Main St"
    }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        account_type = request.data.get('account_type', 'customer')
        
        if not token:
            return Response({
                'detail': 'Google token is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if account_type not in ['company', 'customer']:
            return Response({
                'detail': 'Invalid account_type. Must be "company" or "customer".'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify token with Google
        google_data = verify_google_token(token)
        
        if not google_data:
            return Response({
                'detail': 'Invalid Google token.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get user info from Google
        user_info = get_user_info_from_google(google_data)
        email = user_info['email']
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({
                'detail': 'User with this email already exists. Please login instead.',
                'email': email
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create new user
        user = User.objects.create_user(
            email=email,
            username=email,
            first_name=user_info['first_name'],
            last_name=user_info['last_name'],
            account_type=account_type,
            phone=request.data.get('phone', ''),
            is_verified=True  # Email verified by Google
        )
        
        # Set unusable password since user authenticates via Google
        user.set_unusable_password()
        user.save()
        
        # Create company profile if account_type is company
        if account_type == 'company':
            company_name = request.data.get('company_name')
            employee_count = request.data.get('employee_count')
            
            if not company_name:
                user.delete()  # Rollback user creation
                return Response({
                    'detail': 'company_name is required for company accounts.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create Company
            company = Company.objects.create(
                company_name=company_name,
                phone=request.data.get('phone', ''),
                employee_count=employee_count or 0,
                created_by=user
            )
            
            # Create CompanyUser with CEO role
            CompanyUser.objects.create(
                user=user,
                company=company,
                role='ceo'
            )
        
        # Create customer profile if account_type is customer
        elif account_type == 'customer':
            Customer.objects.create(
                user=user,
                address=request.data.get('address', '')
            )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


# ============================================
# Company Profile Views (Phase 3.2)
# ============================================

from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q, Count
from .permissions import IsCompanyUser, IsCompanyCEO
from .serializers import (
    CompanyProfileSerializer,
    UpdateCompanyProfileSerializer,
    CompanyUserSerializer
)


class CompanyProfileView(APIView):
    """
    GET: Return company profile for current user
    PUT: Update company profile (CEO only for sensitive fields)
    """
    permission_classes = [IsAuthenticated, IsCompanyUser]
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request):
        """Get company profile for the current user."""
        try:
            # Get user's active company
            company_user = CompanyUser.objects.select_related('company').get(
                user=request.user,
                is_active=True
            )
            
            serializer = CompanyProfileSerializer(
                company_user.company,
                context={'request': request}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except CompanyUser.DoesNotExist:
            return Response({
                'detail': 'You are not a member of any company.'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request):
        """Update company profile."""
        try:
            # Get user's active company
            company_user = CompanyUser.objects.select_related('company').get(
                user=request.user,
                is_active=True
            )
            
            company = company_user.company
            
            # Use update serializer with permission checks
            serializer = UpdateCompanyProfileSerializer(
                company,
                data=request.data,
                partial=True,
                context={'request': request}
            )
            
            if serializer.is_valid():
                serializer.save()
                
                # Return updated profile
                return Response(
                    CompanyProfileSerializer(company, context={'request': request}).data,
                    status=status.HTTP_200_OK
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except CompanyUser.DoesNotExist:
            return Response({
                'detail': 'You are not a member of any company.'
            }, status=status.HTTP_404_NOT_FOUND)


class CompanyTeamView(APIView):
    """
    GET: List all team members in the company
    Supports filtering by role, status
    """
    permission_classes = [IsAuthenticated, IsCompanyUser]
    
    def get(self, request):
        """Get list of team members."""
        try:
            # Get user's active company
            company_user = CompanyUser.objects.select_related('company').get(
                user=request.user,
                is_active=True
            )
            
            company = company_user.company
            
            # Get all team members
            team_members = CompanyUser.objects.filter(
                company=company
            ).select_related('user', 'invited_by')
            
            # Filter by role if provided
            role = request.query_params.get('role')
            if role:
                team_members = team_members.filter(role=role)
            
            # Filter by status if provided
            is_active = request.query_params.get('is_active')
            if is_active is not None:
                is_active_bool = is_active.lower() in ['true', '1', 'yes']
                team_members = team_members.filter(is_active=is_active_bool)
            
            # Order by joined date (newest first)
            team_members = team_members.order_by('-joined_at')
            
            serializer = CompanyUserSerializer(team_members, many=True)
            
            return Response({
                'count': team_members.count(),
                'team_members': serializer.data
            }, status=status.HTTP_200_OK)
            
        except CompanyUser.DoesNotExist:
            return Response({
                'detail': 'You are not a member of any company.'
            }, status=status.HTTP_404_NOT_FOUND)


class CompanyStatsView(APIView):
    """
    GET: Return company statistics
    - Total team members
    - Active members
    - Team by role breakdown
    - Recent activity
    """
    permission_classes = [IsAuthenticated, IsCompanyUser]
    
    def get(self, request):
        """Get company statistics."""
        try:
            # Get user's active company
            company_user = CompanyUser.objects.select_related('company').get(
                user=request.user,
                is_active=True
            )
            
            company = company_user.company
            
            # Total team members
            total_members = CompanyUser.objects.filter(company=company).count()
            
            # Active members
            active_members = CompanyUser.objects.filter(
                company=company,
                is_active=True
            ).count()
            
            # Team by role breakdown
            role_breakdown = CompanyUser.objects.filter(
                company=company
            ).values('role').annotate(count=Count('role')).order_by('role')
            
            # Format role breakdown
            roles = {item['role']: item['count'] for item in role_breakdown}
            
            # Recent members (last 5 joined)
            recent_members = CompanyUser.objects.filter(
                company=company
            ).select_related('user').order_by('-joined_at')[:5]
            
            recent_members_data = [{
                'id': member.id,
                'name': f"{member.user.first_name} {member.user.last_name}",
                'email': member.user.email,
                'role': member.role,
                'joined_at': member.joined_at
            } for member in recent_members]
            
            # Departments breakdown
            department_breakdown = CompanyUser.objects.filter(
                company=company,
                is_active=True
            ).exclude(department__isnull=True).exclude(department='').values(
                'department'
            ).annotate(count=Count('department')).order_by('department')
            
            departments = {item['department']: item['count'] for item in department_breakdown}
            
            return Response({
                'company_name': company.company_name,
                'total_members': total_members,
                'active_members': active_members,
                'inactive_members': total_members - active_members,
                'roles': roles,
                'departments': departments,
                'recent_members': recent_members_data
            }, status=status.HTTP_200_OK)
            
        except CompanyUser.DoesNotExist:
            return Response({
                'detail': 'You are not a member of any company.'
            }, status=status.HTTP_404_NOT_FOUND)


# ============================================
# Customer Profile Views (Phase 3.3)
# ============================================

from .permissions import IsCustomer
from .serializers import (
    CustomerProfileSerializer,
    UpdateCustomerProfileSerializer,
    CustomerCompanySerializer,
    LinkToCompanySerializer
)
from .models import CustomerCompany
from .models import UserInvitation
from .serializers import (
    InviteUserSerializer,
    InvitationSerializer,
    AcceptInvitationSerializer,
)
from .utils import send_invitation_email
from django.utils import timezone


class CustomerProfileView(APIView):
    """
    GET: Return customer profile
    PUT: Update customer profile
    """
    permission_classes = [IsAuthenticated, IsCustomer]
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request):
        """Get customer profile."""
        try:
            customer = Customer.objects.get(user=request.user)
            serializer = CustomerProfileSerializer(
                customer,
                context={'request': request}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Customer.DoesNotExist:
            return Response({
                'detail': 'Customer profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request):
        """Update customer profile."""
        try:
            customer = Customer.objects.get(user=request.user)
            
            serializer = UpdateCustomerProfileSerializer(
                customer,
                data=request.data,
                partial=True,
                context={'request': request}
            )
            
            if serializer.is_valid():
                serializer.save()
                
                # Return updated profile
                return Response(
                    CustomerProfileSerializer(customer, context={'request': request}).data,
                    status=status.HTTP_200_OK
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Customer.DoesNotExist:
            return Response({
                'detail': 'Customer profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)


class CustomerCompaniesView(APIView):
    """
    GET: List all companies customer is linked to
    """
    permission_classes = [IsAuthenticated, IsCustomer]
    
    def get(self, request):
        """Get list of linked companies."""
        try:
            customer = Customer.objects.get(user=request.user)
            
            # Get all company relationships
            customer_companies = CustomerCompany.objects.filter(
                customer=customer
            ).select_related('company').order_by('-created_at')
            
            # Filter by verification status if provided
            verified = request.query_params.get('verified')
            if verified is not None:
                verified_bool = verified.lower() in ['true', '1', 'yes']
                customer_companies = customer_companies.filter(verified=verified_bool)
            
            serializer = CustomerCompanySerializer(
                customer_companies,
                many=True,
                context={'request': request}
            )
            
            return Response({
                'count': customer_companies.count(),
                'companies': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Customer.DoesNotExist:
            return Response({
                'detail': 'Customer profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)


class LinkToCompanyView(APIView):
    """
    POST: Customer requests to link to a company
    Creates unverified CustomerCompany relationship
    """
    permission_classes = [IsAuthenticated, IsCustomer]
    
    def post(self, request):
        """Link customer to a company."""
        try:
            customer = Customer.objects.get(user=request.user)
            
            serializer = LinkToCompanySerializer(data=request.data)
            
            if serializer.is_valid():
                company = serializer.validated_data['company']
                
                # Check if already linked
                existing_link = CustomerCompany.objects.filter(
                    customer=customer,
                    company=company
                ).first()
                
                if existing_link:
                    return Response({
                        'detail': 'You are already linked to this company.',
                        'verified': existing_link.verified,
                        'created_at': existing_link.created_at
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Create unverified link
                customer_company = CustomerCompany.objects.create(
                    customer=customer,
                    company=company,
                    verified=False,
                    added_by=request.user
                )
                
                # TODO: Send notification to company admin
                # This would be implemented in Phase 9 (Notifications)
                
                return Response({
                    'detail': 'Link request sent successfully. Waiting for company verification.',
                    'company': {
                        'id': company.id,
                        'name': company.company_name,
                        'city': company.city,
                        'country': company.country
                    },
                    'verified': customer_company.verified,
                    'created_at': customer_company.created_at
                }, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Customer.DoesNotExist:
            return Response({
                'detail': 'Customer profile not found.'
            }, status=status.HTTP_404_NOT_FOUND)


# ============================================
# Team Invitation Views (Phase 3.4)
# ============================================

class InviteUserView(APIView):
    """
    POST: Invite a user to join the company team
    Requires company user with invite permission.
    """
    permission_classes = [IsAuthenticated, IsCompanyUser]

    def post(self, request):
        try:
            company_user = CompanyUser.objects.select_related('company').get(
                user=request.user,
                is_active=True
            )
        except CompanyUser.DoesNotExist:
            return Response({'detail': 'You are not a member of any company.'}, status=status.HTTP_404_NOT_FOUND)

        # Check invite permission
        if not company_user.can_invite_users:
            return Response({'detail': 'You do not have permission to invite users.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = InviteUserSerializer(data=request.data, context={'company': company_user.company})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        role = serializer.validated_data['role']

        invitation = UserInvitation.objects.create(
            company=company_user.company,
            email=email,
            role=role,
            invited_by=request.user,
        )

        # Fire-and-forget email (fail silently handled in util)
        send_invitation_email(invitation)

        return Response(InvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)


class ListInvitationsView(APIView):
    """
    GET: List invitations for the company. Optional filter by status.
    """
    permission_classes = [IsAuthenticated, IsCompanyUser]

    def get(self, request):
        try:
            company_user = CompanyUser.objects.select_related('company').get(
                user=request.user,
                is_active=True
            )
        except CompanyUser.DoesNotExist:
            return Response({'detail': 'You are not a member of any company.'}, status=status.HTTP_404_NOT_FOUND)

        invitations = UserInvitation.objects.filter(company=company_user.company)

        status_param = request.query_params.get('status')
        if status_param in {'pending', 'accepted', 'expired'}:
            invitations = invitations.filter(status=status_param)

        serializer = InvitationSerializer(invitations, many=True)
        return Response({'count': invitations.count(), 'invitations': serializer.data}, status=status.HTTP_200_OK)


class CancelInvitationView(APIView):
    """
    DELETE: Cancel a pending invitation by id (sets status to expired).
    """
    permission_classes = [IsAuthenticated, IsCompanyUser]

    def delete(self, request, invitation_id):
        try:
            company_user = CompanyUser.objects.select_related('company').get(
                user=request.user,
                is_active=True
            )
        except CompanyUser.DoesNotExist:
            return Response({'detail': 'You are not a member of any company.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            invitation = UserInvitation.objects.get(id=invitation_id, company=company_user.company)
        except UserInvitation.DoesNotExist:
            return Response({'detail': 'Invitation not found.'}, status=status.HTTP_404_NOT_FOUND)

        if invitation.status != 'pending':
            return Response({'detail': 'Only pending invitations can be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        invitation.status = 'expired'
        invitation.save(update_fields=['status'])

        return Response({'detail': 'Invitation cancelled.'}, status=status.HTTP_200_OK)


class ValidateInvitationView(APIView):
    """
    GET: Validate an invitation token for frontend flows.
    """
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            invitation = UserInvitation.objects.get(invitation_token=token)
        except UserInvitation.DoesNotExist:
            return Response({'valid': False, 'detail': 'Invalid token.'}, status=status.HTTP_404_NOT_FOUND)

        if invitation.status != 'pending':
            return Response({'valid': False, 'detail': 'Invitation is not pending.'}, status=status.HTTP_400_BAD_REQUEST)

        if invitation.is_expired():
            invitation.status = 'expired'
            invitation.save(update_fields=['status'])
            return Response({'valid': False, 'detail': 'Invitation has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        data = {
            'valid': True,
            'email': invitation.email,
            'role': invitation.role,
            'company': {
                'id': invitation.company.id,
                'name': invitation.company.company_name,
            },
            'expires_at': invitation.expires_at,
        }
        return Response(data, status=status.HTTP_200_OK)


class AcceptInvitationView(APIView):
    """
    POST: Accept an invitation using a token. Creates or links user to company.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AcceptInvitationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        invitation = serializer.validated_data['invitation']
        department = serializer.validated_data.get('department')
        password = serializer.validated_data.get('password')

        # Create or fetch user by invitation email
        user = User.objects.filter(email=invitation.email).first()
        if user is None:
            user = User.objects.create_user(
                username=invitation.email,
                email=invitation.email,
                password=password,
                first_name='',
                last_name='',
                account_type='company',
                is_verified=True,
            )
        else:
            # Ensure account is company type for access to company endpoints
            if user.account_type != 'company':
                user.account_type = 'company'
                user.save(update_fields=['account_type'])
            # Optionally set password if provided and user has unusable password
            if password:
                user.set_password(password)
                user.save(update_fields=['password'])

        # Ensure company membership exists
        company_user, created = CompanyUser.objects.get_or_create(
            user=user,
            company=invitation.company,
            defaults={
                'role': invitation.role,
                'department': department,
                'invited_by': invitation.invited_by,
                'joined_at': timezone.now(),
                'is_active': True,
            }
        )

        if not created:
            # Update role/department if membership existed
            updated = False
            if company_user.role != invitation.role:
                company_user.role = invitation.role
                updated = True
            if department is not None and company_user.department != department:
                company_user.department = department
                updated = True
            if updated:
                company_user.save()

        # Mark invitation accepted
        invitation.status = 'accepted'
        invitation.accepted_at = timezone.now()
        invitation.save(update_fields=['status', 'accepted_at'])

        # Issue JWT tokens for immediate login
        refresh = RefreshToken.for_user(user)
        response_data = {
            'detail': 'Invitation accepted successfully.',
            'user': UserSerializer(user).data,
            'company': {
                'id': invitation.company.id,
                'name': invitation.company.company_name,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }
        return Response(response_data, status=status.HTTP_200_OK)
