from email import message_from_bytes
from email.header import decode_header
from bs4 import BeautifulSoup
import html2text


def parse_email_message(raw_email: bytes):
    """Parse raw RFC822 email bytes into structured parts."""
    msg = message_from_bytes(raw_email)
    headers = {k: _decode_header(v) for k, v in msg.items()}
    body_text, body_html, attachments = _extract_parts(msg)
    cleaned_html = clean_html(body_html) if body_html else None
    text_version = body_text or (html2text.html2text(cleaned_html) if cleaned_html else "")
    return {
        'headers': headers,
        'body_text': text_version.strip(),
        'body_html': cleaned_html or "",
        'attachments': attachments,
    }


def _decode_header(value):
    parts = decode_header(value)
    decoded = []
    for text, charset in parts:
        if isinstance(text, bytes):
            decoded.append(text.decode(charset or 'utf-8', errors='ignore'))
        else:
            decoded.append(text)
    return ''.join(decoded)


def _extract_parts(msg):
    body_text = None
    body_html = None
    attachments = []
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            disp = part.get('Content-Disposition', '')
            if ctype == 'text/plain' and 'attachment' not in disp:
                body_text = (part.get_payload(decode=True) or b'').decode(errors='ignore')
            elif ctype == 'text/html' and 'attachment' not in disp:
                body_html = (part.get_payload(decode=True) or b'').decode(errors='ignore')
            elif 'attachment' in disp:
                attachments.append({
                    'file_name': part.get_filename(),
                    'content_type': ctype,
                    'data': part.get_payload(decode=True),
                })
    else:
        ctype = msg.get_content_type()
        if ctype == 'text/plain':
            body_text = (msg.get_payload(decode=True) or b'').decode(errors='ignore')
        elif ctype == 'text/html':
            body_html = (msg.get_payload(decode=True) or b'').decode(errors='ignore')
    return body_text, body_html, attachments


def clean_html(html: str):
    soup = BeautifulSoup(html, 'html.parser')
    for tag in soup(['script', 'style']):
        tag.decompose()
    return str(soup)
