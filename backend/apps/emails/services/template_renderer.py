import re
from apps.emails.models import EmailTemplate

VARIABLE_PATTERN = re.compile(r'\{([a-zA-Z0-9_]+)\}')


def render_template(template: EmailTemplate, context: dict):
    def _replace(text: str):
        def repl(match):
            key = match.group(1)
            return str(context.get(key, ''))
        return VARIABLE_PATTERN.sub(repl, text)

    subject = _replace(template.subject)
    body_html = _replace(template.body_html)
    body_text = _replace(template.body_text or '')
    return {
        'subject': subject,
        'body_html': body_html,
        'body_text': body_text,
    }
