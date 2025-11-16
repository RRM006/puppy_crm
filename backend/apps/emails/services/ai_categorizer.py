from django.conf import settings
from openai import OpenAI
import json, re


def ai_categorize_email(email):
    """Use OpenAI API to categorize email content.
    Falls back silently if API key missing or call fails.
    """
    api_key = getattr(settings, 'OPENAI_API_KEY', None)
    if not api_key:
        return {}
    client = OpenAI(api_key=api_key)
    prompt = (
        "Categorize this email into one of: Lead, Deal, Customer Support, Complaint, Promotional, Social, Other. "
        "Also provide sentiment (Positive, Neutral, Negative). Return JSON with keys category and sentiment.\n"
        f"Subject: {email.subject}\nBody: {email.body_text[:2000]}"
    )
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        content = response.choices[0].message.content.strip()
        # Extract JSON object robustly, fallback if parse fails
        match = re.search(r"\{[\s\S]*\}", content)
        if match:
            try:
                data = json.loads(match.group(0))
                cat = data.get('category', '')
                sent = data.get('sentiment', '')
                # Normalize
                if cat:
                    cat = cat.lower().replace('customer support', 'customer').replace('support', 'customer')
                return {'category': cat, 'sentiment': sent.lower() if isinstance(sent, str) else sent}
            except json.JSONDecodeError:
                pass
    except Exception:  # noqa: BLE001
        pass
    return {}

def generate_reply_suggestion(email, context: dict):
    api_key = getattr(settings, 'OPENAI_API_KEY', None)
    if not api_key:
        return ""
    client = OpenAI(api_key=api_key)
    prompt = (
        "Draft a professional reply. Context: " + str(context) + "\n" +
        f"Original Subject: {email.subject}\nOriginal Body: {email.body_text[:1500]}"
    )
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
        )
        return resp.choices[0].message.content.strip()
    except Exception:  # noqa: BLE001
        return ""
