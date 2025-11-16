"""
Webhook handlers for Twilio callbacks
"""
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from twilio.request_validator import RequestValidator
from django.conf import settings
from apps.calls.models import Call, CallRecording, VoicemailMessage, PhoneNumber
from apps.authentication.models import Company, User
from apps.calls.services.twilio_service import generate_twiml_response, get_recording
import logging
import json

logger = logging.getLogger(__name__)


def verify_twilio_signature(request):
    """Verify Twilio request signature"""
    validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
    signature = request.META.get('HTTP_X_TWILIO_SIGNATURE', '')
    url = request.build_absolute_uri()
    
    # Get POST data
    if hasattr(request, 'POST'):
        post_data = dict(request.POST)
    else:
        post_data = {}
    
    return validator.validate(url, post_data, signature)


@csrf_exempt
@require_http_methods(["POST"])
def handle_incoming_call(request):
    """
    Receive webhook from Twilio for incoming call
    Identify which company number was called
    Create Call record
    Generate TwiML to connect to user or send to voicemail
    """
    try:
        # Verify Twilio signature
        if not verify_twilio_signature(request):
            logger.warning("Invalid Twilio signature")
            return HttpResponse("Invalid signature", status=403)
        
        # Get call details from Twilio
        from_number = request.POST.get('From', '')
        to_number = request.POST.get('To', '')
        call_sid = request.POST.get('CallSid', '')
        
        # Find which company's number was called
        try:
            phone_number = PhoneNumber.objects.get(phone_number=to_number, is_active=True)
            company = phone_number.company
        except PhoneNumber.DoesNotExist:
            logger.error(f"Phone number not found: {to_number}")
            # Return hangup TwiML
            return HttpResponse(generate_twiml_response('hangup'), content_type='text/xml')
        
        # Create Call record
        call = Call.objects.create(
            company=company,
            phone_number=phone_number,
            direction='Inbound',
            from_number=from_number,
            to_number=to_number,
            status='Ringing',
            twilio_call_sid=call_sid,
            start_time=timezone.now(),
        )
        
        # Find available user or send to voicemail
        # For now, send to voicemail (can be enhanced to find available users)
        # TODO: Implement user availability logic
        
        # Generate TwiML for voicemail
        twiml = generate_twiml_response(
            'record_voicemail',
            max_length=120,
            transcribe=True
        )
        
        return HttpResponse(twiml, content_type='text/xml')
    
    except Exception as e:
        logger.error(f"Error handling incoming call: {str(e)}")
        return HttpResponse(generate_twiml_response('hangup'), content_type='text/xml')


@csrf_exempt
@require_http_methods(["POST"])
def handle_call_status(request):
    """
    Receive status updates from Twilio
    Update Call record (status, duration, etc.)
    Create activity log
    """
    try:
        # Verify Twilio signature
        if not verify_twilio_signature(request):
            logger.warning("Invalid Twilio signature")
            return JsonResponse({"error": "Invalid signature"}, status=403)
        
        call_sid = request.POST.get('CallSid', '')
        call_status = request.POST.get('CallStatus', '')
        call_duration = request.POST.get('CallDuration', '')
        call_price = request.POST.get('CallPrice', '')
        
        try:
            call = Call.objects.get(twilio_call_sid=call_sid)
        except Call.DoesNotExist:
            logger.error(f"Call not found: {call_sid}")
            return JsonResponse({"error": "Call not found"}, status=404)
        
        # Map Twilio status to our status
        status_mapping = {
            'queued': 'Initiated',
            'ringing': 'Ringing',
            'in-progress': 'InProgress',
            'completed': 'Completed',
            'busy': 'Busy',
            'failed': 'Failed',
            'no-answer': 'NoAnswer',
            'canceled': 'Cancelled',
        }
        
        call.status = status_mapping.get(call_status, call.status)
        
        if call_duration:
            call.duration = int(call_duration)
        
        if call_price:
            call.price = float(call_price)
        
        # Update timestamps
        if call_status == 'in-progress' and not call.start_time:
            call.start_time = timezone.now()
        elif call_status == 'completed':
            call.end_time = timezone.now()
        
        call.save()
        
        # TODO: Create activity log
        
        return JsonResponse({"status": "updated"})
    
    except Exception as e:
        logger.error(f"Error handling call status: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def handle_call_recording(request):
    """
    Receive recording ready callback
    Save CallRecording record
    Update Call with recording_url
    """
    try:
        # Verify Twilio signature
        if not verify_twilio_signature(request):
            logger.warning("Invalid Twilio signature")
            return JsonResponse({"error": "Invalid signature"}, status=403)
        
        call_sid = request.POST.get('CallSid', '')
        recording_sid = request.POST.get('RecordingSid', '')
        recording_url = request.POST.get('RecordingUrl', '')
        recording_duration = request.POST.get('RecordingDuration', '')
        recording_status = request.POST.get('RecordingStatus', '')
        
        if recording_status != 'completed':
            return JsonResponse({"status": "recording not ready"})
        
        try:
            call = Call.objects.get(twilio_call_sid=call_sid)
        except Call.DoesNotExist:
            logger.error(f"Call not found: {call_sid}")
            return JsonResponse({"error": "Call not found"}, status=404)
        
        # Get full recording details from Twilio
        try:
            recording_details = get_recording(recording_sid)
        except Exception as e:
            logger.error(f"Error getting recording details: {str(e)}")
            recording_details = {
                'recording_url': recording_url,
                'duration': int(recording_duration) if recording_duration else 0,
            }
        
        # Create CallRecording record
        call_recording = CallRecording.objects.create(
            call=call,
            recording_url=recording_details['recording_url'],
            recording_sid=recording_sid,
            duration=recording_details.get('duration', 0),
            file_size=recording_details.get('file_size'),
        )
        
        # Update Call with recording URL
        call.recording_url = recording_details['recording_url']
        call.recording_duration = recording_details.get('duration')
        call.save()
        
        return JsonResponse({"status": "recording saved"})
    
    except Exception as e:
        logger.error(f"Error handling call recording: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def handle_voicemail(request):
    """
    Receive voicemail recording
    Create VoicemailMessage record
    Notify user
    """
    try:
        # Verify Twilio signature
        if not verify_twilio_signature(request):
            logger.warning("Invalid Twilio signature")
            return JsonResponse({"error": "Invalid signature"}, status=403)
        
        call_sid = request.POST.get('CallSid', '')
        from_number = request.POST.get('From', '')
        to_number = request.POST.get('To', '')
        recording_sid = request.POST.get('RecordingSid', '')
        recording_url = request.POST.get('RecordingUrl', '')
        recording_duration = request.POST.get('RecordingDuration', '')
        transcription_text = request.POST.get('TranscriptionText', '')
        
        # Find phone number
        try:
            phone_number = PhoneNumber.objects.get(phone_number=to_number, is_active=True)
            company = phone_number.company
        except PhoneNumber.DoesNotExist:
            logger.error(f"Phone number not found: {to_number}")
            return JsonResponse({"error": "Phone number not found"}, status=404)
        
        # Get full recording details
        try:
            recording_details = get_recording(recording_sid)
        except Exception as e:
            logger.error(f"Error getting recording details: {str(e)}")
            recording_details = {
                'recording_url': recording_url,
                'duration': int(recording_duration) if recording_duration else 0,
            }
        
        # Create VoicemailMessage record
        voicemail = VoicemailMessage.objects.create(
            company=company,
            phone_number=phone_number,
            from_number=from_number,
            duration=recording_details.get('duration', 0),
            recording_url=recording_details['recording_url'],
            transcription=transcription_text if transcription_text else None,
        )
        
        # TODO: Notify user (send notification/email)
        
        return JsonResponse({"status": "voicemail saved", "id": voicemail.id})
    
    except Exception as e:
        logger.error(f"Error handling voicemail: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)

