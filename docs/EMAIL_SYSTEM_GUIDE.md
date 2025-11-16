# 📧 Email System Guide

## Overview

Puppy CRM includes a complete email system with account management, threading, templates, AI categorization, tracking, and mobile support. This guide covers setup, usage, and best practices.

---

## 🚀 Quick Start

### 1. Connect an Email Account

**Web**: Navigate to Email → Accounts → "+ Add Account"  
**Mobile**: Open drawer → Accounts → "+"

Choose one of:
- **Gmail OAuth**: Secure Google authorization (recommended)
- **SMTP/IMAP**: Any provider (Gmail, Outlook, custom)

### 2. Send Your First Email

**Web**: Click "Compose" button (✉) in inbox  
**Mobile**: Tap FAB (floating action button) in inbox

Fill in recipient, subject, body → Send

### 3. View Inbox

Emails are automatically synced and organized into threads. Use category tabs to filter by Lead, Deal, Customer, etc.

---

## 🔧 Setup Guide

### Gmail OAuth Setup

#### Prerequisites
- Google Cloud Project with Gmail API enabled
- OAuth 2.0 Client ID configured
- Authorized redirect URIs added

#### Backend Configuration

Add to `backend/.env`:
```env
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-...
GMAIL_REDIRECT_URI=http://localhost:3000/email-inbox
```

#### Frontend Configuration

Web (`frontend-web/.env`):
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Mobile (`mobile-app/.env`):
```env
EXPO_PUBLIC_API_BASE=http://127.0.0.1:8000/api
```

#### Authorization Flow

1. User clicks "Connect Gmail"
2. Redirected to Google OAuth consent screen
3. User grants permissions
4. Callback exchanges code for tokens
5. Account saved with encrypted tokens
6. Initial sync starts automatically

### SMTP/IMAP Setup

#### Gmail App Password

1. Enable 2-Step Verification in Google Account
2. Generate App Password: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Copy 16-character password (no spaces)

#### Add Account

- **Email**: your.email@gmail.com
- **Provider**: smtp
- **SMTP Host**: smtp.gmail.com
- **SMTP Port**: 587
- **IMAP Host**: imap.gmail.com (optional for sync)
- **IMAP Port**: 993
- **Username**: your.email@gmail.com
- **Password**: App Password (16 chars)

#### Other Providers

**Outlook/Office 365**:
- SMTP: smtp.office365.com:587
- IMAP: outlook.office365.com:993

**Yahoo**:
- SMTP: smtp.mail.yahoo.com:587
- IMAP: imap.mail.yahoo.com:993

**Custom Domain**:
- Check your hosting provider for SMTP/IMAP settings

---

## 📨 Using the Email System

### Inbox Features

**Category Tabs**:
- All: Every email
- Primary: General correspondence
- Lead: Linked to leads
- Deal: Deal-related
- Customer: Customer support
- Complaint: Flagged complaints

**Thread Actions**:
- **Star**: Mark important threads
- **Read/Unread**: Toggle read status
- **Delete**: Remove thread (swipe left on mobile)
- **Archive**: Mark read (swipe right on mobile)

**Search**: Type in search bar to find emails by subject/body

**Filters**: Filter by account, read status, starred, date range

### Composing Emails

**Rich Text Editor** (web):
- Bold, italic, underline
- Lists (bullet/numbered)
- Links
- Text formatting

**Basic Editor** (mobile Phase 6.9):
- Plain text input
- Template insertion

**Enhanced Editor** (mobile Phase 6.10):
- Rich text toolbar
- Contact picker with search
- Template modal with preview
- Image/file attachments from gallery
- Camera integration for photos
- AI reply suggestions

**Features**:
- **To/Cc/Bcc**: Add multiple recipients
- **Subject**: Email subject line
- **Body**: Compose message
- **Templates**: Select pre-made templates
- **Attachments**: Add files (web + mobile 6.10)
- **Link to Records**: Associate with Lead/Deal/Customer
- **Save Draft**: Auto-saves every 30s (web), manual (mobile)
- **Minimize**: Draft saved to localStorage (web)

### Replying to Emails

**Thread View**:
1. Open thread
2. Click "Reply" button (web) or "Quick Reply" (mobile)
3. Compose response
4. Send

**Reply Features**:
- Subject auto-prefixed with "Re:"
- Original message quoted (web)
- Thread maintained for conversation history
- AI suggestion available (click "AI Suggest Reply")

### Email Templates

**Create Template**:
1. Navigate to Templates page
2. Click "+ New Template"
3. Fill in:
   - Name: Template identifier
   - Category: Organize templates
   - Subject: Default subject (supports variables)
   - Body: HTML or text (supports variables)
4. Save

**Template Variables**:
- `{{customer_name}}`: Customer/contact name
- `{{company_name}}`: Your company name
- `{{deal_title}}`: Deal title
- `{{custom_field}}`: Any custom field

**Using Templates**:
- **Compose**: Click "Templates" button, select template
- **Mobile**: Tap "Tpl" header button or use Template Picker Modal (6.10)
- Variables auto-filled from context (lead/deal/customer)

**Template Actions**:
- **Preview**: See rendered template with sample data
- **Edit**: Modify template content
- **Duplicate**: Copy template as starting point
- **Delete**: Remove template (confirmation required)

### AI Features

**Email Categorization**:
- Automatically categorizes incoming emails
- Categories: Primary, Lead, Deal, Customer, Complaint
- Powered by OpenAI/Anthropic
- Configure: Set `EMAIL_AI_ENABLED=True` in backend `.env`

**Reply Suggestions**:
- Click "AI Suggest Reply" in thread view
- AI generates context-aware response
- Edit suggestion before sending
- Requires OpenAI API key in `.env`

**Sentiment Analysis** (optional):
- Detects email tone (positive, neutral, negative)
- Shown as badge in thread list

### Email Tracking

**Open Tracking**:
- Invisible pixel embedded in sent emails
- Records when recipient opens email
- View open count and timestamps in sent folder

**Link Click Tracking**:
- Tracks clicks on links in your emails
- Replaces links with tracking URLs
- View click analytics per email

**Tracking Data**:
- Open rate by recipient
- Click-through rate
- Engagement timeline
- Best time to send insights

### Automation Rules (Optional)

**Rule Engine**:
- Trigger: Email received matching criteria
- Condition: Subject contains, from address, etc.
- Action: Move to folder, assign category, create task

**Example Rules**:
- "support" in subject → Category: Customer
- from known lead → Category: Lead, create follow-up task
- "urgent" or "complaint" → Category: Complaint, notify team

---

## 📱 Mobile Email Features

### Phase 6.9 - Mobile Inbox

**Inbox Screen**:
- Header with drawer menu, search, compose FAB
- Horizontal category tabs
- Thread list with swipe actions
- Pull-to-refresh sync
- Unread indicators & star icons

**Thread Screen**:
- Message list with HTML rendering
- Sender info & timestamps
- Attachments display
- Reply/Forward buttons
- Quick reply bar at bottom
- AI suggestion button

**Compose Screen** (basic):
- To/Cc/Bcc fields
- Subject & body inputs
- Template selector button (loads first template)
- Send & save draft

**Accounts Screen**:
- List connected accounts
- Sync status indicators
- Manual sync buttons
- Set default account
- Add account button

**Drawer Navigation**:
- Inbox, Sent, Starred, Drafts
- Categories, Templates
- Accounts, Settings

### Phase 6.10 - Enhanced Compose

**Rich Text Editor**:
- Bold, italic, underline formatting
- Bullet & numbered lists
- Insert links
- Native toolbar

**Contact Picker**:
- Search leads, deals, customers
- Recent contacts list
- Multi-select with checkmarks
- Type badges (Lead/Deal/Customer)

**Template Picker Modal**:
- Browse templates by category
- Preview template before applying
- Variable preview with sample data
- One-tap apply to compose

**Attachments**:
- Gallery picker for images/files
- Camera integration for photos
- Attachment list with remove option
- File upload on send (FormData multipart)

**AI Reply Suggestion**:
- Available when replying
- "✨ AI Suggest Reply" button
- Displays suggestion in green box
- "Apply Suggestion" to insert
- Edit before sending

---

## 🔒 Security & Best Practices

### Email Credentials

**Encryption**:
- All passwords & OAuth tokens encrypted with Fernet
- Encryption key stored in backend `.env`
- Generate key: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`

**Storage**:
- Passwords never logged or exposed in API responses
- OAuth tokens refreshed automatically
- Secure transmission over HTTPS (production)

### Permissions

**Role-Based Access**:
- CEO/Manager: View all company emails
- Sales Manager: View team emails
- Support Staff: View assigned customer emails

**Account Ownership**:
- Users can only access their own connected accounts
- Company accounts shared via explicit invitation

### Data Privacy

**GDPR Compliance**:
- Email data encrypted at rest
- User can delete account & all emails
- Export email data as JSON/CSV
- Consent required for tracking pixels

**Email Retention**:
- Configure retention policy in settings
- Auto-delete emails older than X days (optional)
- Archive vs. permanent delete options

---

## 🛠️ Troubleshooting

### Connection Issues

**Gmail OAuth "Access Denied"**:
- Ensure Gmail API enabled in Google Cloud Console
- Check OAuth consent screen configured
- Verify redirect URI matches exactly
- Request `gmail.readonly` and `gmail.send` scopes

**SMTP Authentication Failed**:
- Use App Password, not regular password
- Enable "Less secure app access" (not recommended)
- Check SMTP host/port correct
- Verify TLS/SSL settings

**IMAP Sync Not Working**:
- Ensure IMAP enabled in Gmail settings
- Check firewall not blocking port 993
- Verify IMAP host/port correct
- Test with telnet: `telnet imap.gmail.com 993`

### Sync Issues

**Emails Not Appearing**:
- Check account active & sync enabled
- Manually trigger sync from accounts page
- Review Celery worker logs for errors
- Verify Redis connection working

**Slow Sync**:
- Large mailbox (>10k emails) takes time on initial sync
- Subsequent syncs only fetch new messages
- Consider sync frequency setting (default 15 min)

**Duplicate Emails**:
- Check Message-ID deduplication working
- Review sync task logs for errors
- Clear cache and re-sync

### Sending Issues

**Emails Not Sending**:
- Check Celery worker running: `celery -A config worker -l info`
- Review send task in Celery logs
- Verify SMTP credentials correct
- Test SMTP with `telnet smtp.gmail.com 587`

**Emails Going to Spam**:
- Set up SPF record for your domain
- Configure DKIM signing
- Use consistent From address
- Avoid spam trigger words

**Rate Limits**:
- Gmail: 500 emails/day (free), 2000/day (Workspace)
- Add delays between sends in automation
- Use dedicated SMTP for bulk emails

### Template Issues

**Variables Not Replaced**:
- Check variable syntax: `{{variable_name}}`
- Ensure context passed when rendering
- Verify variable exists in context dict
- Use preview to test before sending

**HTML Not Rendering**:
- Check HTML valid (use validator)
- Test in preview mode first
- Some clients block inline CSS
- Use table-based layouts for compatibility

### Mobile Issues

**Navigation Errors**:
- Install dependencies: `npm install` in mobile-app
- Ensure drawer & stack navigators imported
- Check screen names match route params
- Review React Navigation setup

**Rich Editor Not Working**:
- Verify `react-native-pell-rich-editor` installed
- Check ref passed correctly: `ref={richText}`
- Ensure editor initialized before calling methods
- Test on device, not just simulator

**HTML Rendering Issues**:
- Install `react-native-render-html`
- Provide contentWidth prop (device width)
- Check HTML valid (no unclosed tags)
- Use `defaultWebViewProps` for security

---

## 📊 Performance Optimization

### Sync Optimization

**Strategies**:
- Fetch only new emails using UID/date filters
- Batch insert emails in chunks (100-500)
- Index Message-ID for fast duplicate checks
- Cache last sync timestamp per account

**Celery Configuration**:
```python
# settings.py
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_TIMEZONE = 'UTC'

# tasks.py
@shared_task(bind=True, max_retries=3, rate_limit='10/m')
def sync_email_account_task(self, account_id):
    # Sync logic with retry on failure
```

### Frontend Performance

**Web**:
- Virtualized lists for large inboxes (react-window)
- Pagination (50 threads per page)
- Debounced search (300ms delay)
- Lazy load thread details
- Draft auto-save debounced (30s)

**Mobile**:
- FlatList with `initialNumToRender={15}`
- Pull-to-refresh only fetches new data
- AsyncStorage caching for offline mode
- Optimistic UI updates for instant feedback

### Database Optimization

**Indexes**:
```python
class Email(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=['-sent_at']),  # Thread ordering
            models.Index(fields=['message_id']),  # Deduplication
            models.Index(fields=['email_account', 'status']),  # Filtering
            models.Index(fields=['is_read', 'is_starred']),  # Quick filters
        ]
```

**Query Optimization**:
- `select_related()` for account/thread joins
- `prefetch_related()` for emails in thread
- Aggregate counts at database level
- Cache frequently accessed data (Redis)

---

## 🔗 API Endpoints Reference

See [API_BLUEPRINT.md](./API_BLUEPRINT.md) for complete endpoint documentation.

**Key Endpoints**:
- `POST /api/emails/accounts/` - Add account
- `GET /api/emails/inbox/` - List threads
- `POST /api/emails/send/` - Send email
- `POST /api/emails/{id}/reply/` - Reply to email
- `GET /api/emails/templates/` - List templates
- `POST /api/emails/{id}/suggest-reply/` - AI suggestion

---

## 📚 Additional Resources

- **Gmail API Docs**: https://developers.google.com/gmail/api
- **Django Email Docs**: https://docs.djangoproject.com/en/4.2/topics/email/
- **Celery Docs**: https://docs.celeryproject.org/
- **React Navigation**: https://reactnavigation.org/
- **React Native Render HTML**: https://github.com/meliorence/react-native-render-html

---

**Last Updated**: November 16, 2025  
**Phase**: 6 - Email System Complete ✅
