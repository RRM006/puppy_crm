from uuid import uuid4
from django.conf import settings
from django.core.mail import send_mail
from django.urls import reverse


def generate_invitation_token() -> str:
    return str(uuid4())


def _build_accept_url(token: str) -> str:
    # Prefer FRONTEND_URL if provided, else build backend URL path
    frontend_base = getattr(settings, 'FRONTEND_URL', None)
    if frontend_base:
        return f"{frontend_base.rstrip('/')}/accept-invitation?token={token}"
    # Fallback API endpoint path (client can handle)
    return f"/api/auth/accept-invitation/?token={token}"


def send_invitation_email(invitation) -> None:
    subject = f"You're invited to join {invitation.company.company_name} on Puppy CRM"
    accept_url = _build_accept_url(invitation.invitation_token)
    inviter = invitation.invited_by
    inviter_name = f"{inviter.first_name} {inviter.last_name}".strip() or inviter.email

    message = (
        f"Hi,\n\n"
        f"{inviter_name} has invited you to join {invitation.company.company_name} on Puppy CRM as {invitation.role}.\n\n"
        f"Accept your invitation: {accept_url}\n\n"
        f"This link expires on {invitation.expires_at.strftime('%Y-%m-%d %H:%M %Z')}.\n\n"
        f"If you weren't expecting this, you can ignore this email.\n\n"
        f"— Puppy CRM"
    )

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER or 'no-reply@puppycrm.local')
    try:
        send_mail(subject, message, from_email, [invitation.email], fail_silently=True)
    except Exception:
        # Silent fail in dev; in production integrate logging
        pass
