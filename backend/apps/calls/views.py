"""
Views for call system
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import timedelta

from .models import PhoneNumber, Call, CallRecording, CallNote, VoicemailMessage
from .serializers import (
    PhoneNumberSerializer, AvailableNumberSerializer, PurchaseNumberSerializer,
    CallListSerializer, CallDetailSerializer, MakeCallSerializer,
    CallNoteSerializer, UpdateCallSerializer, VoicemailMessageSerializer
)
from .permissions import IsCompanyUser, CanManagePhoneNumbers
from apps.authentication.models import CompanyUser, User
from apps.calls.services.twilio_service import (
    get_available_numbers, purchase_phone_number, make_call as twilio_make_call,
    get_call_status
)
from apps.calls.webhooks import (
    handle_incoming_call, handle_call_status, handle_call_recording, handle_voicemail
)


# Phone Number Management Views

class PhoneNumberListView(generics.ListAPIView):
    """List all phone numbers for company"""
    serializer_class = PhoneNumberSerializer
    permission_classes = [IsCompanyUser]
    
    def get_queryset(self):
        user = self.request.user
        company_id = self.request.query_params.get('company_id')
        
        if company_id and CompanyUser.objects.filter(user=user, company_id=company_id, is_active=True).exists():
            qs = PhoneNumber.objects.filter(company_id=company_id)
        else:
            memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
            qs = PhoneNumber.objects.filter(company_id__in=memberships)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        
        return qs.select_related('user', 'company').annotate(
            call_count=Count('calls')
        ).order_by('-created_at')


class SearchAvailableNumbersView(APIView):
    """Search Twilio for available phone numbers"""
    permission_classes = [IsCompanyUser, CanManagePhoneNumbers]
    
    def get(self, request):
        area_code = request.query_params.get('area_code')
        country = request.query_params.get('country', 'US')
        
        if not area_code:
            return Response(
                {"error": "area_code parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            available_numbers = get_available_numbers(area_code, country, limit=20)
            serializer = AvailableNumberSerializer(available_numbers, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PurchasePhoneNumberView(APIView):
    """Purchase phone number from Twilio"""
    permission_classes = [IsCompanyUser, CanManagePhoneNumbers]
    
    def post(self, request):
        serializer = PurchaseNumberSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        company_id = request.data.get('company_id')
        
        # Get company
        if company_id:
            try:
                company = CompanyUser.objects.get(user=user, company_id=company_id, is_active=True).company
            except CompanyUser.DoesNotExist:
                return Response(
                    {"error": "Company not found or access denied"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Get user's first company
            company_user = CompanyUser.objects.filter(user=user, is_active=True).first()
            if not company_user:
                return Response(
                    {"error": "No company found for user"},
                    status=status.HTTP_404_NOT_FOUND
                )
            company = company_user.company
        
        try:
            phone_number = purchase_phone_number(
                area_code=serializer.validated_data['area_code'],
                country=serializer.validated_data.get('country', 'US'),
                company_id=company.id,
                user_id=serializer.validated_data.get('user_id', user.id)
            )
            
            # Fetch the created phone number
            phone_number_obj = PhoneNumber.objects.get(id=phone_number['id'])
            serializer_response = PhoneNumberSerializer(phone_number_obj)
            
            return Response(serializer_response.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PhoneNumberDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete phone number"""
    serializer_class = PhoneNumberSerializer
    permission_classes = [IsCompanyUser]
    
    def get_queryset(self):
        user = self.request.user
        memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
        return PhoneNumber.objects.filter(company_id__in=memberships).select_related('user', 'company')
    
    def destroy(self, request, *args, **kwargs):
        """Release number from Twilio and deactivate"""
        phone_number = self.get_object()
        
        # Check permissions
        if not CanManagePhoneNumbers().has_permission(request, self):
            return Response(
                {"error": "Only CEO and Managers can delete phone numbers"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from apps.calls.services.twilio_service import initialize_twilio_client
            client = initialize_twilio_client()
            
            # Release number from Twilio
            client.incoming_phone_numbers(phone_number.twilio_phone_sid).delete()
            
            # Deactivate in database
            phone_number.is_active = False
            phone_number.save()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {"error": f"Error releasing number: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SetDefaultNumberView(APIView):
    """Set phone number as default for user"""
    permission_classes = [IsCompanyUser]
    
    def post(self, request, pk):
        try:
            phone_number = PhoneNumber.objects.get(pk=pk)
            
            # Verify user has access to this phone number
            user = request.user
            memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
            if phone_number.company_id not in memberships:
                return Response(
                    {"error": "Phone number not found or access denied"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Unset other default numbers for this user
            PhoneNumber.objects.filter(
                user=phone_number.user,
                company=phone_number.company,
                is_default=True
            ).update(is_default=False)
            
            # Set this as default
            phone_number.is_default = True
            phone_number.save()
            
            serializer = PhoneNumberSerializer(phone_number)
            return Response(serializer.data)
        except PhoneNumber.DoesNotExist:
            return Response(
                {"error": "Phone number not found"},
                status=status.HTTP_404_NOT_FOUND
            )


# Call Management Views

class CallListView(generics.ListAPIView):
    """List all calls for company with filters"""
    serializer_class = CallListSerializer
    permission_classes = [IsCompanyUser]
    
    def get_queryset(self):
        user = self.request.user
        company_id = self.request.query_params.get('company_id')
        
        if company_id and CompanyUser.objects.filter(user=user, company_id=company_id, is_active=True).exists():
            qs = Call.objects.filter(company_id=company_id)
        else:
            memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
            qs = Call.objects.filter(company_id__in=memberships)
        
        # Filters
        user_filter = self.request.query_params.get('user')
        if user_filter:
            qs = qs.filter(user_id=user_filter)
        
        direction = self.request.query_params.get('direction')
        if direction:
            qs = qs.filter(direction=direction)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        lead_id = self.request.query_params.get('lead_id')
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        
        deal_id = self.request.query_params.get('deal_id')
        if deal_id:
            qs = qs.filter(deal_id=deal_id)
        
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        
        # Date range filter
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            qs = qs.filter(created_at__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__lte=end_date)
        
        # Search by phone number
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(from_number__icontains=search) |
                Q(to_number__icontains=search)
            )
        
        # Sort
        sort_by = self.request.query_params.get('sort_by', '-created_at')
        if sort_by in ['start_time', '-start_time', 'duration', '-duration', 'created_at', '-created_at']:
            qs = qs.order_by(sort_by)
        else:
            qs = qs.order_by('-created_at')
        
        return qs.select_related('user', 'phone_number', 'lead', 'deal', 'customer', 'company')


class MakeCallView(APIView):
    """Initiate outbound call"""
    permission_classes = [IsCompanyUser]
    
    def post(self, request):
        serializer = MakeCallSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        company_id = request.data.get('company_id')
        
        # Get company
        if company_id:
            try:
                company = CompanyUser.objects.get(user=user, company_id=company_id, is_active=True).company
            except CompanyUser.DoesNotExist:
                return Response(
                    {"error": "Company not found or access denied"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            company_user = CompanyUser.objects.filter(user=user, is_active=True).first()
            if not company_user:
                return Response(
                    {"error": "No company found for user"},
                    status=status.HTTP_404_NOT_FOUND
                )
            company = company_user.company
        
        # Get phone number
        try:
            phone_number = PhoneNumber.objects.get(
                id=serializer.validated_data['from_number_id'],
                company=company,
                is_active=True
            )
        except PhoneNumber.DoesNotExist:
            return Response(
                {"error": "Phone number not found or access denied"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            call = twilio_make_call(
                from_number=phone_number,
                to_number=serializer.validated_data['to_number'],
                user_id=user.id,
                company_id=company.id,
                lead_id=serializer.validated_data.get('lead_id'),
                deal_id=serializer.validated_data.get('deal_id'),
                customer_id=serializer.validated_data.get('customer_id'),
                record=serializer.validated_data.get('record', True)
            )
            
            # Fetch the created call
            call_obj = Call.objects.get(id=call['id'])
            serializer_response = CallDetailSerializer(call_obj)
            
            return Response(serializer_response.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CallDetailView(generics.RetrieveUpdateAPIView):
    """Get or update call details"""
    serializer_class = CallDetailSerializer
    permission_classes = [IsCompanyUser]
    
    def get_queryset(self):
        user = self.request.user
        memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
        return Call.objects.filter(company_id__in=memberships).select_related(
            'user', 'phone_number', 'lead', 'deal', 'customer', 'company'
        ).prefetch_related('recordings', 'call_notes')
    
    def get_serializer_class(self):
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UpdateCallSerializer
        return CallDetailSerializer
    
    def update(self, request, *args, **kwargs):
        """Update call (disposition, notes)"""
        call = self.get_object()
        serializer = UpdateCallSerializer(call, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return full call details
            call_serializer = CallDetailSerializer(call)
            return Response(call_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EndCallView(APIView):
    """End active call"""
    permission_classes = [IsCompanyUser]
    
    def post(self, request, pk):
        try:
            call = Call.objects.get(pk=pk)
            
            # Verify access
            user = request.user
            memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
            if call.company_id not in memberships:
                return Response(
                    {"error": "Call not found or access denied"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Update call status
            call.status = 'Cancelled'
            call.end_time = timezone.now()
            call.save()
            
            # Try to end call via Twilio
            try:
                from apps.calls.services.twilio_service import initialize_twilio_client
                client = initialize_twilio_client()
                client.calls(call.twilio_call_sid).update(status='completed')
            except Exception as e:
                # Log error but don't fail the request
                pass
            
            serializer = CallDetailSerializer(call)
            return Response(serializer.data)
        except Call.DoesNotExist:
            return Response(
                {"error": "Call not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class CallRecordingView(APIView):
    """Get recording URL and stream audio"""
    permission_classes = [IsCompanyUser]
    
    def get(self, request, pk):
        try:
            call = Call.objects.get(pk=pk)
            
            # Verify access
            user = request.user
            memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
            if call.company_id not in memberships:
                return Response(
                    {"error": "Call not found or access denied"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if not call.recording_url:
                return Response(
                    {"error": "No recording available for this call"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                'recording_url': call.recording_url,
                'recording_duration': call.recording_duration,
                'recordings': [
                    {
                        'recording_url': rec.recording_url,
                        'duration': rec.duration,
                        'transcription': rec.transcription
                    }
                    for rec in call.recordings.all()
                ]
            })
        except Call.DoesNotExist:
            return Response(
                {"error": "Call not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class AddCallNoteView(APIView):
    """Add note to call"""
    permission_classes = [IsCompanyUser]
    
    def post(self, request, pk):
        try:
            call = Call.objects.get(pk=pk)
            
            # Verify access
            user = request.user
            memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
            if call.company_id not in memberships:
                return Response(
                    {"error": "Call not found or access denied"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            note_text = request.data.get('note')
            if not note_text:
                return Response(
                    {"error": "Note text is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            note = CallNote.objects.create(
                call=call,
                user=user,
                note=note_text
            )
            
            serializer = CallNoteSerializer(note)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Call.DoesNotExist:
            return Response(
                {"error": "Call not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class CallStatsView(APIView):
    """Call statistics"""
    permission_classes = [IsCompanyUser]
    
    def get(self, request):
        user = request.user
        company_id = request.query_params.get('company_id')
        
        # Get company
        if company_id:
            try:
                company = CompanyUser.objects.get(user=user, company_id=company_id, is_active=True).company
            except CompanyUser.DoesNotExist:
                return Response(
                    {"error": "Company not found or access denied"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            company_user = CompanyUser.objects.filter(user=user, is_active=True).first()
            if not company_user:
                return Response(
                    {"error": "No company found for user"},
                    status=status.HTTP_404_NOT_FOUND
                )
            company = company_user.company
        
        # Date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        qs = Call.objects.filter(company=company)
        if start_date:
            qs = qs.filter(created_at__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__lte=end_date)
        
        # Calculate stats
        total_calls = qs.count()
        calls_by_direction = qs.values('direction').annotate(count=Count('id'))
        calls_by_status = qs.values('status').annotate(count=Count('id'))
        calls_by_user = qs.values('user__first_name', 'user__last_name', 'user__email').annotate(
            count=Count('id')
        )
        
        completed_calls = qs.filter(status='Completed', duration__isnull=False)
        avg_duration = completed_calls.aggregate(avg=Avg('duration'))['avg'] or 0
        
        # Answer rate (completed / total initiated)
        initiated_calls = qs.filter(status__in=['Completed', 'NoAnswer', 'Busy', 'Failed'])
        answer_rate = 0
        if initiated_calls.count() > 0:
            answered = qs.filter(status='Completed').count()
            answer_rate = (answered / initiated_calls.count()) * 100
        
        # Call volume trend (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_calls = qs.filter(created_at__gte=thirty_days_ago)
        call_volume_trend = recent_calls.extra(
            select={'day': 'date(created_at)'}
        ).values('day').annotate(count=Count('id')).order_by('day')
        
        return Response({
            'total_calls': total_calls,
            'calls_by_direction': list(calls_by_direction),
            'calls_by_status': list(calls_by_status),
            'calls_by_user': list(calls_by_user),
            'average_duration': round(avg_duration, 2),
            'answer_rate': round(answer_rate, 2),
            'call_volume_trend': list(call_volume_trend)
        })


class VoicemailListView(generics.ListAPIView):
    """List voicemails"""
    serializer_class = VoicemailMessageSerializer
    permission_classes = [IsCompanyUser]
    
    def get_queryset(self):
        user = self.request.user
        company_id = self.request.query_params.get('company_id')
        
        if company_id and CompanyUser.objects.filter(user=user, company_id=company_id, is_active=True).exists():
            qs = VoicemailMessage.objects.filter(company_id=company_id)
        else:
            memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
            qs = VoicemailMessage.objects.filter(company_id__in=memberships)
        
        # Filter by listened status
        is_listened = self.request.query_params.get('is_listened')
        if is_listened is not None:
            qs = qs.filter(is_listened=is_listened.lower() == 'true')
        
        return qs.select_related('phone_number', 'listened_by').order_by('-created_at')


class VoicemailDetailView(generics.RetrieveUpdateAPIView):
    """Get voicemail details and mark as listened"""
    serializer_class = VoicemailMessageSerializer
    permission_classes = [IsCompanyUser]
    
    def get_queryset(self):
        user = self.request.user
        memberships = CompanyUser.objects.filter(user=user, is_active=True).values_list('company_id', flat=True)
        return VoicemailMessage.objects.filter(company_id__in=memberships).select_related(
            'phone_number', 'listened_by', 'company'
        )
    
    def update(self, request, *args, **kwargs):
        """Mark voicemail as listened"""
        voicemail = self.get_object()
        
        if request.data.get('is_listened'):
            voicemail.is_listened = True
            voicemail.listened_at = timezone.now()
            voicemail.listened_by = request.user
            voicemail.save()
        
        serializer = self.get_serializer(voicemail)
        return Response(serializer.data)


# Webhook Views (no authentication required, but signature verified)

@api_view(['POST'])
@permission_classes([AllowAny])
def TwilioIncomingCallWebhook(request):
    """Handle incoming call webhook from Twilio"""
    return handle_incoming_call(request)


@api_view(['POST'])
@permission_classes([AllowAny])
def TwilioStatusCallbackWebhook(request):
    """Handle status callback webhook from Twilio"""
    return handle_call_status(request)


@api_view(['POST'])
@permission_classes([AllowAny])
def TwilioRecordingWebhook(request):
    """Handle recording webhook from Twilio"""
    return handle_call_recording(request)

