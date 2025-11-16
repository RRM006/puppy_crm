import base64
from django.conf import settings
from django.utils import timezone
from django.http import HttpResponse, HttpResponseRedirect
from apps.emails.models import Email


def generate_open_token(email: Email) -> str:
    raw = f"open:{email.id}:{settings.SECRET_KEY[:8]}".encode()
    return base64.urlsafe_b64encode(raw).decode()


def generate_click_token(email: Email, url: str) -> str:
    raw = f"click:{email.id}:{url}:{settings.SECRET_KEY[:8]}".encode()
    return base64.urlsafe_b64encode(raw).decode()


def track_open(token: str):
    try:
        decoded = base64.urlsafe_b64decode(token.encode()).decode()
        _, email_id, _ = decoded.split(":", 2)
        email = Email.objects.get(id=int(email_id))
        email.opens_count += 1
        if not email.opened_at:
            email.opened_at = timezone.now()
        email.save(update_fields=["opens_count", "opened_at"])
    except Exception:  # noqa: BLE001
        pass
    # return 1x1 transparent GIF
    gif = base64.b64decode("R0lGODlhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=")
    return HttpResponse(gif, content_type="image/gif")


def track_click(token: str):
    try:
        decoded = base64.urlsafe_b64decode(token.encode()).decode()
        _, email_id, url, _ = decoded.split(":", 3)
        email = Email.objects.get(id=int(email_id))
        email.clicks_count += 1
        if not email.clicked_at:
            email.clicked_at = timezone.now()
        email.save(update_fields=["clicks_count", "clicked_at"])
        return HttpResponseRedirect(url)
    except Exception:  # noqa: BLE001
        return HttpResponseRedirect("/")
