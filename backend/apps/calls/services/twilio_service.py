"""
Twilio service for handling phone calls, recordings, and TwiML generation
"""
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Dial, Gather, Record, Say, Play
from django.conf import settings
from django.utils import timezone
from apps.calls.models import PhoneNumber, Call, CallRecording
from apps.authentication.models import Company, User
import logging

logger = logging.getLogger(__name__)

# Initialize Twilio client
_twilio_client = None


def initialize_twilio_client():
    """Create and return Twilio client"""
    global _twilio_client
    if _twilio_client is None:
        account_sid = settings.TWILIO_ACCOUNT_SID
        auth_token = settings.TWILIO_AUTH_TOKEN
        if not account_sid or not auth_token:
            raise ValueError("Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in settings.")
        _twilio_client = Client(account_sid, auth_token)
    return _twilio_client


def purchase_phone_number(area_code, country='US', company_id=None, user_id=None):
    """
    Search available numbers and purchase one from Twilio
    
    Args:
        area_code: Area code to search for
        country: Country code (default: 'US')
        company_id: Company ID to associate with
        user_id: User ID to associate with
    
    Returns:
        dict: Phone number details
    """
    client = initialize_twilio_client()
    
    try:
        # Search for available numbers
        available_numbers = client.available_phone_numbers(country).local.list(
            area_code=area_code,
            voice_enabled=True,
            sms_enabled=True
        )
        
        if not available_numbers:
            raise ValueError(f"No available numbers found for area code {area_code}")
        
        # Purchase the first available number
        phone_number_obj = available_numbers[0]
        purchased_number = client.incoming_phone_numbers.create(
            phone_number=phone_number_obj.phone_number,
            voice_url=f"{settings.CALL_WEBHOOK_URL}",
            voice_method='POST',
            status_callback=f"{settings.STATUS_CALLBACK_URL}",
            status_callback_method='POST',
            sms_url=f"{settings.CALL_WEBHOOK_URL}",
            sms_method='POST'
        )
        
        # Extract country code from phone number
        country_code = phone_number_obj.phone_number[:2] if phone_number_obj.phone_number.startswith('+') else 'US'
        
        # Determine number type
        number_type = 'Mobile' if 'mobile' in phone_number_obj.capabilities else 'Landline'
        
        # Create PhoneNumber record
        company = Company.objects.get(id=company_id) if company_id else None
        user = User.objects.get(id=user_id) if user_id else None
        
        phone_number = PhoneNumber.objects.create(
            company=company,
            user=user,
            phone_number=purchased_number.phone_number,
            country_code=country_code,
            number_type=number_type,
            provider='Twilio',
            twilio_phone_sid=purchased_number.sid,
            is_active=True,
            capabilities={
                'voice': purchased_number.capabilities.get('voice', False),
                'sms': purchased_number.capabilities.get('sms', False),
                'mms': purchased_number.capabilities.get('mms', False),
            },
            monthly_cost=1.00,  # Default monthly cost, should be fetched from Twilio
        )
        
        return {
            'id': phone_number.id,
            'phone_number': phone_number.phone_number,
            'twilio_phone_sid': phone_number.twilio_phone_sid,
            'capabilities': phone_number.capabilities,
            'country_code': phone_number.country_code,
            'number_type': phone_number.number_type,
        }
    except Exception as e:
        logger.error(f"Error purchasing phone number: {str(e)}")
        raise


def make_call(from_number, to_number, user_id, company_id, lead_id=None, deal_id=None, customer_id=None, record=True):
    """
    Initiate outbound call via Twilio
    
    Args:
        from_number: PhoneNumber instance or phone number string
        to_number: Destination phone number
        user_id: User making the call
        company_id: Company ID
        lead_id: Optional lead ID
        deal_id: Optional deal ID
        customer_id: Optional customer ID
        record: Whether to record the call
    
    Returns:
        dict: Call details with SID
    """
    client = initialize_twilio_client()
    
    try:
        # Get phone number object
        if isinstance(from_number, str):
            phone_number_obj = PhoneNumber.objects.get(phone_number=from_number, company_id=company_id)
        else:
            phone_number_obj = from_number
        
        # Get user
        user = User.objects.get(id=user_id)
        company = Company.objects.get(id=company_id)
        
        # Make the call
        call = client.calls.create(
            to=to_number,
            from_=phone_number_obj.phone_number,
            url=f"{settings.CALL_WEBHOOK_URL}",
            method='POST',
            status_callback=f"{settings.STATUS_CALLBACK_URL}",
            status_callback_event=['initiated', 'ringing', 'answered', 'completed'],
            status_callback_method='POST',
            record=record,
            recording_status_callback=f"{settings.RECORDING_CALLBACK_URL}",
            recording_status_callback_method='POST',
        )
        
        # Create Call record
        call_record = Call.objects.create(
            company=company,
            phone_number=phone_number_obj,
            user=user,
            lead_id=lead_id,
            deal_id=deal_id,
            customer_id=customer_id,
            direction='Outbound',
            from_number=phone_number_obj.phone_number,
            to_number=to_number,
            status='Initiated',
            twilio_call_sid=call.sid,
            start_time=timezone.now(),
        )
        
        return {
            'id': call_record.id,
            'twilio_call_sid': call.sid,
            'status': call_record.status,
            'from_number': call_record.from_number,
            'to_number': call_record.to_number,
        }
    except Exception as e:
        logger.error(f"Error making call: {str(e)}")
        raise


def get_call_status(call_sid):
    """
    Fetch call status from Twilio and update Call record
    
    Args:
        call_sid: Twilio call SID
    
    Returns:
        dict: Updated call status
    """
    client = initialize_twilio_client()
    
    try:
        # Fetch call from Twilio
        twilio_call = client.calls(call_sid).fetch()
        
        # Update Call record
        call_record = Call.objects.get(twilio_call_sid=call_sid)
        
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
        
        call_record.status = status_mapping.get(twilio_call.status, call_record.status)
        call_record.duration = int(twilio_call.duration) if twilio_call.duration else None
        call_record.price = float(twilio_call.price) if twilio_call.price else None
        
        if twilio_call.start_time:
            call_record.start_time = twilio_call.start_time
        if twilio_call.end_time:
            call_record.end_time = twilio_call.end_time
        
        call_record.save()
        
        return {
            'id': call_record.id,
            'status': call_record.status,
            'duration': call_record.duration,
            'price': str(call_record.price) if call_record.price else None,
        }
    except Call.DoesNotExist:
        logger.error(f"Call record not found for SID: {call_sid}")
        raise
    except Exception as e:
        logger.error(f"Error getting call status: {str(e)}")
        raise


def get_recording(recording_sid):
    """
    Fetch recording URL from Twilio
    
    Args:
        recording_sid: Twilio recording SID
    
    Returns:
        dict: Recording details
    """
    client = initialize_twilio_client()
    
    try:
        recording = client.recordings(recording_sid).fetch()
        
        return {
            'recording_sid': recording.sid,
            'recording_url': f"https://api.twilio.com{recording.uri.replace('.json', '.mp3')}",
            'duration': int(recording.duration),
            'file_size': int(recording.size) if recording.size else None,
        }
    except Exception as e:
        logger.error(f"Error getting recording: {str(e)}")
        raise


def generate_twiml_response(action, **kwargs):
    """
    Generate TwiML for different actions
    
    Args:
        action: Action type ('connect', 'forward', 'voicemail_greeting', 'record_voicemail')
        **kwargs: Additional parameters based on action
    
    Returns:
        str: TwiML XML string
    """
    response = VoiceResponse()
    
    if action == 'connect':
        # Connect to user's browser/mobile via WebRTC
        dial = Dial()
        if 'client_identity' in kwargs:
            dial.client(kwargs['client_identity'])
        elif 'phone_number' in kwargs:
            dial.number(kwargs['phone_number'])
        else:
            dial.number(kwargs.get('to_number'))
        response.append(dial)
    
    elif action == 'forward':
        # Forward to phone number
        dial = Dial()
        dial.number(kwargs['phone_number'])
        response.append(dial)
    
    elif action == 'voicemail_greeting':
        # Play voicemail greeting
        if 'greeting_text' in kwargs:
            response.say(kwargs['greeting_text'], voice='alice')
        elif 'greeting_url' in kwargs:
            response.play(kwargs['greeting_url'])
        else:
            response.say('Please leave a message after the tone.', voice='alice')
    
    elif action == 'record_voicemail':
        # Record voicemail
        response.say('Please leave a message after the tone.', voice='alice')
        response.record(
            max_length=kwargs.get('max_length', 60),
            finish_on_key='#',
            recording_status_callback=f"{settings.RECORDING_CALLBACK_URL}",
            recording_status_callback_method='POST',
            transcribe=kwargs.get('transcribe', False),
            transcribe_callback=f"{settings.RECORDING_CALLBACK_URL}",
        )
        response.say('Thank you for your message. Goodbye.', voice='alice')
        response.hangup()
    
    elif action == 'hangup':
        response.hangup()
    
    return str(response)


def get_available_numbers(area_code, country='US', limit=10):
    """
    Search Twilio for available phone numbers
    
    Args:
        area_code: Area code to search
        country: Country code (default: 'US')
        limit: Maximum number of results
    
    Returns:
        list: List of available phone numbers
    """
    client = initialize_twilio_client()
    
    try:
        available_numbers = client.available_phone_numbers(country).local.list(
            area_code=area_code,
            voice_enabled=True,
            sms_enabled=True,
            limit=limit
        )
        
        results = []
        for number in available_numbers:
            results.append({
                'phone_number': number.phone_number,
                'friendly_name': number.friendly_name,
                'locality': number.locality,
                'region': number.region,
                'postal_code': number.postal_code,
                'iso_country': number.iso_country,
                'capabilities': {
                    'voice': number.capabilities.get('voice', False),
                    'sms': number.capabilities.get('sms', False),
                    'mms': number.capabilities.get('mms', False),
                },
            })
        
        return results
    except Exception as e:
        logger.error(f"Error getting available numbers: {str(e)}")
        raise

