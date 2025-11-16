"""
Customer Management Serializers
Handles customer profiles, orders, tags, segments, and interactions.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Max
from apps.authentication.models import Customer, CustomerCompany, Company
from apps.customers.models import (
    CustomerProfile, CustomerTag, CustomerSegment,
    Order, OrderItem, CustomerInteraction
)

User = get_user_model()


class CustomerTagSerializer(serializers.ModelSerializer):
    """Serializer for customer tags"""
    
    class Meta:
        model = CustomerTag
        fields = ['id', 'name', 'color', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        # Automatically set company from request context
        company_user = self.context['request'].user.company_users.filter(is_active=True).first()
        validated_data['company'] = company_user.company
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class CustomerSegmentSerializer(serializers.ModelSerializer):
    """Serializer for customer segments"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    customer_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomerSegment
        fields = ['id', 'name', 'description', 'criteria', 'created_by_name', 
                  'customer_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_customer_count(self, obj):
        """Get count of customers matching segment criteria"""
        # This would need to be implemented based on criteria evaluation
        # For now, return 0 as placeholder
        return 0
    
    def create(self, validated_data):
        company_user = self.context['request'].user.company_users.filter(is_active=True).first()
        validated_data['company'] = company_user.company
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class AccountManagerSerializer(serializers.ModelSerializer):
    """Serializer for account manager info"""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role']


class CustomerListSerializer(serializers.ModelSerializer):
    """Serializer for listing customers (basic info)"""
    customer_id = serializers.IntegerField(source='customer.id', read_only=True)
    customer_email = serializers.EmailField(source='customer.user.email', read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.CharField(source='customer.user.phone', read_only=True)
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    
    # Profile fields
    lifetime_value = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()
    last_order_date = serializers.SerializerMethodField()
    tags = CustomerTagSerializer(many=True, read_only=True, source='customer.profile.tags')
    
    # Relationship fields
    customer_status = serializers.CharField(read_only=True)
    customer_since = serializers.DateTimeField(read_only=True)
    account_manager = AccountManagerSerializer(read_only=True)
    verified = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = CustomerCompany
        fields = [
            'id', 'customer_id', 'customer_email', 'customer_name', 'customer_phone',
            'company_name', 'lifetime_value', 'total_orders', 'last_order_date',
            'tags', 'customer_status', 'customer_since', 'account_manager',
            'verified', 'notes'
        ]
    
    def get_customer_name(self, obj):
        """Get customer full name"""
        return obj.customer.user.get_full_name()
    
    def get_lifetime_value(self, obj):
        """Get customer lifetime value from profile"""
        try:
            profile = obj.customer.profile
            return float(profile.lifetime_value)
        except CustomerProfile.DoesNotExist:
            return 0.0
    
    def get_total_orders(self, obj):
        """Get total order count from profile"""
        try:
            profile = obj.customer.profile
            return profile.total_orders
        except CustomerProfile.DoesNotExist:
            return 0
    
    def get_last_order_date(self, obj):
        """Get last order date from profile"""
        try:
            profile = obj.customer.profile
            return profile.last_order_date
        except CustomerProfile.DoesNotExist:
            return None


class OrderSummarySerializer(serializers.ModelSerializer):
    """Serializer for order summary in customer details"""
    
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'title', 'status', 'total_amount', 
                  'currency', 'order_date', 'payment_status']


class InteractionSummarySerializer(serializers.ModelSerializer):
    """Serializer for interaction summary"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = CustomerInteraction
        fields = ['id', 'interaction_type', 'subject', 'sentiment', 
                  'user_name', 'created_at']


class CustomerProfileDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for customer profile"""
    tags = CustomerTagSerializer(many=True, read_only=True)
    
    class Meta:
        model = CustomerProfile
        fields = ['id', 'customer_type', 'company_size', 'industry', 
                  'annual_revenue', 'preferences', 'lifetime_value', 
                  'total_orders', 'last_order_date', 'tags', 'notes',
                  'created_at', 'updated_at']


class CustomerDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for customer with full information"""
    customer = serializers.SerializerMethodField()
    profile = CustomerProfileDetailSerializer(source='customer.profile', read_only=True)
    account_manager = AccountManagerSerializer(read_only=True)
    
    # Order history
    recent_orders = serializers.SerializerMethodField()
    order_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    
    # Interaction history
    recent_interactions = serializers.SerializerMethodField()
    interaction_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomerCompany
        fields = [
            'id', 'customer', 'profile', 'verified', 'customer_since',
            'customer_status', 'account_manager', 'notes',
            'recent_orders', 'order_count', 'total_spent',
            'recent_interactions', 'interaction_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_customer(self, obj):
        """Get customer basic info"""
        customer = obj.customer
        user = customer.user
        return {
            'id': customer.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'address': customer.address,
            'city': customer.city,
            'country': customer.country,
        }
    
    def get_recent_orders(self, obj):
        """Get recent orders (last 10)"""
        orders = Order.objects.filter(
            company=obj.company,
            customer=obj.customer
        ).order_by('-order_date')[:10]
        return OrderSummarySerializer(orders, many=True).data
    
    def get_order_count(self, obj):
        """Get total order count"""
        return Order.objects.filter(
            company=obj.company,
            customer=obj.customer
        ).count()
    
    def get_total_spent(self, obj):
        """Get total amount spent"""
        total = Order.objects.filter(
            company=obj.company,
            customer=obj.customer,
            payment_status='paid'
        ).aggregate(total=Sum('total_amount'))['total']
        return float(total) if total else 0.0
    
    def get_recent_interactions(self, obj):
        """Get recent interactions (last 10)"""
        interactions = CustomerInteraction.objects.filter(
            company=obj.company,
            customer=obj.customer
        ).order_by('-created_at')[:10]
        return InteractionSummarySerializer(interactions, many=True).data
    
    def get_interaction_count(self, obj):
        """Get total interaction count"""
        return CustomerInteraction.objects.filter(
            company=obj.company,
            customer=obj.customer
        ).count()


class AddCustomerSerializer(serializers.Serializer):
    """Serializer for adding customer to company"""
    email = serializers.EmailField(required=True)
    
    # Optional fields for creating new customer
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    company_name = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    state = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    postal_code = serializers.CharField(required=False, allow_blank=True)
    
    # Notes for the relationship
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_email(self, value):
        """Validate email format"""
        return value.lower()
    
    def create(self, validated_data):
        """
        Create or link customer to company
        Returns: CustomerCompany instance
        """
        email = validated_data.pop('email')
        notes = validated_data.pop('notes', '')
        company_user = self.context['request'].user.company_users.filter(is_active=True).first()
        company = company_user.company
        
        # Check if customer exists
        try:
            customer = Customer.objects.get(email=email)
            
            # Check if already linked to this company
            if CustomerCompany.objects.filter(customer=customer, company=company).exists():
                raise serializers.ValidationError({
                    'email': 'This customer is already linked to your company.'
                })
            
            # Create link
            customer_company = CustomerCompany.objects.create(
                customer=customer,
                company=company,
                notes=notes,
                verified=False
            )
            
            return customer_company
            
        except Customer.DoesNotExist:
            # Create new customer
            customer = Customer.objects.create(
                email=email,
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
                phone_number=validated_data.get('phone_number', ''),
                company_name=validated_data.get('company_name', ''),
                address=validated_data.get('address', ''),
                city=validated_data.get('city', ''),
                state=validated_data.get('state', ''),
                country=validated_data.get('country', ''),
                postal_code=validated_data.get('postal_code', ''),
            )
            
            # Set unusable password for company-created customers
            customer.set_unusable_password()
            customer.save()
            
            # Create profile
            CustomerProfile.objects.create(customer=customer)
            
            # Create link
            customer_company = CustomerCompany.objects.create(
                customer=customer,
                company=company,
                notes=notes,
                verified=False
            )
            
            return customer_company


class UpdateCustomerSerializer(serializers.ModelSerializer):
    """Serializer for updating customer relationship"""
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    account_manager_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = CustomerCompany
        fields = ['notes', 'customer_status', 'tag_ids', 'account_manager_id']
    
    def validate_account_manager_id(self, value):
        """Validate account manager belongs to company"""
        if value is not None:
            company_user = self.context['request'].user.company_users.filter(is_active=True).first()
            company = company_user.company
            if not User.objects.filter(id=value, company_users__company=company).exists():
                raise serializers.ValidationError(
                    'Account manager must be a user in your company.'
                )
        return value
    
    def validate_tag_ids(self, value):
        """Validate tags belong to company"""
        company_user = self.context['request'].user.company_users.filter(is_active=True).first()
        company = company_user.company
        tags = CustomerTag.objects.filter(id__in=value, company=company)
        if tags.count() != len(value):
            raise serializers.ValidationError(
                'One or more tags do not exist or do not belong to your company.'
            )
        return value
    
    def update(self, instance, validated_data):
        """Update customer relationship and profile tags"""
        tag_ids = validated_data.pop('tag_ids', None)
        account_manager_id = validated_data.pop('account_manager_id', None)
        
        # Update account manager
        if account_manager_id is not None:
            if account_manager_id == 0:
                instance.account_manager = None
            else:
                instance.account_manager_id = account_manager_id
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update tags if provided
        if tag_ids is not None:
            try:
                profile = instance.customer.profile
                tags = CustomerTag.objects.filter(id__in=tag_ids)
                profile.tags.set(tags)
            except CustomerProfile.DoesNotExist:
                # Create profile if it doesn't exist
                profile = CustomerProfile.objects.create(customer=instance.customer)
                tags = CustomerTag.objects.filter(id__in=tag_ids)
                profile.tags.set(tags)
        
        return instance


class AssignAccountManagerSerializer(serializers.Serializer):
    """Serializer for assigning account manager"""
    account_manager_id = serializers.IntegerField()
    
    def validate_account_manager_id(self, value):
        """Validate account manager exists and belongs to company"""
        company_user = self.context['request'].user.company_users.filter(is_active=True).first()
        company = company_user.company
        try:
            user = User.objects.get(id=value, company_users__company=company)
            user_company_user = user.company_users.filter(company=company).first()
            if user_company_user.role not in ['ceo', 'manager', 'sales_manager']:
                raise serializers.ValidationError(
                    'Account manager must have CEO, Manager, or Sales Manager role.'
                )
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError(
                'Account manager not found or does not belong to your company.'
            )


# ============================================================================
# Order Management Serializers
# ============================================================================

class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_name', 'product_sku', 'quantity',
            'unit_price', 'discount', 'tax', 'total_price', 'created_at'
        ]
        read_only_fields = ['id', 'total_price', 'created_at']


class OrderListSerializer(serializers.ModelSerializer):
    """Serializer for listing orders (summary)"""
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.CharField(source='customer.user.email', read_only=True)
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'customer_email',
            'title', 'status', 'payment_status', 'total_amount', 'currency',
            'order_date', 'expected_delivery_date', 'item_count', 'created_at'
        ]
        read_only_fields = ['id', 'order_number', 'created_at']
    
    def get_customer_name(self, obj):
        """Get customer full name"""
        return obj.customer.user.get_full_name()
    
    def get_item_count(self, obj):
        """Get number of items in order"""
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for order with all information"""
    customer = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'title', 'description',
            'status', 'payment_status', 'payment_method',
            'total_amount', 'currency', 'order_date',
            'expected_delivery_date', 'actual_delivery_date',
            'shipping_address', 'billing_address',
            'tracking_number', 'notes', 'items',
            'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order_number', 'created_at', 'updated_at']
    
    def get_customer(self, obj):
        """Get customer information"""
        return {
            'id': obj.customer.id,
            'email': obj.customer.user.email,
            'first_name': obj.customer.user.first_name,
            'last_name': obj.customer.user.last_name,
            'phone': obj.customer.user.phone,
        }


class CreateOrderSerializer(serializers.ModelSerializer):
    """Serializer for creating orders"""
    items = OrderItemSerializer(many=True)
    customer_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Order
        fields = [
            'customer_id', 'title', 'description', 'currency',
            'expected_delivery_date', 'shipping_address', 'billing_address',
            'payment_method', 'notes', 'items'
        ]
    
    def validate_customer_id(self, value):
        """Validate customer belongs to company"""
        company_user = self.context['request'].user.company_users.filter(is_active=True).first()
        company = company_user.company
        
        # Check if customer is linked to this company
        if not CustomerCompany.objects.filter(
            customer_id=value,
            company=company,
            verified=True
        ).exists():
            raise serializers.ValidationError(
                'Customer not found or not linked to your company.'
            )
        return value
    
    def validate_items(self, value):
        """Validate order has at least one item"""
        if not value or len(value) == 0:
            raise serializers.ValidationError('Order must have at least one item.')
        return value
    
    def create(self, validated_data):
        """Create order with items"""
        from django.utils import timezone
        import random
        
        items_data = validated_data.pop('items')
        customer_id = validated_data.pop('customer_id')
        
        company_user = self.context['request'].user.company_users.filter(is_active=True).first()
        company = company_user.company
        customer = Customer.objects.get(id=customer_id)
        
        # Generate order number
        year = timezone.now().year
        random_num = random.randint(10000, 99999)
        order_number = f"ORD-{year}-{random_num}"
        
        # Ensure unique order number
        while Order.objects.filter(order_number=order_number).exists():
            random_num = random.randint(10000, 99999)
            order_number = f"ORD-{year}-{random_num}"
        
        # Calculate total from items
        total_amount = sum(
            (item['unit_price'] * item['quantity']) - item.get('discount', 0) + item.get('tax', 0)
            for item in items_data
        )
        
        # Create order
        order = Order.objects.create(
            company=company,
            customer=customer,
            order_number=order_number,
            total_amount=total_amount,
            created_by=self.context['request'].user,
            **validated_data
        )
        
        # Create order items
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        # Update customer profile stats
        try:
            profile = customer.profile
            profile.total_orders = Order.objects.filter(customer=customer).count()
            profile.last_order_date = timezone.now()
            profile.lifetime_value = Order.objects.filter(
                customer=customer,
                payment_status='paid'
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            profile.save()
        except CustomerProfile.DoesNotExist:
            # Create profile if it doesn't exist
            CustomerProfile.objects.create(
                customer=customer,
                total_orders=1,
                last_order_date=timezone.now(),
                lifetime_value=total_amount if validated_data.get('payment_status') == 'paid' else 0
            )
        
        # TODO: Send confirmation email to customer
        
        return order


class UpdateOrderSerializer(serializers.ModelSerializer):
    """Serializer for updating orders"""
    
    class Meta:
        model = Order
        fields = [
            'status', 'payment_status', 'payment_method',
            'expected_delivery_date', 'actual_delivery_date',
            'tracking_number', 'notes'
        ]
    
    def update(self, instance, validated_data):
        """Update order and handle status changes"""
        from django.utils import timezone
        
        # If status changed to delivered, set actual_delivery_date
        if 'status' in validated_data and validated_data['status'] == 'delivered':
            if not instance.actual_delivery_date:
                validated_data['actual_delivery_date'] = timezone.now()
        
        # Update fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update customer lifetime value if payment status changed to paid
        if 'payment_status' in validated_data and validated_data['payment_status'] == 'paid':
            try:
                profile = instance.customer.profile
                profile.lifetime_value = Order.objects.filter(
                    customer=instance.customer,
                    payment_status='paid'
                ).aggregate(total=Sum('total_amount'))['total'] or 0
                profile.save()
            except CustomerProfile.DoesNotExist:
                pass
        
        return instance


class UpdateOrderStatusSerializer(serializers.Serializer):
    """Serializer for updating order status"""
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_status(self, value):
        """Validate status transition"""
        # You can add custom logic here to validate status transitions
        # For example: can't go from delivered back to pending
        return value


# ============================================================================
# CUSTOMER INTERACTION SERIALIZERS - PHASE 5.4
# ============================================================================

class CustomerInteractionSerializer(serializers.ModelSerializer):
    """Serializer for customer interactions"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    customer_name = serializers.CharField(source='customer.user.get_full_name', read_only=True)
    customer_email = serializers.CharField(source='customer.user.email', read_only=True)
    
    class Meta:
        model = CustomerInteraction
        fields = [
            'id', 'customer', 'customer_name', 'customer_email', 'user', 'user_name',
            'interaction_type', 'subject', 'description', 'sentiment', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CreateInteractionSerializer(serializers.ModelSerializer):
    """Serializer for creating customer interactions"""
    customer_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = CustomerInteraction
        fields = [
            'customer_id', 'interaction_type', 'subject', 'description', 'sentiment'
        ]
    
    def validate_customer_id(self, value):
        """Validate customer belongs to company"""
        company_user = self.context['request'].user.company_users.filter(is_active=True).first()
        company = company_user.company
        
        # Check if customer is linked to this company
        if not CustomerCompany.objects.filter(
            customer_id=value,
            company=company,
            verified=True
        ).exists():
            raise serializers.ValidationError(
                'Customer not found or not linked to your company.'
            )
        return value
    
    def create(self, validated_data):
        """Create interaction with company and user"""
        customer_id = validated_data.pop('customer_id')
        
        company_user = self.context['request'].user.company_users.filter(is_active=True).first()
        company = company_user.company
        customer = Customer.objects.get(id=customer_id)
        
        interaction = CustomerInteraction.objects.create(
            company=company,
            customer=customer,
            user=self.context['request'].user,
            **validated_data
        )
        
        return interaction


# ============================================================================
# CUSTOMER PORTAL SERIALIZERS - PHASE 5.5
# ============================================================================

class CustomerCompanyDetailSerializer(serializers.ModelSerializer):
    """Company info visible to customers"""
    company_id = serializers.IntegerField(source='company.id', read_only=True)
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    company_phone = serializers.CharField(source='company.phone', read_only=True)
    account_manager_name = serializers.SerializerMethodField()
    account_manager_email = serializers.SerializerMethodField()
    order_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomerCompany
        fields = [
            'id', 'company_id', 'company_name', 'company_phone', 'verified',
            'customer_status', 'customer_since', 'account_manager_name',
            'account_manager_email', 'order_count', 'total_spent', 'created_at'
        ]
    
    def get_account_manager_name(self, obj):
        if obj.account_manager:
            return obj.account_manager.get_full_name()
        return None
    
    def get_account_manager_email(self, obj):
        if obj.account_manager:
            return obj.account_manager.email
        return None
    
    def get_order_count(self, obj):
        return Order.objects.filter(
            company=obj.company,
            customer=obj.customer
        ).count()
    
    def get_total_spent(self, obj):
        total = Order.objects.filter(
            company=obj.company,
            customer=obj.customer,
            payment_status='paid'
        ).aggregate(total=Sum('total_amount'))['total']
        return float(total) if total else 0.0


class CustomerOrderListSerializer(serializers.ModelSerializer):
    """Customer's view of orders"""
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'company_name', 'title', 'status', 'payment_status',
            'total_amount', 'currency', 'order_date', 'expected_delivery_date',
            'actual_delivery_date', 'tracking_number', 'item_count', 'created_at'
        ]
    
    def get_item_count(self, obj):
        return obj.items.count()


class CustomerOrderDetailSerializer(serializers.ModelSerializer):
    """Detailed order view for customers"""
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    company_phone = serializers.CharField(source='company.phone', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'company_name', 'company_phone', 'title',
            'description', 'status', 'payment_status', 'payment_method',
            'total_amount', 'currency', 'order_date', 'expected_delivery_date',
            'actual_delivery_date', 'shipping_address', 'billing_address',
            'tracking_number', 'notes', 'items', 'created_at', 'updated_at'
        ]


class CustomerDashboardSerializer(serializers.Serializer):
    """Customer dashboard summary"""
    linked_companies = CustomerCompanyDetailSerializer(many=True)
    total_orders = serializers.IntegerField()
    recent_orders = CustomerOrderListSerializer(many=True)
    active_complaints_count = serializers.IntegerField()
    pending_verifications_count = serializers.IntegerField()
