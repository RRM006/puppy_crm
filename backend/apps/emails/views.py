from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from apps.emails.models import EmailAccount, Email, EmailThread, EmailTemplate, EmailRule
from apps.emails.serializers import (
    EmailAccountSerializer, CreateEmailAccountSerializer, GmailOAuthSerializer,
    SendEmailSerializer, EmailThreadListSerializer, EmailThreadDetailSerializer, EmailSerializer,
    EmailTemplateSerializer, CreateTemplateSerializer, TemplatePreviewSerializer
)
from apps.emails.services.email_sender import send_email
from apps.emails.services.email_tracker import generate_open_token, generate_click_token, track_open, track_click
from apps.emails.tasks import sync_email_account_task, send_email_task
from django.http import HttpResponse


class EmailAccountListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = EmailAccount.objects.all()
    serializer_class = EmailAccountSerializer

    def get_queryset(self):
        return EmailAccount.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateEmailAccountSerializer
        return EmailAccountSerializer

    def perform_create(self, serializer):
        account = serializer.save()
        sync_email_account_task.delay(account.id)


class EmailAccountDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EmailAccountSerializer
    queryset = EmailAccount.objects.all()

    def get_queryset(self):
        return EmailAccount.objects.filter(user=self.request.user)


class GmailConnectView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        # Return dummy authorization URL placeholder
        return Response({'auth_url': 'https://accounts.google.com/o/oauth2/auth?...'})


class GmailCallbackView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = GmailOAuthSerializer

    def perform_create(self, serializer):
        # Perform real code exchange using Google OAuth Flow if possible
        from google_auth_oauthlib.flow import Flow
        from django.conf import settings
        auth_code = self.request.data.get('auth_code')
        if auth_code:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": settings.GMAIL_CLIENT_ID,
                        "client_secret": settings.GMAIL_CLIENT_SECRET,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [settings.GMAIL_REDIRECT_URI],
                    }
                },
                scopes=[
                    "https://www.googleapis.com/auth/gmail.readonly",
                    "https://www.googleapis.com/auth/gmail.send",
                ],
            )
            flow.redirect_uri = settings.GMAIL_REDIRECT_URI
            # Exchange code (try; fallback to serializer default)
            try:
                flow.fetch_token(code=auth_code)
                creds = flow.credentials
                token_payload = {
                    "access_token": creds.token,
                    "refresh_token": getattr(creds, 'refresh_token', ''),
                    "token_uri": creds.token_uri,
                    "client_id": creds.client_id,
                    "client_secret": creds.client_secret,
                    "scopes": creds.scopes,
                    "expiry": creds.expiry.isoformat() if getattr(creds, 'expiry', None) else None,
                }
                serializer.validated_data['auth_code'] = str(token_payload)
            except Exception:  # noqa: BLE001
                pass
        account = serializer.save()
        sync_email_account_task.delay(account.id)


class SyncEmailAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, pk):
        account = get_object_or_404(EmailAccount, pk=pk, user=request.user)
        sync_email_account_task.delay(account.id)
        return Response({'status': 'queued'})


class SetDefaultAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, pk):
        account = get_object_or_404(EmailAccount, pk=pk, user=request.user)
        EmailAccount.objects.filter(user=request.user, is_default=True).update(is_default=False)
        account.is_default = True
        account.save(update_fields=['is_default'])
        return Response({'status': 'ok'})


class SendEmailView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SendEmailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.save()
        send_email_task.delay(email.id)
        return Response(EmailSerializer(email).data, status=status.HTTP_201_CREATED)


class EmailInboxView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EmailThreadListSerializer

    def get_queryset(self):
        return EmailThread.objects.filter(email_account__user=self.request.user).order_by('-last_message_at')


class EmailThreadDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EmailThreadDetailSerializer
    queryset = EmailThread.objects.all()

    def get_queryset(self):
        return EmailThread.objects.filter(email_account__user=self.request.user)


class MarkAsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, pk):
        thread = get_object_or_404(EmailThread, pk=pk, email_account__user=request.user)
        thread.is_read = True
        thread.save(update_fields=['is_read'])
        thread.emails.update(is_read=True)
        return Response({'status': 'ok'})


class MarkAsStarredView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, pk):
        thread = get_object_or_404(EmailThread, pk=pk, email_account__user=request.user)
        thread.is_starred = not thread.is_starred
        thread.save(update_fields=['is_starred'])
        return Response({'status': 'ok', 'is_starred': thread.is_starred})


class DeleteEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def delete(self, request, pk):
        email = get_object_or_404(Email, pk=pk, email_account__user=request.user)
        email.status = Email.STATUS_FAILED  # soft delete placeholder
        email.save(update_fields=['status'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class EmailOpenTrackingView(APIView):
    authentication_classes = []
    permission_classes = []
    def get(self, request, token):
        from apps.emails.services.email_tracker import track_open
        return track_open(token)


class EmailLinkClickView(APIView):
    authentication_classes = []
    permission_classes = []
    def get(self, request, token):
        from apps.emails.services.email_tracker import track_click
        return track_click(token)


class SuggestReplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, pk):
        email = get_object_or_404(Email, pk=pk, email_account__user=request.user)
        from apps.emails.services.ai_categorizer import generate_reply_suggestion
        suggestion = generate_reply_suggestion(email, context={})
        return Response({'suggested_reply': suggestion})


class ReplyEmailView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SendEmailSerializer  # reuse with reply_to_id

    def create(self, request, *args, **kwargs):
        original = get_object_or_404(Email, pk=kwargs['pk'], email_account__user=request.user)
        data = request.data.copy()
        data['reply_to_id'] = original.id
        if 'subject' not in data:
            data['subject'] = f"Re: {original.subject}"
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        email = serializer.save()
        send_email_task.delay(email.id)
        return Response(EmailSerializer(email).data, status=status.HTTP_201_CREATED)


class EmailSearchView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EmailThreadListSerializer

    def get_queryset(self):
        q = self.request.query_params.get('q', '').strip()
        base = EmailThread.objects.filter(email_account__user=self.request.user)
        if not q:
            return base.none()
        # Filter threads whose subject or any email body contains q
        thread_ids = Email.objects.filter(
            email_account__user=self.request.user,
            ).filter(
                models.Q(subject__icontains=q) |
                models.Q(body_text__icontains=q) |
                models.Q(body_html__icontains=q)
            ).values_list('thread_id', flat=True)
        return base.filter(models.Q(subject__icontains=q) | models.Q(id__in=thread_ids)).order_by('-last_message_at')


class EmailCategoriesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        qs = EmailThread.objects.filter(email_account__user=request.user)
        data = qs.values('category').annotate(count=models.Count('id')).order_by('-count')
        return Response({'categories': list(data)})


class EmailTemplateListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = EmailTemplate.objects.all()

    def get_queryset(self):
        qs = EmailTemplate.objects.filter(created_by=self.request.user)
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(name__icontains=search)
        return qs.order_by('-updated_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateTemplateSerializer
        return EmailTemplateSerializer


class EmailTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EmailTemplateSerializer
    queryset = EmailTemplate.objects.all()

    def get_queryset(self):
        return EmailTemplate.objects.filter(created_by=self.request.user)


class TemplatePreviewView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TemplatePreviewSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rendered = serializer.save()
        return Response(rendered, status=status.HTTP_200_OK)


class DuplicateTemplateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, pk):
        tmpl = get_object_or_404(EmailTemplate, pk=pk, created_by=request.user)
        new_tmpl = EmailTemplate.objects.create(
            company=tmpl.company,
            created_by=request.user,
            name=f"{tmpl.name} Copy",
            subject=tmpl.subject,
            body_html=tmpl.body_html,
            body_text=tmpl.body_text,
            category=tmpl.category,
        )
        return Response(EmailTemplateSerializer(new_tmpl).data, status=status.HTTP_201_CREATED)
