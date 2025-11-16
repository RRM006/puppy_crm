"""
Customer Management API Views
Handles customer CRUD, tags, segments, and statistics.
"""

from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count, Avg, Max
from django.core.paginator import Paginator
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404

from apps.authentication.models import Customer, CustomerCompany, User
from apps.customers.models import (
    CustomerProfile, CustomerTag, CustomerSegment,
    Order, CustomerInteraction
)
from apps.customers.serializers import (
    CustomerListSerializer, CustomerDetailSerializer,
    AddCustomerSerializer, UpdateCustomerSerializer,
    CustomerTagSerializer, CustomerSegmentSerializer,
    AssignAccountManagerSerializer
)
from apps.customers.permissions import IsCompanyUser, CanManageCustomers


def get_user_company(user):
    """Helper to get company from user"""
    company_user = user.company_users.filter(is_active=True).first()
    return company_user.company if company_user else None


class CustomerListView(APIView):
    """
    GET: List all customers for the company with filters
    POST: Add customer to company
    """
    permission_classes = [IsAuthenticated, IsCompanyUser, CanManageCustomers]
    
    def get(self, request):
        """List customers with filtering, searching, sorting, and pagination"""
        company = get_user_company(request.user)
        
        # Base queryset - only customers linked to this company
        queryset = CustomerCompany.objects.filter(
            company=company
        ).select_related(
            'customer',
            'customer__user',
            'customer__profile',
            'account_manager'
        ).prefetch_related(
            'customer__profile__tags'
        )
        
        # Filter by status
        customer_status = request.query_params.get('status')
        if customer_status:
            queryset = queryset.filter(customer_status=customer_status)
        
        # Filter by verified
        verified = request.query_params.get('verified')
        if verified is not None:
            queryset = queryset.filter(verified=verified.lower() == 'true')
        
        # Filter by tags
        tag_ids = request.query_params.getlist('tags')
        if tag_ids:
            queryset = queryset.filter(
                customer__customerprofile__tags__id__in=tag_ids
            ).distinct()
        
        # Filter by account manager
        account_manager_id = request.query_params.get('account_manager')
        if account_manager_id:
            queryset = queryset.filter(account_manager_id=account_manager_id)
        
        # Filter by customer_since date range
        since_from = request.query_params.get('since_from')
        since_to = request.query_params.get('since_to')
        if since_from:
            queryset = queryset.filter(customer_since__gte=since_from)
        if since_to:
            queryset = queryset.filter(customer_since__lte=since_to)
        
        # Search by name, email, phone
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(customer__user__first_name__icontains=search) |
                Q(customer__user__last_name__icontains=search) |
                Q(customer__user__email__icontains=search) |
                Q(customer__user__phone__icontains=search)
            )
        
        # Sort
        sort_by = request.query_params.get('sort_by', '-created_at')
        valid_sorts = {
            'name': 'customer__user__first_name',
            '-name': '-customer__user__first_name',
            'email': 'customer__user__email',
            '-email': '-customer__user__email',
            'lifetime_value': 'customer__profile__lifetime_value',
            '-lifetime_value': '-customer__profile__lifetime_value',
            'total_orders': 'customer__profile__total_orders',
            '-total_orders': '-customer__profile__total_orders',
            'last_order_date': 'customer__profile__last_order_date',
            '-last_order_date': '-customer__profile__last_order_date',
            'customer_since': 'customer_since',
            '-customer_since': '-customer_since',
            'created_at': 'created_at',
            '-created_at': '-created_at',
        }
        
        if sort_by in valid_sorts:
            queryset = queryset.order_by(valid_sorts[sort_by])
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = queryset.count()
        customers = queryset[start:end]
        
        serializer = CustomerListSerializer(customers, many=True)
        
        return Response({
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
            'results': serializer.data
        })
    
    def post(self, request):
        """Add customer to company"""
        company = get_user_company(request.user)
        serializer = AddCustomerSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            customer_company = serializer.save()
            detail_serializer = CustomerDetailSerializer(customer_company)
            return Response(
                {
                    'message': 'Customer added successfully',
                    'customer': detail_serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomerDetailView(APIView):
    """
    GET: Get customer details
    PUT: Update customer information
    """
    permission_classes = [IsAuthenticated, IsCompanyUser, CanManageCustomers]
    
    def get_object(self, customer_id):
        """Get customer company relationship"""
        company = get_user_company(self.request.user)
        customer_company = get_object_or_404(
            CustomerCompany,
            id=customer_id,
            company=company
        )
        
        # Check object-level permission
        self.check_object_permissions(self.request, customer_company)
        return customer_company
    
    def get(self, request, customer_id):
        """Get full customer details"""
        customer_company = self.get_object(customer_id)
        serializer = CustomerDetailSerializer(customer_company)
        return Response(serializer.data)
    
    def put(self, request, customer_id):
        """Update customer information"""
        customer_company = self.get_object(customer_id)
        serializer = UpdateCustomerSerializer(
            customer_company,
            data=request.data,
            context={'request': request},
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            detail_serializer = CustomerDetailSerializer(customer_company)
            return Response({
                'message': 'Customer updated successfully',
                'customer': detail_serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AssignAccountManagerView(APIView):
    """
    POST: Assign account manager to customer
    """
    permission_classes = [IsAuthenticated, IsCompanyUser, CanManageCustomers]
    
    def post(self, request, customer_id):
        """Assign account manager"""
        company = get_user_company(request.user)
        customer_company = get_object_or_404(
            CustomerCompany,
            id=customer_id,
            company=company
        )
        
        serializer = AssignAccountManagerSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            account_manager_id = serializer.validated_data['account_manager_id']
            account_manager = User.objects.get(id=account_manager_id)
            
            customer_company.account_manager = account_manager
            customer_company.save()
            
            # TODO: Send notification to manager and customer
            
            return Response({
                'message': f'Account manager {account_manager.get_full_name()} assigned successfully',
                'customer': CustomerDetailSerializer(customer_company).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyCustomerView(APIView):
    """
    POST: Verify customer's link to company
    """
    permission_classes = [IsAuthenticated, IsCompanyUser, CanManageCustomers]
    
    def post(self, request, customer_id):
        """Verify customer"""
        company = get_user_company(request.user)
        customer_company = get_object_or_404(
            CustomerCompany,
            id=customer_id,
            company=company
        )
        
        if customer_company.verified:
            return Response(
                {'message': 'Customer is already verified'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        customer_company.verified = True
        # customer_since will be set automatically in save() method
        customer_company.save()
        
        # TODO: Send notification to customer
        
        return Response({
            'message': 'Customer verified successfully',
            'customer': CustomerDetailSerializer(customer_company).data
        })


class UnlinkCustomerView(APIView):
    """
    DELETE: Remove customer from company
    """
    permission_classes = [IsAuthenticated, IsCompanyUser, CanManageCustomers]
    
    def delete(self, request, customer_id):
        """Unlink customer from company"""
        company = get_user_company(request.user)
        customer_company = get_object_or_404(
            CustomerCompany,
            id=customer_id,
            company=company
        )
        
        customer_email = customer_company.customer.email
        
        # Delete the relationship (keep customer profile intact)
        customer_company.delete()
        
        return Response({
            'message': f'Customer {customer_email} unlinked successfully'
        })


class CustomerStatsView(APIView):
    """
    GET: Get customer statistics for the company
    """
    permission_classes = [IsAuthenticated, IsCompanyUser]
    
    def get(self, request):
        """Get customer statistics"""
        company = get_user_company(request.user)
        
        # Total customers
        total_customers = CustomerCompany.objects.filter(company=company).count()
        
        # Active vs inactive
        active_customers = CustomerCompany.objects.filter(
            company=company,
            customer_status='active'
        ).count()
        
        inactive_customers = CustomerCompany.objects.filter(
            company=company,
            customer_status='inactive'
        ).count()
        
        # Verified vs unverified
        verified_customers = CustomerCompany.objects.filter(
            company=company,
            verified=True
        ).count()
        
        # Total lifetime value
        total_lifetime_value = CustomerProfile.objects.filter(
            customer__customercompany__company=company
        ).aggregate(total=Sum('lifetime_value'))['total'] or 0
        
        # Average order value
        avg_order_value = Order.objects.filter(
            company=company,
            payment_status='paid'
        ).aggregate(avg=Avg('total_amount'))['avg'] or 0
        
        # Customers by tag
        customers_by_tag = []
        tags = CustomerTag.objects.filter(company=company).annotate(
            customer_count=Count('customerprofile__customer__customercompany')
        )
        for tag in tags:
            customers_by_tag.append({
                'tag_name': tag.name,
                'tag_color': tag.color,
                'count': tag.customer_count
            })
        
        # New customers this month
        first_day_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_customers_this_month = CustomerCompany.objects.filter(
            company=company,
            created_at__gte=first_day_of_month
        ).count()
        
        # Customers at risk (no order in 90 days)
        ninety_days_ago = timezone.now() - timedelta(days=90)
        customers_at_risk = CustomerProfile.objects.filter(
            customer__customercompany__company=company,
            customer__customercompany__customer_status='active'
        ).filter(
            Q(last_order_date__isnull=True) |
            Q(last_order_date__lt=ninety_days_ago)
        ).count()
        
        # Top customers by lifetime value
        top_customers = CustomerCompany.objects.filter(
            company=company
        ).select_related('customer', 'customer__customerprofile').order_by(
            '-customer__customerprofile__lifetime_value'
        )[:10]
        
        top_customers_data = []
        for cc in top_customers:
            try:
                profile = cc.customer.customerprofile
                top_customers_data.append({
                    'id': cc.id,
                    'name': cc.customer.get_full_name(),
                    'email': cc.customer.email,
                    'lifetime_value': float(profile.lifetime_value),
                    'total_orders': profile.total_orders
                })
            except CustomerProfile.DoesNotExist:
                continue
        
        return Response({
            'total_customers': total_customers,
            'active_customers': active_customers,
            'inactive_customers': inactive_customers,
            'verified_customers': verified_customers,
            'total_lifetime_value': float(total_lifetime_value),
            'average_order_value': float(avg_order_value),
            'customers_by_tag': customers_by_tag,
            'new_customers_this_month': new_customers_this_month,
            'customers_at_risk': customers_at_risk,
            'top_customers': top_customers_data
        })


class CustomerTagListCreateView(generics.ListCreateAPIView):
    """
    GET: List all tags for company
    POST: Create new tag
    """
    serializer_class = CustomerTagSerializer
    permission_classes = [IsAuthenticated, IsCompanyUser]
    
    def get_queryset(self):
        company = get_user_company(self.request.user)
        return CustomerTag.objects.filter(
            company=company
        ).order_by('name')


class CustomerTagDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Get tag details
    PUT: Update tag
    DELETE: Delete tag
    """
    serializer_class = CustomerTagSerializer
    permission_classes = [IsAuthenticated, IsCompanyUser]
    
    def get_queryset(self):
        return CustomerTag.objects.filter(
            company=self.request.user.company
        )


class CustomerSegmentListCreateView(generics.ListCreateAPIView):
    """
    GET: List all segments for company
    POST: Create new segment
    """
    serializer_class = CustomerSegmentSerializer
    permission_classes = [IsAuthenticated, IsCompanyUser]
    
    def get_queryset(self):
        company = get_user_company(self.request.user)
        return CustomerSegment.objects.filter(
            company=company
        ).order_by('-created_at')


class CustomerSegmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Get segment details
    PUT: Update segment
    DELETE: Delete segment
    """
    serializer_class = CustomerSegmentSerializer
    permission_classes = [IsAuthenticated, IsCompanyUser]
    
    def get_queryset(self):
        return CustomerSegment.objects.filter(
            company=self.request.user.company
        )


class CustomersBySegmentView(APIView):
    """
    GET: Get customers matching segment criteria
    """
    permission_classes = [IsAuthenticated, IsCompanyUser]
    
    def get(self, request, segment_id):
        """Get customers by segment"""
        company = get_user_company(request.user)
        segment = get_object_or_404(
            CustomerSegment,
            id=segment_id,
            company=company
        )
        
        # Base queryset
        queryset = CustomerCompany.objects.filter(company=company)
        
        # Apply segment criteria
        # TODO: Implement dynamic criteria evaluation
        # For now, return all customers as placeholder
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = queryset.count()
        customers = queryset[start:end]
        
        serializer = CustomerListSerializer(customers, many=True)
        
        return Response({
            'segment': {
                'id': segment.id,
                'name': segment.name,
                'description': segment.description
            },
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
            'results': serializer.data
        })


# ============================================================================
# Order Management Views
# ============================================================================

from apps.customers.serializers import (
    OrderListSerializer, OrderDetailSerializer,
    CreateOrderSerializer, UpdateOrderSerializer,
    UpdateOrderStatusSerializer, OrderItemSerializer
)


class OrderListCreateView(APIView):
    """
    GET: List all orders for company
    POST: Create new order
    """
    permission_classes = [IsAuthenticated, IsCompanyUser, CanManageCustomers]
    
    def get(self, request):
        """List orders with filtering, searching, sorting, and pagination"""
        company = get_user_company(request.user)
        
        # Base queryset
        queryset = Order.objects.filter(
            company=company
        ).select_related('customer', 'created_by').prefetch_related('items')
        
        # Filter by status
        order_status = request.query_params.get('status')
        if order_status:
            queryset = queryset.filter(status=order_status)
        
        # Filter by payment_status
        payment_status = request.query_params.get('payment_status')
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        
        # Filter by customer
        customer_id = request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        # Filter by date range
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(order_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(order_date__lte=date_to)
        
        # Search by order number or customer name
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(order_number__icontains=search) |
                Q(customer__first_name__icontains=search) |
                Q(customer__last_name__icontains=search) |
                Q(customer__email__icontains=search)
            )
        
        # Sort
        sort_by = request.query_params.get('sort_by', '-order_date')
        valid_sorts = [
            'order_date', '-order_date',
            'total_amount', '-total_amount',
            'status', '-status',
            'created_at', '-created_at'
        ]
        
        if sort_by in valid_sorts:
            queryset = queryset.order_by(sort_by)
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = queryset.count()
        orders = queryset[start:end]
        
        serializer = OrderListSerializer(orders, many=True)
        
        return Response({
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
            'results': serializer.data
        })
    
    def post(self, request):
        """Create new order"""
        serializer = CreateOrderSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            order = serializer.save()
            detail_serializer = OrderDetailSerializer(order)
            return Response(
                {
                    'message': 'Order created successfully',
                    'order': detail_serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(APIView):
    """
    GET: Get order details
    PUT: Update order
    DELETE: Cancel order
    """
    permission_classes = [IsAuthenticated, IsCompanyUser, CanManageCustomers]
    
    def get_object(self, order_id):
        """Get order"""
        company = get_user_company(self.request.user)
        return get_object_or_404(
            Order.objects.prefetch_related('items'),
            id=order_id,
            company=company
        )
    
    def get(self, request, order_id):
        """Get order details"""
        order = self.get_object(order_id)
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)
    
    def put(self, request, order_id):
        """Update order"""
        order = self.get_object(order_id)
        serializer = UpdateOrderSerializer(
            order,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            detail_serializer = OrderDetailSerializer(order)
            return Response({
                'message': 'Order updated successfully',
                'order': detail_serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, order_id):
        """Cancel order"""
        order = self.get_object(order_id)
        
        # Don't allow cancellation of delivered orders
        if order.status == 'delivered':
            return Response(
                {'detail': 'Cannot cancel delivered order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'cancelled'
        order.save()
        
        return Response({
            'message': 'Order cancelled successfully',
            'order': OrderDetailSerializer(order).data
        })


class UpdateOrderStatusView(APIView):
    """
    POST: Update order status
    """
    permission_classes = [IsAuthenticated, IsCompanyUser, CanManageCustomers]
    
    def post(self, request, order_id):
        """Update order status"""
        company = get_user_company(request.user)
        order = get_object_or_404(Order, id=order_id, company=company)
        
        serializer = UpdateOrderStatusSerializer(data=request.data)
        
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            notes = serializer.validated_data.get('notes', '')
            
            old_status = order.status
            order.status = new_status
            
            # Set delivery date if delivered
            if new_status == 'delivered' and not order.actual_delivery_date:
                order.actual_delivery_date = timezone.now()
            
            order.save()
            
            # Create interaction log
            CustomerInteraction.objects.create(
                company=company,
                customer=order.customer,
                user=request.user,
                interaction_type='purchase',
                subject=f'Order {order.order_number} status updated',
                description=f'Status changed from {old_status} to {new_status}. {notes}',
                sentiment='positive' if new_status == 'delivered' else 'neutral'
            )
            
            # TODO: Send notification to customer based on status
            
            return Response({
                'message': f'Order status updated to {new_status}',
                'order': OrderDetailSerializer(order).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddOrderItemView(APIView):
    """
    POST: Add item to order
    """
    permission_classes = [IsAuthenticated, IsCompanyUser, CanManageCustomers]
    
    def post(self, request, order_id):
        """Add item to order"""
        company = get_user_company(request.user)
        order = get_object_or_404(Order, id=order_id, company=company)
        
        # Don't allow adding items to completed orders
        if order.status in ['delivered', 'cancelled', 'refunded']:
            return Response(
                {'detail': f'Cannot add items to {order.status} order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = OrderItemSerializer(data=request.data)
        
        if serializer.is_valid():
            item = serializer.save(order=order)
            
            # Recalculate order total
            order.total_amount = order.items.aggregate(
                total=Sum('total_price')
            )['total'] or 0
            order.save()
            
            return Response({
                'message': 'Item added successfully',
                'item': OrderItemSerializer(item).data,
                'order_total': float(order.total_amount)
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RemoveOrderItemView(APIView):
    """
    DELETE: Remove item from order
    """
    permission_classes = [IsAuthenticated, IsCompanyUser, CanManageCustomers]
    
    def delete(self, request, order_id, item_id):
        """Remove item from order"""
        company = get_user_company(request.user)
        order = get_object_or_404(Order, id=order_id, company=company)
        
        # Don't allow removing items from completed orders
        if order.status in ['delivered', 'cancelled', 'refunded']:
            return Response(
                {'detail': f'Cannot remove items from {order.status} order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item = get_object_or_404(OrderItem, id=item_id, order=order)
        
        # Don't allow removing last item
        if order.items.count() <= 1:
            return Response(
                {'detail': 'Cannot remove last item from order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item.delete()
        
        # Recalculate order total
        order.total_amount = order.items.aggregate(
            total=Sum('total_price')
        )['total'] or 0
        order.save()
        
        return Response({
            'message': 'Item removed successfully',
            'order_total': float(order.total_amount)
        })


class CustomerOrdersView(APIView):
    """
    GET: Get all orders for a specific customer
    """
    permission_classes = [IsAuthenticated, IsCompanyUser, CanManageCustomers]
    
    def get(self, request, customer_id):
        """Get customer order history"""
        company = get_user_company(request.user)
        
        # Verify customer belongs to company
        customer_company = get_object_or_404(
            CustomerCompany,
            id=customer_id,
            company=company
        )
        
        # Get orders
        orders = Order.objects.filter(
            company=company,
            customer=customer_company.customer
        ).order_by('-order_date')
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = orders.count()
        orders_page = orders[start:end]
        
        # Calculate stats
        total_spent = orders.filter(payment_status='paid').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        average_order = orders.filter(payment_status='paid').aggregate(
            avg=Avg('total_amount')
        )['avg'] or 0
        
        serializer = OrderListSerializer(orders_page, many=True)
        
        return Response({
            'customer': {
                'id': customer_company.id,
                'name': customer_company.customer.get_full_name(),
                'email': customer_company.customer.email
            },
            'stats': {
                'total_orders': total_count,
                'total_spent': float(total_spent),
                'average_order_value': float(average_order)
            },
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
            'results': serializer.data
        })


class OrderStatsView(APIView):
    """
    GET: Get order statistics for the company
    """
    permission_classes = [IsAuthenticated, IsCompanyUser]
    
    def get(self, request):
        """Get order statistics"""
        company = get_user_company(request.user)
        
        # Total orders
        total_orders = Order.objects.filter(company=company).count()
        
        # Total revenue (paid orders only)
        total_revenue = Order.objects.filter(
            company=company,
            payment_status='paid'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Orders by status
        orders_by_status = {}
        for status_choice in Order.STATUS_CHOICES:
            status_key = status_choice[0]
            count = Order.objects.filter(company=company, status=status_key).count()
            orders_by_status[status_key] = count
        
        # Average order value
        avg_order_value = Order.objects.filter(
            company=company,
            payment_status='paid'
        ).aggregate(avg=Avg('total_amount'))['avg'] or 0
        
        # Orders trend (last 12 months)
        from django.db.models.functions import TruncMonth
        twelve_months_ago = timezone.now() - timedelta(days=365)
        
        orders_trend = Order.objects.filter(
            company=company,
            order_date__gte=twelve_months_ago
        ).annotate(
            month=TruncMonth('order_date')
        ).values('month').annotate(
            count=Count('id'),
            revenue=Sum('total_amount')
        ).order_by('month')
        
        # Top customers by orders
        top_customers = Order.objects.filter(
            company=company
        ).values(
            'customer__id',
            'customer__first_name',
            'customer__last_name',
            'customer__email'
        ).annotate(
            order_count=Count('id'),
            total_spent=Sum('total_amount', filter=Q(payment_status='paid'))
        ).order_by('-order_count')[:10]
        
        # Pending deliveries
        pending_deliveries = Order.objects.filter(
            company=company,
            status__in=['pending', 'processing', 'shipped']
        ).order_by('expected_delivery_date')[:10]
        
        return Response({
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'orders_by_status': orders_by_status,
            'average_order_value': float(avg_order_value),
            'orders_trend': list(orders_trend),
            'top_customers': [
                {
                    'customer_id': c['customer__id'],
                    'name': f"{c['customer__first_name']} {c['customer__last_name']}",
                    'email': c['customer__email'],
                    'order_count': c['order_count'],
                    'total_spent': float(c['total_spent'] or 0)
                }
                for c in top_customers
            ],
            'pending_deliveries': OrderListSerializer(pending_deliveries, many=True).data
        })


# ============================================================================
# CUSTOMER INTERACTION VIEWS - PHASE 5.4
# ============================================================================

class InteractionListCreateView(APIView):
    """List and create customer interactions"""
    permission_classes = [IsAuthenticated, IsCompanyUser, CanManageCustomers]
    
    def get(self, request):
        """List interactions with filtering"""
        company = get_user_company(request.user)
        
        # Get base queryset
        interactions = CustomerInteraction.objects.filter(
            company=company
        ).select_related('customer__user', 'user')
        
        # Apply filters
        customer_id = request.query_params.get('customer')
        if customer_id:
            interactions = interactions.filter(customer_id=customer_id)
        
        user_id = request.query_params.get('user')
        if user_id:
            interactions = interactions.filter(user_id=user_id)
        
        interaction_type = request.query_params.get('interaction_type')
        if interaction_type:
            interactions = interactions.filter(interaction_type=interaction_type)
        
        sentiment = request.query_params.get('sentiment')
        if sentiment:
            interactions = interactions.filter(sentiment=sentiment)
        
        # Date range filter
        date_from = request.query_params.get('date_from')
        if date_from:
            interactions = interactions.filter(created_at__gte=date_from)
        
        date_to = request.query_params.get('date_to')
        if date_to:
            interactions = interactions.filter(created_at__lte=date_to)
        
        # Sorting
        sort_by = request.query_params.get('sort_by', '-created_at')
        interactions = interactions.order_by(sort_by)
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        paginator = Paginator(interactions, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = CustomerInteractionSerializer(page_obj, many=True)
        
        return Response({
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages,
            'results': serializer.data
        })
    
    def post(self, request):
        """Create new interaction"""
        serializer = CreateInteractionSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            interaction = serializer.save()
            return Response({
                'message': 'Interaction logged successfully',
                'interaction': CustomerInteractionSerializer(interaction).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InteractionDetailView(APIView):
    """Retrieve, update, or delete a customer interaction"""
    permission_classes = [IsAuthenticated, IsCompanyUser, CanManageCustomers]
    
    def get_interaction(self, interaction_id, company):
        """Get interaction belonging to company"""
        try:
            return CustomerInteraction.objects.select_related(
                'customer__user', 'user'
            ).get(id=interaction_id, company=company)
        except CustomerInteraction.DoesNotExist:
            return None
    
    def get(self, request, interaction_id):
        """Get interaction details"""
        company = get_user_company(request.user)
        interaction = self.get_interaction(interaction_id, company)
        
        if not interaction:
            return Response({
                'detail': 'Interaction not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CustomerInteractionSerializer(interaction)
        return Response(serializer.data)
    
    def put(self, request, interaction_id):
        """Update interaction"""
        company = get_user_company(request.user)
        interaction = self.get_interaction(interaction_id, company)
        
        if not interaction:
            return Response({
                'detail': 'Interaction not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Update allowed fields
        allowed_fields = ['subject', 'description', 'sentiment', 'interaction_type']
        for field in allowed_fields:
            if field in request.data:
                setattr(interaction, field, request.data[field])
        
        interaction.save()
        
        return Response({
            'message': 'Interaction updated successfully',
            'interaction': CustomerInteractionSerializer(interaction).data
        })
    
    def delete(self, request, interaction_id):
        """Delete interaction"""
        company = get_user_company(request.user)
        interaction = self.get_interaction(interaction_id, company)
        
        if not interaction:
            return Response({
                'detail': 'Interaction not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        interaction.delete()
        
        return Response({
            'message': 'Interaction deleted successfully'
        }, status=status.HTTP_200_OK)


class CustomerInteractionsView(APIView):
    """Get all interactions for a specific customer (timeline)"""
    permission_classes = [IsAuthenticated, IsCompanyUser, CanManageCustomers]
    
    def get(self, request, customer_id):
        """Get customer interaction timeline"""
        company = get_user_company(request.user)
        
        # Verify customer belongs to company
        if not CustomerCompany.objects.filter(
            customer_id=customer_id,
            company=company
        ).exists():
            return Response({
                'detail': 'Customer not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        customer = Customer.objects.select_related('user').get(id=customer_id)
        
        # Get interactions
        interactions = CustomerInteraction.objects.filter(
            company=company,
            customer_id=customer_id
        ).select_related('user').order_by('-created_at')
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        paginator = Paginator(interactions, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = CustomerInteractionSerializer(page_obj, many=True)
        
        return Response({
            'customer': {
                'id': customer.id,
                'name': customer.user.get_full_name(),
                'email': customer.user.email
            },
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages,
            'results': serializer.data
        })


class InteractionStatsView(APIView):
    """Get interaction statistics"""
    permission_classes = [IsAuthenticated, IsCompanyUser]
    
    def get(self, request):
        """Get comprehensive interaction statistics"""
        company = get_user_company(request.user)
        
        # Total interactions
        total_interactions = CustomerInteraction.objects.filter(company=company).count()
        
        # Interactions by type
        interactions_by_type = {}
        for type_key, type_label in CustomerInteraction.INTERACTION_TYPE_CHOICES:
            count = CustomerInteraction.objects.filter(
                company=company,
                interaction_type=type_key
            ).count()
            interactions_by_type[type_key] = count
        
        # Interactions by sentiment
        interactions_by_sentiment = {}
        for sentiment_key, sentiment_label in CustomerInteraction.SENTIMENT_CHOICES:
            count = CustomerInteraction.objects.filter(
                company=company,
                sentiment=sentiment_key
            ).count()
            interactions_by_sentiment[sentiment_key] = count
        
        # Most active customers (by interaction count)
        most_active_customers = CustomerInteraction.objects.filter(
            company=company
        ).values(
            'customer__id',
            'customer__user__first_name',
            'customer__user__last_name',
            'customer__user__email'
        ).annotate(
            interaction_count=Count('id')
        ).order_by('-interaction_count')[:10]
        
        # Recent interactions (last 30 days) trend
        from django.db.models.functions import TruncDate
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        interactions_trend = CustomerInteraction.objects.filter(
            company=company,
            created_at__gte=thirty_days_ago
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        # Average interactions per customer
        customer_count = CustomerCompany.objects.filter(
            company=company,
            verified=True
        ).count()
        
        avg_interactions_per_customer = (
            total_interactions / customer_count
        ) if customer_count > 0 else 0
        
        return Response({
            'total_interactions': total_interactions,
            'interactions_by_type': interactions_by_type,
            'interactions_by_sentiment': interactions_by_sentiment,
            'average_interactions_per_customer': round(avg_interactions_per_customer, 2),
            'most_active_customers': [
                {
                    'customer_id': c['customer__id'],
                    'name': f"{c['customer__user__first_name']} {c['customer__user__last_name']}",
                    'email': c['customer__user__email'],
                    'interaction_count': c['interaction_count']
                }
                for c in most_active_customers
            ],
            'interactions_trend': list(interactions_trend)
        })


# ============================================================================
# CUSTOMER PORTAL VIEWS - PHASE 5.5
# ============================================================================

class IsCustomer(permissions.BasePermission):
    """Permission to check if user is a customer"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.account_type == 'customer'


class IsOrderOwner(permissions.BasePermission):
    """Permission to check if customer owns the order"""
    
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Check if user is the order's customer
        try:
            customer = Customer.objects.get(user=request.user)
            return obj.customer == customer
        except Customer.DoesNotExist:
            return False


class CustomerDashboardView(APIView):
    """Customer dashboard data"""
    permission_classes = [IsAuthenticated, IsCustomer]
    
    def get(self, request):
        """Get customer dashboard summary"""
        try:
            customer = Customer.objects.get(user=request.user)
        except Customer.DoesNotExist:
            return Response({
                'detail': 'Customer profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get linked companies
        linked_companies = CustomerCompany.objects.filter(
            customer=customer
        ).select_related('company', 'account_manager')
        
        # Total orders across all companies
        total_orders = Order.objects.filter(customer=customer).count()
        
        # Recent orders (last 5)
        recent_orders = Order.objects.filter(
            customer=customer
        ).select_related('company').order_by('-order_date')[:5]
        
        # Active complaints count (placeholder - will be implemented in Phase 9)
        active_complaints_count = 0
        
        # Pending verifications
        pending_verifications_count = CustomerCompany.objects.filter(
            customer=customer,
            verified=False
        ).count()
        
        dashboard_data = {
            'linked_companies': CustomerCompanyDetailSerializer(
                linked_companies, many=True
            ).data,
            'total_orders': total_orders,
            'recent_orders': CustomerOrderListSerializer(
                recent_orders, many=True
            ).data,
            'active_complaints_count': active_complaints_count,
            'pending_verifications_count': pending_verifications_count
        }
        
        return Response(dashboard_data)


class CustomerMyOrdersView(APIView):
    """List customer's own orders"""
    permission_classes = [IsAuthenticated, IsCustomer]
    
    def get(self, request):
        """Get customer's orders with filtering"""
        try:
            customer = Customer.objects.get(user=request.user)
        except Customer.DoesNotExist:
            return Response({
                'detail': 'Customer profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get base queryset
        orders = Order.objects.filter(
            customer=customer
        ).select_related('company')
        
        # Apply filters
        company_id = request.query_params.get('company')
        if company_id:
            orders = orders.filter(company_id=company_id)
        
        order_status = request.query_params.get('status')
        if order_status:
            orders = orders.filter(status=order_status)
        
        # Date range filter
        date_from = request.query_params.get('date_from')
        if date_from:
            orders = orders.filter(order_date__gte=date_from)
        
        date_to = request.query_params.get('date_to')
        if date_to:
            orders = orders.filter(order_date__lte=date_to)
        
        # Sorting
        sort_by = request.query_params.get('sort_by', '-order_date')
        orders = orders.order_by(sort_by)
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        paginator = Paginator(orders, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = CustomerOrderListSerializer(page_obj, many=True)
        
        return Response({
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages,
            'results': serializer.data
        })


class CustomerOrderDetailView(APIView):
    """Customer views their order details"""
    permission_classes = [IsAuthenticated, IsCustomer, IsOrderOwner]
    
    def get(self, request, order_id):
        """Get order details"""
        try:
            customer = Customer.objects.get(user=request.user)
        except Customer.DoesNotExist:
            return Response({
                'detail': 'Customer profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            order = Order.objects.select_related('company').prefetch_related(
                'items'
            ).get(id=order_id, customer=customer)
        except Order.DoesNotExist:
            return Response({
                'detail': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check permission
        self.check_object_permissions(request, order)
        
        serializer = CustomerOrderDetailSerializer(order)
        return Response(serializer.data)


class CustomerMyCompaniesView(APIView):
    """List all companies customer is linked to"""
    permission_classes = [IsAuthenticated, IsCustomer]
    
    def get(self, request):
        """Get customer's linked companies"""
        try:
            customer = Customer.objects.get(user=request.user)
        except Customer.DoesNotExist:
            return Response({
                'detail': 'Customer profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        companies = CustomerCompany.objects.filter(
            customer=customer
        ).select_related('company', 'account_manager').order_by('-created_at')
        
        serializer = CustomerCompanyDetailSerializer(companies, many=True)
        
        return Response({
            'count': companies.count(),
            'results': serializer.data
        })


class CustomerRequestVerificationView(APIView):
    """Customer requests verification from company"""
    permission_classes = [IsAuthenticated, IsCustomer]
    
    def post(self, request, company_id):
        """Request verification from company"""
        try:
            customer = Customer.objects.get(user=request.user)
        except Customer.DoesNotExist:
            return Response({
                'detail': 'Customer profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            return Response({
                'detail': 'Company not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if relationship already exists
        customer_company, created = CustomerCompany.objects.get_or_create(
            customer=customer,
            company=company,
            defaults={
                'verified': False,
                'customer_status': 'active'
            }
        )
        
        if not created and customer_company.verified:
            return Response({
                'message': 'You are already verified with this company'
            }, status=status.HTTP_200_OK)
        
        if not created:
            return Response({
                'message': 'Verification request already pending'
            }, status=status.HTTP_200_OK)
        
        # TODO: Send notification to company admin (will be implemented in Phase 8)
        
        return Response({
            'message': 'Verification request sent successfully',
            'company': {
                'id': company.id,
                'name': company.company_name
            }
        }, status=status.HTTP_201_CREATED)


class CustomerOrderTrackingView(APIView):
    """Track order status and shipping updates"""
    permission_classes = [IsAuthenticated, IsCustomer, IsOrderOwner]
    
    def get(self, request, order_id):
        """Get order tracking information"""
        try:
            customer = Customer.objects.get(user=request.user)
        except Customer.DoesNotExist:
            return Response({
                'detail': 'Customer profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            order = Order.objects.select_related('company').get(
                id=order_id,
                customer=customer
            )
        except Order.DoesNotExist:
            return Response({
                'detail': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check permission
        self.check_object_permissions(request, order)
        
        # Calculate delivery status
        from datetime import date
        today = date.today()
        
        days_until_delivery = None
        if order.expected_delivery_date:
            days_until_delivery = (order.expected_delivery_date - today).days
        
        tracking_info = {
            'order_number': order.order_number,
            'status': order.status,
            'payment_status': order.payment_status,
            'order_date': order.order_date,
            'expected_delivery_date': order.expected_delivery_date,
            'actual_delivery_date': order.actual_delivery_date,
            'tracking_number': order.tracking_number,
            'days_until_delivery': days_until_delivery,
            'shipping_address': order.shipping_address,
            'company': {
                'name': order.company.company_name,
                'phone': order.company.phone
            },
            'timeline': [
                {
                    'status': 'pending',
                    'label': 'Order Placed',
                    'completed': order.status in ['processing', 'shipped', 'delivered'],
                    'date': order.order_date
                },
                {
                    'status': 'processing',
                    'label': 'Processing',
                    'completed': order.status in ['shipped', 'delivered'],
                    'date': None
                },
                {
                    'status': 'shipped',
                    'label': 'Shipped',
                    'completed': order.status == 'delivered',
                    'date': None
                },
                {
                    'status': 'delivered',
                    'label': 'Delivered',
                    'completed': order.status == 'delivered',
                    'date': order.actual_delivery_date
                }
            ]
        }
        
        return Response(tracking_info)
