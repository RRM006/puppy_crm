from rest_framework import serializers
from email_validator import validate_email, EmailNotValidError
from django.conf import settings
from apps.emails.models import EmailAccount, EmailTemplate, Email, EmailThread


class EmailAccountSerializer(serializers.ModelSerializer):
    unread_count = serializers.SerializerMethodField()
    last_sync = serializers.DateTimeField(read_only=True)
    password = serializers.SerializerMethodField()

    class Meta:
        model = EmailAccount
        fields = [
            'id', 'email', 'provider', 'smtp_host', 'smtp_port', 'imap_host', 'imap_port',
            'username', 'is_active', 'is_default', 'sync_enabled', 'last_sync', 'unread_count', 'password'
        ]

    def get_unread_count(self, obj):
        return obj.emails.filter(is_read=False).count()

    def get_password(self, obj):
        return '********'


class CreateEmailAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailAccount
        fields = [
            'email', 'provider', 'smtp_host', 'smtp_port', 'imap_host', 'imap_port', 'username', 'password'
        ]

    def validate_email(self, value):
        try:
            validate_email(value)
        except EmailNotValidError as e:  # noqa: PERF203
            raise serializers.ValidationError(str(e))
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        company = user.company_users.first().company if user.company_users.first() else None
        from apps.emails.services.encryption import encrypt_secret
        # Encrypt password before storing
        if validated_data.get('password'):
            validated_data['password'] = encrypt_secret(validated_data['password'])
        account = EmailAccount.objects.create(user=user, company=company, **validated_data)
        return account


class GmailOAuthSerializer(serializers.Serializer):
    auth_code = serializers.CharField()

    def create(self, validated_data):
        # Exchange code for token (placeholder)
        token_payload = {'access_token': validated_data['auth_code'], 'refresh_token': 'refresh-placeholder'}
        user = self.context['request'].user
        company = user.company_users.first().company if user.company_users.first() else None
        from apps.emails.services.encryption import encrypt_secret
        account = EmailAccount.objects.create(
            user=user,
            company=company,
            email=user.email,
            provider=EmailAccount.PROVIDER_GMAIL,
            username=user.email,
            password=encrypt_secret(str(token_payload)),
        )
        return account


class EmailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Email
        fields = '__all__'


class SendEmailSerializer(serializers.Serializer):
    to_emails = serializers.ListField(child=serializers.EmailField())
    cc_emails = serializers.ListField(child=serializers.EmailField(), required=False)
    bcc_emails = serializers.ListField(child=serializers.EmailField(), required=False)
    subject = serializers.CharField()
    body_html = serializers.CharField(required=False, allow_blank=True)
    body_text = serializers.CharField(required=False, allow_blank=True)
    template_id = serializers.IntegerField(required=False)
    reply_to_id = serializers.IntegerField(required=False)

    def create(self, validated_data):
        from apps.emails.services.email_sender import send_email
        from apps.emails.services.template_renderer import render_template
        user = self.context['request'].user
        from_account = EmailAccount.objects.filter(user=user, is_default=True).first() or EmailAccount.objects.filter(user=user).first()
        reply_to = None
        if validated_data.get('reply_to_id'):
            reply_to = Email.objects.get(id=validated_data['reply_to_id'])

        subject = validated_data['subject']
        body_html = validated_data.get('body_html')
        body_text = validated_data.get('body_text')

        # Template processing
        if validated_data.get('template_id'):
            template = EmailTemplate.objects.get(id=validated_data['template_id'])
            context = _build_template_context(user)
            rendered = render_template(template, context)
            subject = rendered['subject']
            body_html = rendered['body_html']
            if not body_text:
                body_text = rendered['body_text']
            # increment usage
            template.usage_count = (template.usage_count or 0) + 1
            template.save(update_fields=['usage_count'])

        email = send_email(
            to=validated_data['to_emails'],
            subject=subject,
            body_html=body_html,
            body_text=body_text,
            from_account=from_account,
            cc=validated_data.get('cc_emails'),
            bcc=validated_data.get('bcc_emails'),
            reply_to_email=reply_to,
        )
        return email


class EmailThreadListSerializer(serializers.ModelSerializer):
    last_message_at = serializers.DateTimeField()
    class Meta:
        model = EmailThread
        fields = ['id', 'subject', 'participants', 'last_message_at', 'message_count', 'is_read', 'is_starred', 'category', 'sentiment']


class EmailThreadDetailSerializer(serializers.ModelSerializer):
    emails = EmailSerializer(many=True, read_only=True)
    class Meta:
        model = EmailThread
        fields = ['id', 'subject', 'participants', 'category', 'sentiment', 'emails']


ALLOWED_TEMPLATE_VARIABLES = {
    'customer_name', 'company_name', 'user_name', 'lead_name', 'deal_title', 'order_number'
}


def _build_template_context(user):
    company_user = user.company_users.first()
    company = company_user.company if company_user else None
    return {
        'customer_name': '',
        'company_name': company.company_name if company else '',
        'user_name': user.get_full_name() or user.username,
        'lead_name': '',
        'deal_title': '',
        'order_number': '',
    }


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = ['id', 'name', 'subject', 'body_html', 'body_text', 'category', 'is_active', 'usage_count', 'created_at', 'updated_at']


class CreateTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = ['name', 'subject', 'body_html', 'body_text', 'category']

    def validate(self, attrs):
        import re
        vars_found = set(re.findall(r'\{([a-zA-Z0-9_]+)\}', attrs['subject'] + attrs['body_html']))
        invalid = vars_found - ALLOWED_TEMPLATE_VARIABLES
        if invalid:
            raise serializers.ValidationError({'variables': f'Invalid variables: {", ".join(sorted(invalid))}'})
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        company_user = user.company_users.first()
        company = company_user.company if company_user else None
        return EmailTemplate.objects.create(company=company, created_by=user, **validated_data)


class TemplatePreviewSerializer(serializers.Serializer):
    template_id = serializers.IntegerField()
    sample_data = serializers.JSONField(required=False)

    def create(self, validated_data):
        from apps.emails.services.template_renderer import render_template
        template = EmailTemplate.objects.get(id=validated_data['template_id'])
        context = _build_template_context(self.context['request'].user)
        if 'sample_data' in validated_data:
            context.update({k: v for k, v in validated_data['sample_data'].items() if k in ALLOWED_TEMPLATE_VARIABLES})
        return render_template(template, context)

