"""
Serializers for call system
"""
from rest_framework import serializers
from django.db.models import Count
from .models import PhoneNumber, Call, CallRecording, CallNote, VoicemailMessage
from apps.authentication.models import User, Company


class UserMiniSerializer(serializers.ModelSerializer):
    """Minimal user serializer"""
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email']


class PhoneNumberSerializer(serializers.ModelSerializer):
    """Phone number serializer with call count"""
    user = UserMiniSerializer(read_only=True)
    call_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PhoneNumber
        fields = [
            'id', 'company', 'user', 'phone_number', 'country_code', 'number_type',
            'provider', 'twilio_phone_sid', 'is_active', 'is_default', 'capabilities',
            'monthly_cost', 'purchased_at', 'created_at', 'call_count'
        ]
        read_only_fields = ['company', 'twilio_phone_sid', 'purchased_at', 'created_at']
    
    def get_call_count(self, obj):
        """Get total calls for this phone number"""
        return obj.calls.count()


class AvailableNumberSerializer(serializers.Serializer):
    """Serializer for available phone numbers from Twilio"""
    phone_number = serializers.CharField()
    friendly_name = serializers.CharField()
    locality = serializers.CharField()
    region = serializers.CharField()
    postal_code = serializers.CharField()
    iso_country = serializers.CharField()
    capabilities = serializers.DictField()


class PurchaseNumberSerializer(serializers.Serializer):
    """Serializer for purchasing a phone number"""
    area_code = serializers.CharField(max_length=3, required=True)
    country = serializers.CharField(max_length=2, default='US')
    phone_number = serializers.CharField(required=False, help_text='Specific number to purchase (optional)')
    user_id = serializers.IntegerField(required=False, allow_null=True)


class CallListSerializer(serializers.ModelSerializer):
    """Call list serializer with basic info"""
    user = UserMiniSerializer(read_only=True)
    phone_number = serializers.StringRelatedField(read_only=True)
    lead = serializers.SerializerMethodField()
    deal = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    
    class Meta:
        model = Call
        fields = [
            'id', 'phone_number', 'user', 'lead', 'deal', 'customer',
            'direction', 'from_number', 'to_number', 'status', 'duration',
            'start_time', 'end_time', 'recording_url', 'disposition', 'created_at'
        ]
        read_only_fields = fields
    
    def get_lead(self, obj):
        if obj.lead:
            return {'id': obj.lead.id, 'name': f"{obj.lead.first_name} {obj.lead.last_name}"}
        return None
    
    def get_deal(self, obj):
        if obj.deal:
            return {'id': obj.deal.id, 'title': obj.deal.title}
        return None
    
    def get_customer(self, obj):
        if obj.customer:
            return {'id': obj.customer.id, 'email': obj.customer.user.email}
        return None


class CallDetailSerializer(serializers.ModelSerializer):
    """Full call details with recording and notes"""
    user = UserMiniSerializer(read_only=True)
    phone_number = PhoneNumberSerializer(read_only=True)
    recordings = serializers.SerializerMethodField()
    call_notes = serializers.SerializerMethodField()
    lead = serializers.SerializerMethodField()
    deal = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    
    class Meta:
        model = Call
        fields = [
            'id', 'company', 'phone_number', 'user', 'lead', 'deal', 'customer',
            'direction', 'from_number', 'to_number', 'status', 'duration',
            'start_time', 'end_time', 'recording_url', 'recording_duration',
            'twilio_call_sid', 'price', 'price_unit', 'notes', 'disposition',
            'created_at', 'recordings', 'call_notes'
        ]
        read_only_fields = [
            'company', 'twilio_call_sid', 'start_time', 'end_time',
            'recording_url', 'recording_duration', 'price', 'created_at'
        ]
    
    def get_recordings(self, obj):
        return CallRecordingSerializer(obj.recordings.all(), many=True).data
    
    def get_call_notes(self, obj):
        return CallNoteSerializer(obj.call_notes.all(), many=True).data
    
    def get_lead(self, obj):
        if obj.lead:
            return {'id': obj.lead.id, 'name': f"{obj.lead.first_name} {obj.lead.last_name}"}
        return None
    
    def get_deal(self, obj):
        if obj.deal:
            return {'id': obj.deal.id, 'title': obj.deal.title}
        return None
    
    def get_customer(self, obj):
        if obj.customer:
            return {'id': obj.customer.id, 'email': obj.customer.user.email}
        return None


class MakeCallSerializer(serializers.Serializer):
    """Serializer for making a call"""
    to_number = serializers.CharField(max_length=20, required=True)
    from_number_id = serializers.IntegerField(required=True, help_text='PhoneNumber ID')
    lead_id = serializers.IntegerField(required=False, allow_null=True)
    deal_id = serializers.IntegerField(required=False, allow_null=True)
    customer_id = serializers.IntegerField(required=False, allow_null=True)
    record = serializers.BooleanField(default=True)
    
    def validate_to_number(self, value):
        """Validate phone number format (basic E.164 check)"""
        if not value.startswith('+'):
            raise serializers.ValidationError("Phone number must be in E.164 format (e.g., +1234567890)")
        return value


class CallNoteSerializer(serializers.ModelSerializer):
    """Call note serializer"""
    user = UserMiniSerializer(read_only=True)
    
    class Meta:
        model = CallNote
        fields = ['id', 'call', 'user', 'note', 'created_at']
        read_only_fields = ['user', 'created_at']


class UpdateCallSerializer(serializers.ModelSerializer):
    """Serializer for updating call (disposition, notes)"""
    class Meta:
        model = Call
        fields = ['disposition', 'notes']
    
    def validate_disposition(self, value):
        """Validate disposition choice"""
        valid_choices = [choice[0] for choice in Call.DISPOSITION_CHOICES]
        if value and value not in valid_choices:
            raise serializers.ValidationError(f"Disposition must be one of: {', '.join(valid_choices)}")
        return value


class CallRecordingSerializer(serializers.ModelSerializer):
    """Call recording serializer"""
    class Meta:
        model = CallRecording
        fields = ['id', 'call', 'recording_url', 'recording_sid', 'duration', 'file_size', 'transcription', 'created_at']
        read_only_fields = fields


class VoicemailMessageSerializer(serializers.ModelSerializer):
    """Voicemail message serializer"""
    phone_number = serializers.StringRelatedField(read_only=True)
    listened_by = UserMiniSerializer(read_only=True)
    
    class Meta:
        model = VoicemailMessage
        fields = [
            'id', 'company', 'phone_number', 'from_number', 'duration',
            'recording_url', 'transcription', 'is_listened', 'listened_at',
            'listened_by', 'created_at'
        ]
        read_only_fields = ['company', 'created_at']

