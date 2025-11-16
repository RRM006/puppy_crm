from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Company, CompanyUser, Customer, CustomerCompany, UserInvitation
from django.db.models import Count

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'account_type', 'phone', 'is_verified', 'created_at']
        read_only_fields = ['id', 'created_at']


class RegisterCompanySerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password2 = serializers.CharField(write_only=True, required=True, min_length=8)
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    company_name = serializers.CharField(required=True, max_length=255)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=32)
    employee_count = serializers.IntegerField(required=False, allow_null=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        # Remove password2 and company fields
        validated_data.pop('password2')
        company_name = validated_data.pop('company_name')
        phone = validated_data.pop('phone', '')
        employee_count = validated_data.pop('employee_count', None)

        # Create user
        user = User.objects.create_user(
            username=validated_data['email'],  # Use email as username
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            account_type='company',
            phone=phone
        )

        # Create company
        company = Company.objects.create(
            company_name=company_name,
            phone=phone,
            employee_count=employee_count,
            created_by=user
        )

        # Create company user relationship with CEO role
        CompanyUser.objects.create(
            user=user,
            company=company,
            role='ceo'
        )

        return user


class RegisterCustomerSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password2 = serializers.CharField(write_only=True, required=True, min_length=8)
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=32)
    address = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        # Remove password2 and customer fields
        validated_data.pop('password2')
        phone = validated_data.pop('phone', '')
        address = validated_data.pop('address', '')

        # Create user
        user = User.objects.create_user(
            username=validated_data['email'],  # Use email as username
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            account_type='customer',
            phone=phone
        )

        # Create customer profile
        Customer.objects.create(
            user=user,
            address=address
        )

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)


# ============================================
# Company Profile Serializers (Phase 3.2)
# ============================================

class CompanyUserSerializer(serializers.ModelSerializer):
    """Serializer for team members with user details and permissions."""
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CompanyUser
        fields = [
            'id', 'user_id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'department', 'is_active', 'joined_at',
            'can_invite_users', 'can_manage_deals', 'can_view_reports', 
            'can_manage_customers'
        ]
        read_only_fields = ['id', 'joined_at']
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()


class CompanyProfileSerializer(serializers.ModelSerializer):
    """Serializer for company profile with all details."""
    created_by_name = serializers.SerializerMethodField()
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    team_count = serializers.SerializerMethodField()
    active_team_count = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = [
            'id', 'company_name', 'logo', 'logo_url', 'website', 'industry',
            'description', 'phone', 'employee_count', 'address', 'city',
            'country', 'timezone', 'is_active', 'created_at', 'updated_at',
            'created_by_name', 'created_by_email', 'team_count', 'active_team_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_name', 
                           'created_by_email', 'team_count', 'active_team_count']
    
    def get_created_by_name(self, obj):
        return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
    
    def get_team_count(self, obj):
        return obj.team_members.count()
    
    def get_active_team_count(self, obj):
        return obj.team_members.filter(is_active=True).count()
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
        return None


class UpdateCompanyProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating company profile with permission checks."""
    
    class Meta:
        model = Company
        fields = [
            'company_name', 'logo', 'website', 'industry', 'description',
            'phone', 'employee_count', 'address', 'city', 'country', 'timezone'
        ]
    
    def validate(self, attrs):
        """Validate that sensitive fields are only updated by CEO."""
        user = self.context['request'].user
        
        # Get user's role in the company
        try:
            company_user = CompanyUser.objects.get(
                user=user,
                company=self.instance,
                is_active=True
            )
        except CompanyUser.DoesNotExist:
            raise serializers.ValidationError("You are not a member of this company.")
        
        # Check if updating sensitive fields
        sensitive_fields = ['company_name', 'employee_count']
        is_updating_sensitive = any(field in attrs for field in sensitive_fields)
        
        # Only CEO can update sensitive fields
        if is_updating_sensitive and company_user.role != 'ceo':
            raise serializers.ValidationError(
                "Only CEO can update company name and employee count."
            )
        
        return attrs


# ============================================
# Customer Profile Serializers (Phase 3.3)
# ============================================

class CustomerCompanySerializer(serializers.ModelSerializer):
    """Serializer for companies linked to customer."""
    company_id = serializers.IntegerField(source='company.id', read_only=True)
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    company_logo = serializers.SerializerMethodField()
    company_website = serializers.URLField(source='company.website', read_only=True)
    company_industry = serializers.CharField(source='company.industry', read_only=True)
    company_phone = serializers.CharField(source='company.phone', read_only=True)
    company_address = serializers.CharField(source='company.address', read_only=True)
    company_city = serializers.CharField(source='company.city', read_only=True)
    company_country = serializers.CharField(source='company.country', read_only=True)
    
    class Meta:
        model = CustomerCompany
        fields = [
            'id', 'company_id', 'company_name', 'company_logo', 'company_website',
            'company_industry', 'company_phone', 'company_address', 'company_city',
            'company_country', 'verified', 'verified_at', 'created_at'
        ]
        read_only_fields = ['id', 'verified', 'verified_at', 'created_at']
    
    def get_company_logo(self, obj):
        if obj.company.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.company.logo.url)
        return None


class CustomerProfileSerializer(serializers.ModelSerializer):
    """Serializer for customer profile with all details."""
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    full_name = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    linked_companies_count = serializers.SerializerMethodField()
    verified_companies_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = [
            'id', 'user_id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'profile_picture', 'profile_picture_url', 'date_of_birth',
            'address', 'city', 'country', 'created_at', 'updated_at',
            'linked_companies_count', 'verified_companies_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
        return None
    
    def get_linked_companies_count(self, obj):
        return obj.companies.count()
    
    def get_verified_companies_count(self, obj):
        return obj.companies.filter(verified=True).count()


class UpdateCustomerProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating customer profile."""
    first_name = serializers.CharField(required=False, max_length=150, allow_blank=True)
    last_name = serializers.CharField(required=False, max_length=150, allow_blank=True)
    phone = serializers.CharField(required=False, max_length=32, allow_blank=True)
    
    class Meta:
        model = Customer
        fields = [
            'profile_picture', 'date_of_birth', 'address', 'city', 'country',
            'first_name', 'last_name', 'phone'
        ]
    
    def validate_date_of_birth(self, value):
        """Validate date of birth is not in the future."""
        if value and value > timezone.now().date():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value
    
    def update(self, instance, validated_data):
        """Update customer profile and related user fields."""
        # Extract user fields
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        phone = validated_data.pop('phone', None)
        
        # Update user fields if provided
        if first_name is not None:
            instance.user.first_name = first_name
        if last_name is not None:
            instance.user.last_name = last_name
        if phone is not None:
            instance.user.phone = phone
        
        # Save user if any user fields were updated
        if first_name is not None or last_name is not None or phone is not None:
            instance.user.save()
        
        # Update customer fields
        return super().update(instance, validated_data)


class LinkToCompanySerializer(serializers.Serializer):
    """Serializer for linking customer to a company."""
    company_id = serializers.IntegerField(required=False)
    company_name = serializers.CharField(required=False, max_length=255)
    
    def validate(self, data):
        """Validate that either company_id or company_name is provided."""
        if not data.get('company_id') and not data.get('company_name'):
            raise serializers.ValidationError(
                "Either company_id or company_name must be provided."
            )
        
        # If company_id provided, check if company exists
        if data.get('company_id'):
            try:
                company = Company.objects.get(id=data['company_id'], is_active=True)
                data['company'] = company
            except Company.DoesNotExist:
                raise serializers.ValidationError(
                    {"company_id": "Company not found or inactive."}
                )
        
        # If company_name provided, search for companies
        elif data.get('company_name'):
            companies = Company.objects.filter(
                company_name__icontains=data['company_name'],
                is_active=True
            )
            if not companies.exists():
                raise serializers.ValidationError(
                    {"company_name": "No active companies found with this name."}
                )
            elif companies.count() > 1:
                # Return list of matching companies for user to choose
                company_list = [
                    {'id': c.id, 'name': c.company_name, 'city': c.city}
                    for c in companies[:10]
                ]
                raise serializers.ValidationError({
                    "company_name": "Multiple companies found. Please use company_id.",
                    "matches": company_list
                })
            else:
                data['company'] = companies.first()
        
        return data


# ============================================
# Team Invitation Serializers (Phase 3.4)
# ============================================

class InviteUserSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    role = serializers.ChoiceField(choices=CompanyUser.ROLE_CHOICES, required=True)
    department = serializers.ChoiceField(choices=CompanyUser.DEPARTMENT_CHOICES, required=False, allow_null=True)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)

    def validate_email(self, value):
        company = self.context.get('company')
        if not company:
            raise serializers.ValidationError("Company context is required.")

        # If user exists and is already a member of this company
        existing_user = User.objects.filter(email=value).first()
        if existing_user and CompanyUser.objects.filter(user=existing_user, company=company).exists():
            raise serializers.ValidationError("This email already belongs to a member of your company.")

        # Existing pending invitation for this email in this company
        if UserInvitation.objects.filter(company=company, email=value, status='pending').exists():
            raise serializers.ValidationError("An invitation is already pending for this email.")

        return value


class InvitationSerializer(serializers.ModelSerializer):
    inviter_name = serializers.SerializerMethodField()
    inviter_email = serializers.EmailField(source='invited_by.email', read_only=True)
    company_id = serializers.IntegerField(source='company.id', read_only=True)
    company_name = serializers.CharField(source='company.company_name', read_only=True)

    class Meta:
        model = UserInvitation
        fields = [
            'id', 'email', 'role', 'status', 'invitation_token', 'expires_at',
            'created_at', 'accepted_at', 'inviter_name', 'inviter_email',
            'company_id', 'company_name'
        ]
        read_only_fields = ['id', 'status', 'invitation_token', 'expires_at', 'created_at', 'accepted_at']

    def get_inviter_name(self, obj):
        return f"{obj.invited_by.first_name} {obj.invited_by.last_name}".strip()


class AcceptInvitationSerializer(serializers.Serializer):
    invitation_token = serializers.CharField(required=True)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True)
    department = serializers.ChoiceField(choices=CompanyUser.DEPARTMENT_CHOICES, required=False, allow_null=True)

    def validate(self, data):
        token = data.get('invitation_token')
        try:
            invitation = UserInvitation.objects.get(invitation_token=token)
        except UserInvitation.DoesNotExist:
            raise serializers.ValidationError({"invitation_token": "Invalid invitation token."})

        # Check status
        if invitation.status != 'pending':
            raise serializers.ValidationError("This invitation is no longer valid.")

        # Check expiry
        if invitation.is_expired():
            invitation.status = 'expired'
            invitation.save(update_fields=['status'])
            raise serializers.ValidationError("This invitation has expired.")

        # If user doesn't exist, password is required
        if not User.objects.filter(email=invitation.email).exists():
            pwd = data.get('password')
            if not pwd or len(pwd) < 8:
                raise serializers.ValidationError({"password": "Password is required (min 8 chars)."})

        data['invitation'] = invitation
        return data

