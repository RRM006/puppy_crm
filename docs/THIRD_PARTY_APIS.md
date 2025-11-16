# 🔌 Third-Party APIs & Integrations

## 📋 Overview

This document lists all external services and APIs integrated into Puppy CRM.

---

## 📧 SMTP Email (Gmail)

### Purpose
Send transactional emails such as team invitations, password resets, and notifications.

### Service
**Gmail SMTP** (Free with Google account) or any SMTP provider

### Setup Instructions (Gmail)

#### Step 1: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **"2-Step Verification"**
3. Follow the prompts to enable 2-step verification
4. You'll need a phone number for verification

#### Step 2: Create App Password

1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **"App passwords"**
3. If you don't see this option, make sure 2-Step Verification is enabled
4. Select app: **"Mail"**
5. Select device: **"Other (Custom name)"**
6. Enter name: **"Puppy CRM"**
7. Click **"Generate"**
8. **Copy the 16-character password** (you won't see it again!)

**Example App Password**: `abcd efgh ijkl mnop`

#### Step 3: Configure Backend

Add the following to `backend/.env`:

```env
# Frontend base URL for links in emails
FRONTEND_URL=http://localhost:3000

# Gmail SMTP Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your.gmail.address@gmail.com
EMAIL_HOST_PASSWORD=abcdefghijklmnop
DEFAULT_FROM_EMAIL="Puppy CRM <your.gmail.address@gmail.com>"
```

**Important Notes**:
- Use your **actual Gmail address** for `EMAIL_HOST_USER`
- Use the **16-character app password** (no spaces) for `EMAIL_HOST_PASSWORD`
- Never use your regular Gmail password - it won't work!

#### Step 4: Configure Django Settings

The settings are already configured in `backend/config/settings.py`:

```python
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@example.com')
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')
```

#### Step 5: Restart Backend

After updating `.env`, restart the Django server:

```bash
python manage.py runserver
```

### Email Templates

#### Team Invitation Email

**Subject**: `You've been invited to join {company_name} on Puppy CRM`

**Body** (HTML):
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐶 Puppy CRM</h1>
        </div>
        <div class="content">
            <h2>You've been invited!</h2>
            <p>Hello {first_name},</p>
            <p>You've been invited to join <strong>{company_name}</strong> on Puppy CRM as a <strong>{role}</strong>.</p>
            <p>Click the button below to accept your invitation:</p>
            <a href="{accept_url}" class="button">Accept Invitation</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">{accept_url}</p>
            <p><strong>This invitation expires in 7 days.</strong></p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>This email was sent by Puppy CRM</p>
            <p>© 2025 Puppy CRM. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

**Plain Text Version**:
```
You've been invited!

Hello {first_name},

You've been invited to join {company_name} on Puppy CRM as a {role}.

Accept your invitation by clicking this link:
{accept_url}

This invitation expires in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
This email was sent by Puppy CRM
© 2025 Puppy CRM. All rights reserved.
```

### Usage in Code

**Backend** (`backend/apps/authentication/utils.py`):
```python
from django.core.mail import send_mail
from django.conf import settings

def send_invitation_email(invitation):
    """Send team invitation email."""
    accept_url = f"{settings.FRONTEND_URL}/accept-invitation/{invitation.invitation_token}"
    
    subject = f"You've been invited to join {invitation.company.company_name} on Puppy CRM"
    message = f"""
    Hello {invitation.first_name or 'there'},
    
    You've been invited to join {invitation.company.company_name} on Puppy CRM as a {invitation.get_role_display()}.
    
    Accept your invitation: {accept_url}
    
    This invitation expires in 7 days.
    """
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[invitation.email],
        fail_silently=False,
    )
```

### Testing Email

**Test in Django Shell**:
```python
python manage.py shell

from django.core.mail import send_mail
from django.conf import settings

send_mail(
    subject='Test Email',
    message='This is a test email from Puppy CRM',
    from_email=settings.DEFAULT_FROM_EMAIL,
    recipient_list=['your-email@gmail.com'],
    fail_silently=False,
)
```

### Rate Limits

**Gmail Free**:
- Sending: 500 emails/day
- API calls: 250 quota units/user/second

**Gmail Workspace**:
- Sending: 2000 emails/day
- API calls: 250 quota units/user/second

**Best Practices**:
- Batch send with delays
- Use dedicated SMTP for bulk emails
- Monitor quota usage via Google Cloud Console

---

## 📧 Gmail API (OAuth Integration)

### Purpose
Send and receive emails via Gmail OAuth without exposing passwords. Supports full Gmail features (threading, labels, filters).

### Service
**Gmail API** (Google Cloud Platform)

### Setup Instructions

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"**
3. Project name: **"Puppy CRM"**
4. Click **"Create"**

#### Step 2: Enable Gmail API

1. In the project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Gmail API"**
3. Click **"Enable"**

#### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. User Type: **"External"** (or "Internal" for Workspace)
3. Click **"Create"**
4. Fill in:
   - App name: **"Puppy CRM"**
   - User support email: Your email
   - Developer contact: Your email
5. Scopes: Click **"Add or Remove Scopes"**, add:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify` (optional)
6. Test users: Add your Gmail address
7. Click **"Save and Continue"**

#### Step 4: Create OAuth Client ID

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: **"Puppy CRM Web"**
5. Authorized redirect URIs:
   - `http://localhost:3000/email-inbox`
   - `http://localhost:3000/auth/google/callback`
   - Add production URLs when deployed
6. Click **"Create"**
7. **Copy Client ID and Client Secret** (you'll need these!)

#### Step 5: Configure Backend

Add to `backend/.env`:

```env
# Gmail OAuth Configuration
GMAIL_CLIENT_ID=123456789-abc...apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-...
GMAIL_REDIRECT_URI=http://localhost:3000/email-inbox
```

#### Step 6: Configure Frontend

Web (`frontend-web/.env`):
```env
VITE_GMAIL_CLIENT_ID=123456789-abc...apps.googleusercontent.com
```

Mobile (`mobile-app/.env`):
```env
EXPO_PUBLIC_GMAIL_CLIENT_ID=123456789-abc...apps.googleusercontent.com
```

#### Step 7: Test OAuth Flow

1. Click "Connect Gmail" in email accounts page
2. Redirected to Google consent screen
3. Grant permissions (read and send emails)
4. Redirected back to app
5. Account automatically syncs

### Token Management

**Access Token**: 1 hour lifetime  
**Refresh Token**: No expiration (until revoked)

**Auto-refresh logic** (backend):
```python
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

creds = Credentials.from_authorized_user_info(token_dict)
if creds.expired and creds.refresh_token:
    creds.refresh(Request())
    # Save updated creds
```

### API Usage Examples

**Send Email**:
```python
from googleapiclient.discovery import build

service = build('gmail', 'v1', credentials=creds)
message = {'raw': base64_encoded_email}
service.users().messages().send(userId='me', body=message).execute()
```

**Fetch Inbox**:
```python
results = service.users().messages().list(userId='me', maxResults=50).execute()
messages = results.get('messages', [])
```

**Get Message**:
```python
msg = service.users().messages().get(userId='me', id=message_id, format='full').execute()
```

### Quota & Limits

**Gmail API Quotas**:
- Queries per day: 1 billion
- Queries per user per second: 250
- Send quota: Same as SMTP (500/day free, 2000/day Workspace)

**Best Practices**:
- Use batch requests for multiple operations
- Implement exponential backoff for rate limit errors
- Cache frequently accessed data (Redis)

### Security

**Token Storage**:
- Tokens encrypted with Fernet before database storage
- Never expose tokens in API responses or logs
- Rotate encryption key periodically

**Scopes**:
- Request minimum required scopes
- `gmail.readonly`: Read-only access
- `gmail.send`: Send emails only
- `gmail.modify`: Full access (use sparingly)

**Revocation**:
- Users can revoke access: [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
- Handle revoked tokens gracefully (prompt re-authorization)

---

## 🤖 OpenAI API (Email AI Features)

### Purpose
AI-powered email categorization, reply suggestions, and sentiment analysis.

### Service
**OpenAI GPT-4** or **Anthropic Claude**

### Setup Instructions

#### Step 1: Get API Key

**OpenAI**:
1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Go to **"API Keys"**
4. Click **"Create new secret key"**
5. **Copy the key** (starts with `sk-proj-...`)

**Anthropic** (alternative):
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Go to **"API Keys"**
4. Click **"Create Key"**
5. **Copy the key**

#### Step 2: Configure Backend

Add to `backend/.env`:

```env
# AI Configuration
EMAIL_AI_ENABLED=True
EMAIL_RULE_ENGINE_ENABLED=True
OPENAI_API_KEY=sk-proj-...

# Or for Anthropic:
# ANTHROPIC_API_KEY=sk-ant-...
```

#### Step 3: Install Python Client

```bash
pip install openai  # or anthropic
```

### AI Features

**Email Categorization**:
- Analyzes subject and body
- Assigns category: Primary, Lead, Deal, Customer, Complaint
- Runs on every received email (if enabled)

**Reply Suggestions**:
- Considers email content, sender history, CRM context
- Generates appropriate response
- User can edit before sending

**Sentiment Analysis** (optional):
- Detects tone: Positive, Neutral, Negative
- Helps prioritize urgent/negative emails
- Displayed as badge in inbox

### Code Example

**Email Categorization**:
```python
import openai

def categorize_email(subject, body):
    prompt = f"""
    Categorize this email into one of: primary, lead, deal, customer, complaint.
    
    Subject: {subject}
    Body: {body}
    
    Category:
    """
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=10
    )
    return response.choices[0].message.content.strip().lower()
```

**Reply Suggestion**:
```python
def suggest_reply(email_content, context):
    prompt = f"""
    You are a helpful CRM assistant. Generate a professional email reply.
    
    Original Email: {email_content}
    CRM Context: {context}
    
    Reply:
    """
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200
    )
    return response.choices[0].message.content.strip()
```

### Rate Limits & Costs

**OpenAI GPT-4**:
- Rate: 10,000 requests/minute (paid tier)
- Cost: $0.03/1K input tokens, $0.06/1K output tokens
- Avg email categorization: ~$0.001/email

**Anthropic Claude**:
- Rate: 50 requests/minute (varies by tier)
- Cost: $0.008/1K input tokens, $0.024/1K output tokens

**Best Practices**:
- Cache categorization results
- Batch process for bulk imports
- Set timeout (10s) to avoid hanging
- Fall back to rule-based if API fails

### Privacy

**Data Handling**:
- Email content sent to OpenAI/Anthropic (review terms)
- No long-term storage by provider
- Consider on-premise AI for sensitive data
- Allow users to opt out of AI features

---

## 📨 IMAP/SMTP Servers

### Purpose
Connect to any email provider (Gmail, Outlook, custom domains) for sending and receiving.

### Supported Providers

**Gmail**:
- SMTP: `smtp.gmail.com:587` (TLS)
- IMAP: `imap.gmail.com:993` (SSL)
- Requires App Password (see SMTP Email section above)

**Outlook/Office 365**:
- SMTP: `smtp.office365.com:587` (TLS)
- IMAP: `outlook.office365.com:993` (SSL)
- Use account password or app password

**Yahoo**:
- SMTP: `smtp.mail.yahoo.com:587` (TLS)
- IMAP: `imap.mail.yahoo.com:993` (SSL)
- Requires app password

**Custom Domain** (e.g., cPanel, Plesk):
- Check hosting provider for SMTP/IMAP settings
- Usually `mail.yourdomain.com` or `smtp.yourdomain.com`
- Ports: 587 (SMTP TLS), 993 (IMAP SSL)

### Code Example

**Send via SMTP**:
```python
import smtplib
from email.mime.text import MIMEText

msg = MIMEText("Hello from Puppy CRM!")
msg['Subject'] = "Test Email"
msg['From'] = "you@example.com"
msg['To'] = "recipient@example.com"

with smtplib.SMTP('smtp.gmail.com', 587) as server:
    server.starttls()
    server.login("you@example.com", "app-password")
    server.send_message(msg)
```

**Fetch via IMAP**:
```python
import imaplib

mail = imaplib.IMAP4_SSL('imap.gmail.com')
mail.login("you@example.com", "app-password")
mail.select('INBOX')
status, messages = mail.search(None, 'UNSEEN')
for num in messages[0].split():
    status, data = mail.fetch(num, '(RFC822)')
    # Process email data
```

### Troubleshooting

**Authentication Failed**:
- Use app password, not account password
- Enable "Less secure app access" (Gmail legacy, not recommended)
- Check username/password correct
- Verify 2FA enabled for app password generation

**Connection Timeout**:
- Check firewall not blocking ports 587, 993
- Verify server hostname correct
- Test with telnet: `telnet smtp.gmail.com 587`

**SSL Certificate Error**:
- Update Python: `pip install --upgrade certifi`
- Disable SSL verify (not recommended): `context.check_hostname = False`

---

## 📧 Gmail API (OAuth) – Email Sync & Sending

**Purpose**: Access Gmail messages via API (higher fidelity than raw IMAP), send with proper threading & labels.

### Enable Gmail API
1. Visit Google Cloud Console → Create Project
2. Enable "Gmail API" in API Library
3. Configure OAuth consent screen (Internal for dev)
4. Create OAuth Client ID (Web Application)
5. Authorized redirect URI: `http://localhost:8000/api/emails/gmail-callback/`

### Environment Variables
```env
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:8000/api/emails/gmail-callback/
```

### Flow
1. Frontend requests `/api/emails/connect-gmail/` for auth URL
2. User consents; Google redirects with `code`
3. Backend `/api/emails/gmail-callback/` exchanges code → tokens (placeholder)
4. Account created; initial sync task queued

### Scopes (Recommended Minimal)
`https://www.googleapis.com/auth/gmail.readonly` – reading inbox  
`https://www.googleapis.com/auth/gmail.send` – sending messages

### Pagination & Sync Strategy (Planned Enhancements)
- Store historyId for delta sync
- Fetch in batches (100 messages)
- Parallelize attachment downloads

---

## 🤖 OpenAI (AI Email Categorization & Reply Suggestions)

**Purpose**: Improve classification + accelerate responses.

### Enable
1. Create account at https://platform.openai.com/
2. Generate API key
3. Add to `.env` as `OPENAI_API_KEY=sk-...`
4. Toggle `AI_EMAIL_SORTING_ENABLED=True`

### Usage in Code
`apps/emails/services/ai_categorizer.py` – categorization & reply suggestion.

### Cost Considerations
- Usage based on tokens processed (subject + truncated body)
- Keep bodies trimmed (currently 2000 chars)

### Future Enhancements
- Summarize long threads
- Automatic draft generation for common intents

---

## 🔐 Email Credential Encryption

**Purpose**: Protect stored SMTP/IMAP passwords and OAuth tokens.

### Method
Fernet symmetric encryption (library: `cryptography`). Secrets encrypted before DB write and decrypted only at send/sync time.

### Environment Variable
`EMAIL_ENCRYPTION_KEY` – 32-byte base64 Fernet key.

Generate key:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Add to `.env`:
```env
EMAIL_ENCRYPTION_KEY=your-generated-key-here
```

### Code Locations
- Encryption helpers: `apps/emails/services/encryption.py`
- Applied in serializers: `CreateEmailAccountSerializer`, `GmailOAuthSerializer`
- Decryption before sending: `email_sender.py` (`_send_via_smtp`, `_send_via_gmail_api`)

### Fallback Behavior
If key missing: values stored plaintext (NOT secure). Set the key early in development.

### Rotation Strategy (Recommended Later)
1. Add new key as `EMAIL_ENCRYPTION_KEY_NEW`
2. Re-encrypt secrets batch-wise
3. Swap keys and remove old.



- **Free Gmail**: 500 emails/day
- **Google Workspace**: 2,000 emails/day
- **Recommendation**: For production, use a dedicated email service (SendGrid, Mailgun, AWS SES)

### Production Recommendations

1. **Use Dedicated Email Service**:
   - SendGrid (100 emails/day free, then pay-as-you-go)
   - Mailgun (5,000 emails/month free)
   - AWS SES (62,000 emails/month free)

2. **Domain Authentication**:
   - Set up SPF, DKIM, and DMARC records
   - Improves deliverability and prevents spam

3. **Email Templates**:
   - Use Django template system for HTML emails
   - Consider using `django-html-email` or `django-post-office`

### Troubleshooting

| Error | Solution |
|-------|----------|
| "SMTPAuthenticationError" | Check app password is correct (16 characters, no spaces) |
| "Connection refused" | Check EMAIL_PORT (587 for TLS, 465 for SSL) |
| "Email not sending" | Check `fail_silently=False` to see actual errors |
| "Rate limit exceeded" | Wait 24 hours or upgrade to Google Workspace |

### Notes
- In development, emails are sent to console if `EMAIL_BACKEND` is set to `console`
- For production, use a dedicated provider (SendGrid, Mailgun) and enable domain authentication
- Always test email sending before deploying to production

---

## 🔐 Google OAuth 2.0

### Purpose
Allow users to sign up and log in using their Google accounts.

### Service
**Google OAuth 2.0** (Free)

### Setup Instructions

#### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a Project"** → **"New Project"**
3. Enter project name: `Puppy CRM`
4. Click **"Create"**

#### 2. Enable Google+ API (or Google Identity)

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"Google Identity Services"**
3. Click the API and press **"Enable"**

#### 3. Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type (for testing) or **"Internal"** (for organization only)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name**: `Puppy CRM`
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **"Save and Continue"**
6. Add scopes (required for basic authentication):
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
   - `openid`
7. Click **"Save and Continue"**
8. Add test users if in testing mode (your email + any testers)
9. Click **"Save and Continue"**

#### 4. Create OAuth 2.0 Credentials for Web

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Select **Application type**: `Web application`
4. **Name**: `Puppy CRM Web Client`
5. **Authorized JavaScript origins**:
   - Development: `http://localhost:5174` (Vite default)
   - Alternative: `http://localhost:3000`
   - Production: `https://yourdomain.com`
6. **Authorized redirect URIs**:
   - Development: `http://localhost:5174`
   - Alternative: `http://localhost:3000`
   - Production: `https://yourdomain.com`
7. Click **"Create"**
8. **Copy** the Client ID and Client Secret

⚠️ **Important for Localhost Testing**:
- Google OAuth works with `http://localhost` during development
- You MUST use `localhost` (not `127.0.0.1`)
- Port must match exactly what you add to Google Console
- For Vite React apps, default is `http://localhost:5174`

#### 5. Create OAuth 2.0 Credentials for Mobile (Optional)

For React Native/Expo apps:

1. Create another OAuth 2.0 Client ID
2. Select **Application type**: 
   - `iOS` for iOS app
   - `Android` for Android app
3. Follow platform-specific setup:
   - **Android**: Add SHA-1 certificate fingerprint
   - **iOS**: Add bundle identifier

See [ENABLE_GOOGLE_OAUTH_MOBILE.md](../ENABLE_GOOGLE_OAUTH_MOBILE.md) for detailed mobile setup.

#### 6. Add to backend/.env

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=1030527056460-xxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
```

⚠️ **Important**: Never commit `.env` file to version control! It contains secrets.

### Configuration (Phase 2.3)

Location: `backend/config/settings.py`

```python
# Google OAuth Settings
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET', default='')
GOOGLE_REDIRECT_URI = config('GOOGLE_REDIRECT_URI', default='http://localhost:3000/auth/google/callback')
```

### API Endpoints

- **POST** `/api/auth/google/login/` - Login existing user with Google
- **POST** `/api/auth/google/signup/` - Create new user with Google

See [API_BLUEPRINT.md](./API_BLUEPRINT.md#-post-apiauthgooglelogin) for detailed endpoint documentation.

### Frontend Integration

#### Install Google Sign-In Library

```bash
npm install @react-oauth/google
```

#### Setup in React (Web)

```jsx
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <GoogleLogin
        onSuccess={credentialResponse => {
          // Send credentialResponse.credential to backend
          fetch('http://localhost:8000/api/auth/google/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: credentialResponse.credential })
          });
        }}
        onError={() => console.log('Login Failed')}
      />
    </GoogleOAuthProvider>
  );
}
```

#### Setup in React Native (Mobile)

```bash
npx expo install expo-auth-session expo-web-browser
```

```jsx
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

function LoginScreen() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: 'YOUR_GOOGLE_CLIENT_ID',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      // Send id_token to backend
      fetch('http://localhost:8000/api/auth/google/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: id_token })
      });
    }
  }, [response]);

  return (
    <Button
      disabled={!request}
      title="Sign in with Google"
      onPress={() => promptAsync()}
    />
  );
}
```

### Security Notes

1. **Token Verification**: Backend verifies every Google token with Google's servers
2. **Email Verification**: Users authenticated via Google have `is_verified=True` automatically
3. **Password**: Users authenticated via Google have unusable password (can't use regular login)
4. **HTTPS Required**: For production, use HTTPS for all OAuth redirects
5. **Token Expiry**: Google ID tokens expire after 1 hour, but our JWT tokens are separate

### Testing

See [TEST_RESULTS.md](../backend/TEST_RESULTS.md) for authentication test results.

### Troubleshooting

| Error | Solution |
|-------|----------|
| "Invalid Google token" | Token expired or malformed. Get new token from frontend |
| "redirect_uri_mismatch" | Add the exact redirect URI to Google Cloud Console |
| "Access blocked: This app's request is invalid" | Configure OAuth consent screen properly |
| "User not found" | User needs to sign up first before login |

---

## 📧 Email Service - Gmail SMTP

### Purpose
Send transactional emails (verification, password reset, notifications, marketing).

### Service
**Gmail SMTP** (Free with Google account)

### Setup Instructions

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account → Security
   - Under "2-Step Verification", select "App passwords"
   - Generate password for "Mail" app
3. **Add to backend/.env**:
   ```env
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   DEFAULT_FROM_EMAIL=your-email@gmail.com
   ```

### Configuration (Phase 6)
Location: `backend/config/settings.py`

```python
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@example.com')
```

### Usage Example
```python
from django.core.mail import send_mail

send_mail(
    subject='Welcome to Puppy CRM',
    message='Thank you for signing up!',
    from_email=settings.DEFAULT_FROM_EMAIL,
    recipient_list=['user@example.com'],
    fail_silently=False,
)
```

### Rate Limits
- **Free Gmail**: 500 emails/day
- **Upgrade Option**: Google Workspace (2000 emails/day)

### Documentation
- [Gmail SMTP Setup](https://support.google.com/a/answer/176600)
- [Django Email Backend](https://docs.djangoproject.com/en/5.0/topics/email/)

---

## 📞 Voice & SMS - Twilio (Phase 7.2)

### Purpose
Make and receive phone calls, send SMS, manage phone numbers, record calls, handle voicemail.

### Service
**Twilio** (Trial account: $15.50 credit, then pay-as-you-go)

### Setup Instructions

#### Step 1: Create Twilio Account

1. **Sign up** at [twilio.com](https://www.twilio.com/try-twilio)
2. **Verify your email** and phone number
3. **Complete account setup** (trial account gets $15.50 credit)

#### Step 2: Get Account Credentials

1. Go to [Twilio Console Dashboard](https://console.twilio.com/)
2. **Account SID**: Found on dashboard (starts with `AC...`)
3. **Auth Token**: Click "Show" to reveal (starts with `...`)
4. **Copy both** - you'll need them for `.env`

#### Step 3: Create API Keys (Optional, for enhanced security)

1. Go to **Account** → **API Keys & Tokens**
2. Click **"Create API Key"**
3. Name: `Puppy CRM API Key`
4. **Copy API Key SID** (starts with `SK...`)
5. **Copy API Secret** (shown only once - save it!)

#### Step 4: Create TwiML App (For Web/Mobile Calls)

1. Go to **Phone Numbers** → **Manage** → **TwiML Apps**
2. Click **"Create new TwiML App"**
3. Name: `Puppy CRM App`
4. **Copy App SID** (starts with `AP...`)

#### Step 5: Configure Webhooks

1. Go to **Phone Numbers** → **Manage** → **Active Numbers**
2. For each number, configure:
   - **Voice Configuration**:
     - A CALL COMES IN: `https://yourdomain.com/api/calls/webhook/incoming/`
     - HTTP Method: `POST`
   - **Status Callback URL**: `https://yourdomain.com/api/calls/webhook/status/`
   - **Status Callback Method**: `POST`
   - **Recording Status Callback URL**: `https://yourdomain.com/api/calls/webhook/recording/`
   - **Recording Status Callback Method**: `POST`

**Note**: For local development, use [ngrok](https://ngrok.com/) to expose your local server:
```bash
ngrok http 8000
# Use the https URL provided by ngrok
```

#### Step 6: Purchase Phone Number

1. Go to **Phone Numbers** → **Buy a Number**
2. Select country (e.g., United States)
3. Select capabilities: **Voice** and **SMS**
4. Click **"Search"**
5. Choose a number and click **"Buy"**
6. Configure webhooks (see Step 5)

#### Step 7: Enable Call Recording

1. Go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Click on your number
3. Under **Voice Configuration**, enable:
   - **Record Calls**: Yes
   - **Recording Status Callback**: Your webhook URL

#### Step 8: Configure Backend

Add to `backend/.env`:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACa9b7df1577d7ebd35dd8a33f30a1da29
TWILIO_AUTH_TOKEN=9d7aff2b898b8858cb98bb617e50a886
TWILIO_API_KEY=SK4f4c04129aef8b1d25883a303e07824a
TWILIO_API_SECRET=b4bRve5DVVUAXWfL5P686b7AucsgeKda
TWILIO_APP_SID=SK4f4c04129aef8b1d25883a303e07824a

# Base URL for webhooks (use ngrok URL for local dev)
BASE_URL=http://localhost:8000
# Or for production:
# BASE_URL=https://yourdomain.com
```

#### Step 9: Install Twilio Python SDK

```bash
pip install twilio==8.10.0
```

### Configuration

Location: `backend/config/settings.py`

```python
# Twilio Settings (Phase 7.2 - Call System)
TWILIO_ACCOUNT_SID = config('TWILIO_ACCOUNT_SID', default='')
TWILIO_AUTH_TOKEN = config('TWILIO_AUTH_TOKEN', default='')
TWILIO_API_KEY = config('TWILIO_API_KEY', default='')
TWILIO_API_SECRET = config('TWILIO_API_SECRET', default='')
TWILIO_APP_SID = config('TWILIO_APP_SID', default='')  # For web/mobile calls

# Base URL for webhooks
BASE_URL = config('BASE_URL', default='http://localhost:8000')
CALL_WEBHOOK_URL = f"{BASE_URL}/api/calls/webhook/incoming/"
STATUS_CALLBACK_URL = f"{BASE_URL}/api/calls/webhook/status/"
RECORDING_CALLBACK_URL = f"{BASE_URL}/api/calls/webhook/recording/"
```

### Service Functions

Location: `backend/apps/calls/services/twilio_service.py`

**Available Functions**:
- `initialize_twilio_client()` - Create Twilio client
- `purchase_phone_number(area_code, country)` - Purchase phone number
- `make_call(from_number, to_number, user_id)` - Initiate outbound call
- `get_call_status(call_sid)` - Fetch and update call status
- `get_recording(recording_sid)` - Get recording URL
- `generate_twiml_response(action, **kwargs)` - Generate TwiML XML
- `get_available_numbers(area_code, country)` - Search available numbers

### Webhook Handlers

Location: `backend/apps/calls/webhooks.py`

**Webhook Endpoints**:
- `POST /api/calls/webhook/incoming/` - Handle incoming calls
- `POST /api/calls/webhook/status/` - Handle status updates
- `POST /api/calls/webhook/recording/` - Handle recording ready

**Security**: All webhooks verify Twilio signature using `RequestValidator`

### Usage Examples

**Purchase Phone Number**:
```python
from apps.calls.services.twilio_service import purchase_phone_number

phone_number = purchase_phone_number(
    area_code='415',
    country='US',
    company_id=1,
    user_id=1
)
```

**Make Outbound Call**:
```python
from apps.calls.services.twilio_service import make_call

call = make_call(
    from_number='+1234567890',
    to_number='+1987654321',
    user_id=1,
    company_id=1,
    lead_id=5,  # Optional
    record=True
)
```

**Generate TwiML**:
```python
from apps.calls.services.twilio_service import generate_twiml_response

# Connect to user
twiml = generate_twiml_response(
    'connect',
    client_identity='user123'
)

# Record voicemail
twiml = generate_twiml_response(
    'record_voicemail',
    max_length=120,
    transcribe=True
)
```

### Testing with Twilio Test Credentials

Twilio provides test credentials for development:

**Test Account SID**: `AC...` (from console)  
**Test Auth Token**: `...` (from console)

**Test Phone Numbers**:
- Inbound: `+15005550006` (always answers)
- Outbound: `+15005550006` (always answers)
- Voicemail: `+15005550001` (goes to voicemail)

**Example Test Call**:
```python
# Use test credentials
client = Client(test_account_sid, test_auth_token)
call = client.calls.create(
    to='+15005550006',  # Test number
    from_='+15005550006',
    url='http://demo.twilio.com/docs/voice.xml'
)
```

### Rate Limits (Trial Account)

- **SMS**: Only to verified numbers
- **Voice**: Only to verified numbers
- **Phone Numbers**: Limited to 1 number
- **Upgrade**: Remove restrictions after adding payment method

### Pricing (After Trial)

**Phone Numbers**:
- US Local: $1.00/month
- US Toll-Free: $2.00/month
- International: Varies by country

**Voice Calls**:
- US Outbound: $0.0130/minute
- US Inbound: $0.0085/minute
- International: Varies by country

**SMS**:
- US Outbound: $0.0079/message
- US Inbound: $0.0079/message
- International: Varies by country

**Recordings**:
- Storage: $0.0025/minute
- Transcription: $0.05/minute

### Security Best Practices

1. **Never expose Auth Token** in frontend code
2. **Use API Keys** for enhanced security (can be rotated)
3. **Verify webhook signatures** (already implemented)
4. **Use HTTPS** for webhook URLs in production
5. **Rotate credentials** periodically

### Troubleshooting

| Error | Solution |
|-------|----------|
| "Invalid Account SID" | Check Account SID in `.env` matches console |
| "Authentication failed" | Verify Auth Token is correct |
| "Webhook not receiving" | Check ngrok is running (local) or URL is accessible (production) |
| "Signature verification failed" | Ensure webhook URL matches exactly what's in Twilio console |
| "Number not found" | Verify phone number is active in Twilio console |

### Documentation

- [Twilio Python SDK](https://www.twilio.com/docs/libraries/python)
- [Twilio Voice API](https://www.twilio.com/docs/voice/api)
- [TwiML Reference](https://www.twilio.com/docs/voice/twiml)
- [Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)
- [Twilio Pricing](https://www.twilio.com/pricing)

---

## 🐛 Issue Tracking - GitHub Issues API

### Purpose
Sync bugs/tasks with GitHub repository issues.

### Service
**GitHub Issues API** (Free with GitHub account)

### Setup Instructions

1. **Create Personal Access Token**:
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Generate new token (classic)
   - Scopes: `repo`, `read:org`
2. **Add to backend/.env**:
   ```env
   GITHUB_TOKEN=ghp_your_personal_access_token
   GITHUB_REPO_OWNER=your-username
   GITHUB_REPO_NAME=your-repo-name
   ```

### Installation (Phase 11)
```bash
pip install PyGithub
```

### Configuration
Location: `backend/config/settings.py`

```python
GITHUB_TOKEN = config('GITHUB_TOKEN', default='')
GITHUB_REPO_OWNER = config('GITHUB_REPO_OWNER', default='')
GITHUB_REPO_NAME = config('GITHUB_REPO_NAME', default='')
```

### Usage Example
```python
from github import Github
from django.conf import settings

g = Github(settings.GITHUB_TOKEN)
repo = g.get_repo(f"{settings.GITHUB_REPO_OWNER}/{settings.GITHUB_REPO_NAME}")

# Create issue
issue = repo.create_issue(
    title='Bug: Login not working',
    body='User reported login issue on mobile app',
    labels=['bug', 'mobile']
)

# List issues
issues = repo.get_issues(state='open')
for issue in issues:
    print(issue.title)
```

### Rate Limits
- **Authenticated**: 5,000 requests/hour
- **Unauthenticated**: 60 requests/hour

### Documentation
- [GitHub REST API](https://docs.github.com/en/rest)
- [PyGithub Documentation](https://pygithub.readthedocs.io/)

---

## 🔐 Authentication - Google OAuth 2.0

### Purpose
Allow users to sign in with their Google account.

### Service
**Google OAuth 2.0** (Free)

### Setup Instructions

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project
2. **Enable Google+ API**:
   - APIs & Services → Library → Google+ API → Enable
3. **Create OAuth Credentials**:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:8000/api/auth/google/callback/`
     - `https://yourdomain.com/api/auth/google/callback/`
4. **Add to backend/.env**:
   ```env
   GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
   ```

5. **Add to frontend-web/.env**:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

6. **Add to mobile-app/.env**:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

### Installation (Phase 2)

**Backend**:
```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2
```

**Frontend Web**:
```bash
npm install @react-oauth/google
```

**Mobile**:
```bash
npm install expo-auth-session expo-crypto
```

### Configuration

**Backend** (`backend/config/settings.py`):
```python
GOOGLE_OAUTH_CLIENT_ID = config('GOOGLE_OAUTH_CLIENT_ID', default='')
GOOGLE_OAUTH_CLIENT_SECRET = config('GOOGLE_OAUTH_CLIENT_SECRET', default='')
```

**Frontend Web** (`frontend-web/src/main.jsx`):
```javascript
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

<GoogleOAuthProvider clientId={clientId}>
  <App />
</GoogleOAuthProvider>
```

### Usage Example

**Backend** (`backend/apps/users/views.py`):
```python
from google.oauth2 import id_token
from google.auth.transport import requests

def verify_google_token(token):
    try:
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            settings.GOOGLE_OAUTH_CLIENT_ID
        )
        return idinfo
    except ValueError:
        return None
```

**Frontend Web**:
```javascript
import { GoogleLogin } from '@react-oauth/google';

<GoogleLogin
  onSuccess={(credentialResponse) => {
    // Send token to backend
    api.post('/auth/google/', { token: credentialResponse.credential });
  }}
  onError={() => console.log('Login Failed')}
/>
```

### Rate Limits
- **Queries per day**: 10,000 (default)
- **Queries per 100 seconds per user**: 100

### Documentation
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [React OAuth Google](https://www.npmjs.com/package/@react-oauth/google)
- [Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/)

---

## 🔔 Push Notifications - Firebase Cloud Messaging (FCM)

### Purpose
Send push notifications to mobile app users.

### Service
**Firebase Cloud Messaging** (Free)

### Setup Instructions (Phase 9)

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Add project
2. **Add App**:
   - Add iOS app (bundle ID)
   - Add Android app (package name)
   - Download config files
3. **Get Server Key**:
   - Project Settings → Cloud Messaging → Server key
4. **Add to backend/.env**:
   ```env
   FCM_SERVER_KEY=your-server-key
   ```

### Installation

**Backend**:
```bash
pip install pyfcm
```

**Mobile**:
```bash
npm install expo-notifications
```

### Configuration

**Backend**:
```python
from pyfcm import FCMNotification

push_service = FCMNotification(api_key=settings.FCM_SERVER_KEY)

result = push_service.notify_single_device(
    registration_id='device-token',
    message_title='New Lead',
    message_body='John Doe submitted a contact form'
)
```

**Mobile** (`mobile-app/App.js`):
```javascript
import * as Notifications from 'expo-notifications';

// Request permission
const { status } = await Notifications.requestPermissionsAsync();

// Get device token
const token = (await Notifications.getExpoPushTokenAsync()).data;
```

### Rate Limits
- **Free**: Unlimited messages

### Documentation
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)

---

## 📊 Analytics - Google Analytics

### Purpose
Track user behavior and app usage.

### Service
**Google Analytics 4** (Free)

### Setup Instructions (Phase 16)

1. **Create GA4 Property**:
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create property
2. **Get Measurement ID**:
   - Copy Measurement ID (G-XXXXXXXXXX)
3. **Add to frontend-web/.env**:
   ```env
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### Installation

**Frontend Web**:
```bash
npm install react-ga4
```

**Mobile**:
```bash
npm install expo-firebase-analytics
```

### Usage Example

**Frontend Web**:
```javascript
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');
ReactGA.send({ hitType: 'pageview', page: window.location.pathname });
```

### Documentation
- [Google Analytics 4](https://support.google.com/analytics/answer/10089681)
- [React GA4](https://github.com/PriceRunner/react-ga4)

---

## 💳 Payment Processing - Stripe (Future)

### Purpose
Handle subscription payments (Phase 3+ feature).

### Service
**Stripe** (Transaction fees apply)

### Setup Instructions (Future Phase)

1. **Sign up** at [stripe.com](https://stripe.com/)
2. **Get API Keys**:
   - Publishable key
   - Secret key
3. **Add to .env files**

### Pricing
- **Transaction Fee**: 2.9% + $0.30 per transaction

### Documentation
- [Stripe API](https://stripe.com/docs/api)

---

## 🌍 Environment Variables Summary

### Backend (.env)
```env
# Database
DATABASE_NAME=puppy_crm
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Django
SECRET_KEY=your-secret-key
DEBUG=True

# Email (Phase 6)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Twilio (Phase 7)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# GitHub (Phase 11)
GITHUB_TOKEN=ghp_your_token
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=your-repo

# Google OAuth (Phase 2)
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret

# Firebase (Phase 9)
FCM_SERVER_KEY=your-server-key
```

### Frontend Web (.env)
```env
VITE_API_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Mobile App (.env)
```env
API_URL=http://localhost:8000/api
GOOGLE_CLIENT_ID=your-client-id
```

---

## 🔒 Security Best Practices

1. **Never commit .env files** to version control
2. **Rotate API keys** regularly
3. **Use environment-specific keys** (dev, staging, prod)
4. **Restrict API key permissions** to minimum required
5. **Monitor API usage** for suspicious activity
6. **Enable IP whitelisting** where possible

---

## 📝 Cost Estimation (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| Gmail SMTP | Free | $0 |
| Twilio | Pay-as-you-go | ~$10-50 |
| GitHub API | Free | $0 |
| Google OAuth | Free | $0 |
| Firebase | Free (Spark) | $0 |
| Google Analytics | Free | $0 |
| PostgreSQL (Heroku) | Hobby | $5 |
| Hosting (Vercel) | Hobby | $0 |
| **Total** | | **~$15-55/month** |

---

**Last Updated**: November 14, 2025  
**Next API Integration**: Phase 2 (Google OAuth)
