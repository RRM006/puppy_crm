# 🔌 API Blueprint

## Base URL
- **Development**: `http://localhost:8000/api`
- **Production**: TBD

---

## 🔐 Authentication

All protected endpoints require a JWT access token in the Authorization header:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### JWT Token Format

**Access Token** (1 hour lifetime):
```json
{
  "token_type": "access",
  "exp": 1700000000,
  "iat": 1699996400,
  "jti": "abc123...",
  "user_id": 1
}
```

**Refresh Token** (7 days lifetime):
```json
{
  "token_type": "refresh",
  "exp": 1700604400,
  "iat": 1699996400,
  "jti": "xyz789...",
  "user_id": 1
}
```

### Token Refresh Flow

When you receive a `401 Unauthorized` response:
1. Call `/api/auth/token/refresh/` with the refresh token
2. Receive a new access token
3. Retry the original request with the new token
4. If refresh fails, redirect to login

### Error Responses

**401 Unauthorized** (Missing or invalid token):
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**401 Unauthorized** (Token expired):
```json
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
```

**403 Forbidden** (Valid token, insufficient permissions):
```json
{
  "detail": "You do not have permission to perform this action."
}
```

---

## 📋 Table of Contents
- [Phase 1: Health Check](#phase-1-health-check)
- [Phase 2: Authentication](#phase-2-authentication)
- [Phase 3: User Management](#phase-3-user-management)
- [Phase 4: Lead Management](#phase-4-lead-management)
- [Phase 5: Deal Management](#phase-5-deal-management)
- [Phase 4.5: Activity Management](#phase-45-activity-management-implemented)
- [Phase 5: Customer Management](#phase-5-customer-management-implemented)
- [Phase 5: Order Management](#phase-5-order-management-implemented)
- [Phase 5: Customer Portal](#phase-5-customer-portal-implemented)
- [Phase 6: Communication](#phase-6-communication)
- [Reports & Analytics](#reports--analytics)
- [Phase 9: Notifications](#phase-9-notifications)
- [Phase 6 (Email): Accounts](#phase-6-email-accounts)
- [Phase 6 (Email): Inbox & Sending](#phase-6-email-inbox--sending)
- [Phase 6 (Email): Templates](#phase-6-email-templates)
- [Phase 6 (Email): Tracking](#phase-6-email-tracking)
- [Phase 6 (Email): AI](#phase-6-email-ai)
---

## Phase 6 (Email): Accounts

**Status**: IMPLEMENTED (Phase 6.2 & 6.3)  
**Purpose**: Manage user/company email accounts (SMTP/IMAP/Gmail OAuth) and trigger sync.

### 🔒 GET `/api/emails/accounts/`
List authenticated user's email accounts.

**Response (200)**:
```json
[
  {
    "id": 3,
    "email": "user@company.com",
    "provider": "smtp",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "imap_host": "",
    "imap_port": null,
    "username": "user@company.com",
    "is_active": true,
    "is_default": true,
    "sync_enabled": true,
    "last_sync": "2025-11-16T12:00:00Z",
    "unread_count": 12,
    "password": "********"
  }
]
```

### 🔒 POST `/api/emails/accounts/`
Create SMTP/IMAP account.

**Request**:
```json
{
  "email": "user@company.com",
  "provider": "smtp",
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "username": "user@company.com",
  "password": "app-password"
}
```
**Response (201)**: Account object (same fields as list). Starts async initial sync.

### 🔒 POST `/api/emails/{emailId}/reply/`
Reply to email (creates new email in same thread).

**Request**:
```json
{
  "to": "recipient@example.com",
  "subject": "Re: Original Subject",
  "body_text": "Reply text",
  "body_html": "<p>Reply HTML</p>"
}
```
**Response (201)**: Email object with `thread_id` linking to parent.

### 🔒 POST `/api/emails/search/?q=query`
Search emails by subject/body text.

**Response (200)**: List of matching threads.

### 🔒 GET `/api/emails/categories/`
Get category distribution for user's emails.

**Response (200)**:
```json
{
  "categories": [
    {"category": "primary", "count": 45},
    {"category": "lead", "count": 12},
    {"category": "deal", "count": 8}
  ]
}
```

---

## Phase 6 (Email): Templates

**Status**: IMPLEMENTED (Phase 6.5)  
**Purpose**: Email templates with variables for reusable content.

### 🔒 GET `/api/emails/templates/?category=sales&search=welcome`
List templates with optional filters.

**Response (200)**:
```json
[
  {
    "id": 5,
    "name": "Welcome Email",
    "subject": "Welcome {{customer_name}}!",
    "body_html": "<p>Hi {{customer_name}},</p><p>Welcome to {{company_name}}!</p>",
    "body_text": "Hi {{customer_name}}, Welcome to {{company_name}}!",
    "category": "onboarding",
    "usage_count": 23,
    "created_by": 1,
    "created_at": "2025-11-01T10:00:00Z",
    "updated_at": "2025-11-15T14:30:00Z"
  }
]
```

### 🔒 POST `/api/emails/templates/`
Create new template.

**Request**:
```json
{
  "name": "Follow-up Template",
  "subject": "Following up on {{deal_title}}",
  "body_html": "<p>Hi {{customer_name}},</p><p>Just checking in about {{deal_title}}.</p>",
  "category": "sales"
}
```
**Response (201)**: Template object.

### 🔒 GET `/api/emails/templates/{id}/`
Retrieve template details.

### 🔒 PUT `/api/emails/templates/{id}/`
Update template content.

### 🔒 DELETE `/api/emails/templates/{id}/`
Delete template.

### 🔒 POST `/api/emails/templates/{id}/duplicate/`
Duplicate template with " Copy" suffix.

**Response (201)**: New template object.

### 🔒 POST `/api/emails/templates/preview/`
Render template with variables.

**Request**:
```json
{
  "template_id": 5,
  "context": {
    "customer_name": "John Doe",
    "company_name": "ACME Corp",
    "deal_title": "Enterprise License"
  }
}
```
**Response (200)**:
```json
{
  "subject": "Welcome John Doe!",
  "body_html": "<p>Hi John Doe,</p><p>Welcome to ACME Corp!</p>",
  "body_text": "Hi John Doe, Welcome to ACME Corp!"
}
```

---

## Phase 6 (Email): Tracking

**Status**: IMPLEMENTED (Phase 6.4)  
**Purpose**: Track email opens and link clicks for engagement analytics.

### 🌐 GET `/api/emails/track/open/{token}/`
Pixel endpoint for open tracking (public, no auth).

**Response**: 1x1 transparent GIF, records open timestamp.

### 🌐 GET `/api/emails/track/click/{token}/`
Link redirect endpoint for click tracking (public, no auth).

**Response**: HTTP 302 redirect to original URL, records click timestamp.

**Token Format**: JWT-like signed token containing email_id and link_url (encrypted).

---

## Phase 6 (Email): AI

**Status**: IMPLEMENTED (Phase 6.5)  
**Purpose**: AI-powered email categorization and reply suggestions.

### 🔒 POST `/api/emails/{emailId}/suggest-reply/`
Generate AI reply suggestion for an email.

**Request**: None (email context pulled from database).

**Response (200)**:
```json
{
  "suggested_reply": "Thank you for reaching out. I've reviewed your request and will get back to you by end of day with a detailed proposal."
}
```

**Configuration**:
- Requires `EMAIL_AI_ENABLED=True` and `OPENAI_API_KEY` in backend `.env`
- Uses OpenAI GPT-4 or Anthropic Claude
- Analyzes email content, sender history, and CRM context

---

## Email System Architecture

**Async Processing**:
- Celery tasks for sync and send operations
- Redis as message broker and result backend
- Retry logic with exponential backoff
- Task monitoring via Celery Flower (optional)

**Security**:
- Fernet encryption for passwords and OAuth tokens
- JWT tokens for API authentication
- HTTPS required in production
- CSRF protection for web forms

**Performance**:
- Pagination (50 threads per page)
- Database indexes on sent_at, message_id, status
- Redis caching for frequently accessed data
- Debounced search and draft auto-save

**Monitoring**:
- Celery task logs for sync/send status
- Email tracking analytics dashboard
- Error notifications for failed sends
- Sync health indicators per account

---

### 🔒 GET `/api/emails/accounts/{id}/`
Retrieve account details.

### 🔒 PUT `/api/emails/accounts/{id}/`
Update account settings (activation, sync flags, host changes).

### 🔒 DELETE `/api/emails/accounts/{id}/`
Soft delete/deactivate account.

### 🔒 POST `/api/emails/accounts/{id}/sync/`
Queue an immediate sync task. Returns `{"status": "queued"}`.

### 🔒 POST `/api/emails/accounts/{id}/set-default/`
Set account as default for sending.

### 🔒 GET `/api/emails/connect-gmail/`
Get Gmail OAuth authorization URL.

### 🔒 GET `/api/emails/gmail-callback/?code=...`
Exchange code → create Gmail account. Starts initial sync.

---

## Phase 6 (Email): Inbox & Sending

**Status**: IMPLEMENTED (Phase 6.4)  
**Purpose**: Thread listing, message viewing, sending, replying, marking, basic search stub.

### 🔒 GET `/api/emails/inbox/?page=1`
List threads ordered by `last_message_at`.

**Thread Object**:
```json
{
  "id": 10,
  "subject": "Follow-up Meeting",
  "participants": ["a@x.com", "b@y.com"],
  "last_message_at": "2025-11-16T12:15:00Z",
  "message_count": 3,
  "is_read": false,
  "is_starred": false,
  "category": "primary",
  "sentiment": null
}
```

### 🔒 GET `/api/emails/threads/{id}/`
Returns thread + embedded emails (chronological).

### 🔒 POST `/api/emails/send/`
Queue outbound email send.

**Request**:
```json
{
  "to_emails": ["lead@example.com"],
  "subject": "Welcome",
  "body_html": "<p>Hello!</p>"
}
```
**Response (201)**: Full Email record. Sending handled asynchronously.

### 🔒 POST `/api/emails/{id}/reply/` *(Future)*
Reply to an existing email. Creates outbound email in same thread.

**Request**:
```json
{
  "to_emails": ["lead@example.com"],
  "body_html": "<p>Following up...</p>"
}
```
Subject auto-prefixed with `Re:` if not provided. Returns new Email object.

### 🔒 POST `/api/emails/threads/{id}/mark-read/`
Mark entire thread (and its emails) as read.

### 🔒 POST `/api/emails/threads/{id}/star/`
Toggle starred flag.

### 🔒 DELETE `/api/emails/emails/{id}/`
Soft delete an email (marks status failed placeholder).

### 🔒 GET `/api/emails/search/?q=...` *(Future)*
Search threads by subject or message content (basic contains match).

**Response**: List of thread objects matching query.

### 🔒 GET `/api/emails/categories/` *(Future)*
Return counts per category.

**Response**:
```json
{
  "categories": [
    {"category": "primary", "count": 12},
    {"category": "customer", "count": 5}
  ]
}
```

---

## Phase 6 (Email): Templates

**Status**: IMPLEMENTED (Phase 6.5)  
Create, update, preview, duplicate & render variable-driven email templates.

### 🔒 GET/POST `/api/emails/templates/`
List or create templates (filter by `?category=` and search by `?search=`).

**Create Request**:
```json
{
  "name": "Welcome Email",
  "subject": "Welcome to {company_name}",
  "body_html": "<p>Hello {customer_name}</p>",
  "category": "customer"
}
```
**Validation Error**: Unknown variables → `{ "variables": "Invalid variables: bad_var" }`

### 🔒 GET/PUT/DELETE `/api/emails/templates/{id}/`
Retrieve, update or delete template.

### 🔒 POST `/api/emails/templates/{id}/duplicate/`
Creates copy named `OriginalName Copy`.

### 🔒 POST `/api/emails/templates/preview/`
Preview rendered output.

**Request**:
```json
{
  "template_id": 12,
  "sample_data": { "customer_name": "Alice" }
}
```
**Response**:
```json
{
  "subject": "Welcome to Acme Corp",
  "body_html": "<p>Hello Alice</p>",
  "body_text": "Hello Alice"
}
```

### Variable System
Supported variables: `{customer_name}`, `{company_name}`, `{user_name}`, `{lead_name}`, `{deal_title}`, `{order_number}`.
Unspecified variables render as empty strings.


---

## Phase 6 (Email): Tracking

**Status**: IMPLEMENTED (Phase 6.4)  
Open & click tracking via pixel/link tokens.

### Public GET `/api/emails/track/open/{token}/`
Increments `opens_count`, sets `opened_at` first time.

### Public GET `/api/emails/track/click/{token}/`
Increments `clicks_count`, sets `clicked_at` first time, redirects.

Token format is base64-encoded internal identifier; no PII exposed.

---

## Phase 6 (Email): AI

**Status**: IMPLEMENTED (Phase 6.6 skeleton)  
Optional AI categorization & reply suggestions using OpenAI.

### 🔒 POST `/api/emails/emails/{id}/suggest-reply/`
Generates suggested reply text.

### AI Categorization Flow
1. Sync/import inbound email
2. Rule-based categorizer assigns base category
3. If `AI_EMAIL_SORTING_ENABLED` and API key present → AI refinement
4. Thread category/sentiment updated

### Environment Variables
```env
AI_EMAIL_SORTING_ENABLED=True
OPENAI_API_KEY=sk-...
```

### Notes
- Model usage: `gpt-4o-mini` (adjustable)
- Graceful fallback on errors (no disruption)
- Future: Summarization & smart follow-ups

### Credential Encryption
Email account secrets encrypted with Fernet; see Third-Party docs.


---

## Phase 1: Health Check

### ✅ GET `/api/health/`
Check if the backend server is running.

**Status**: IMPLEMENTED

**Authentication**: None required

**Request**:
```http
GET /api/health/
```

**Response** (200 OK):
```json
{
  "status": "ok",
  "message": "Backend is running"
}
```

**Example**:
```bash
curl http://localhost:8000/api/health/
```

---

## Phase 2: Authentication

**Status**: ✅ IMPLEMENTED & TESTED (November 14, 2025)  
**Test Results**: See `/backend/TEST_RESULTS.md`

All authentication endpoints provide JWT tokens for secure API access. Features include:
- JWT token-based authentication (1 hour access, 7 days refresh)
- Dual user types: Company (B2B) with roles and Customer (B2C)
- Token refresh mechanism
- Protected endpoints with Bearer token authentication

### 🔒 POST `/api/auth/register/company/`
Register a new company user account (B2B).

**Status**: ✅ IMPLEMENTED

**Authentication**: None required

**Request**:
```http
POST /api/auth/register/company/
Content-Type: application/json

{
  "email": "ceo@company.com",
  "password": "SecurePass123!",
  "password2": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "company_name": "Acme Corp",
  "phone": "+1234567890",
  "employee_count": 50
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": 1,
    "email": "ceo@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "account_type": "company",
    "phone": "+1234567890",
    "is_verified": false,
    "created_at": "2025-11-14T10:00:00Z"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

**Validation Errors** (400 Bad Request):
```json
{
  "email": ["User with this email already exists."],
  "password": ["Passwords do not match."]
}
```

---

### 🔒 POST `/api/auth/register/customer/`
Register a new customer user account (B2C).

**Status**: ✅ IMPLEMENTED

**Authentication**: None required

**Request**:
```http
POST /api/auth/register/customer/
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "SecurePass123!",
  "password2": "SecurePass123!",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",
  "address": "123 Main St, New York, NY"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": 2,
    "email": "customer@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "account_type": "customer",
    "phone": "+1234567890",
    "is_verified": false,
    "created_at": "2025-11-14T10:05:00Z"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

**Validation Errors** (400 Bad Request):
```json
{
  "email": ["User with this email already exists."],
  "password": ["Passwords do not match."]
}
```

---

### 🔒 POST `/api/auth/login/`
Authenticate user and receive JWT tokens.

**Status**: ✅ IMPLEMENTED

**Authentication**: None required

**Request**:
```http
POST /api/auth/login/
Content-Type: application/json

{
  "email": "ceo@company.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": 1,
    "email": "ceo@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "account_type": "company",
    "phone": "+1234567890",
    "is_verified": false,
    "created_at": "2025-11-14T10:00:00Z"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "detail": "Invalid email or password."
}
```

---

### 🔒 POST `/api/auth/logout/`
Invalidate refresh token (blacklist).

**Status**: ✅ IMPLEMENTED

**Authentication**: Bearer token required

**Request**:
```http
POST /api/auth/logout/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "detail": "Successfully logged out."
}
```

**Error Response** (400 Bad Request):
```json
{
  "detail": "Invalid token."
}
```

---

### 🔒 GET `/api/auth/me/`
Get current authenticated user profile.

**Status**: ✅ IMPLEMENTED

**Authentication**: Bearer token required

**Request**:
```http
GET /api/auth/me/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response for Company User** (200 OK):
```json
{
  "id": 1,
  "email": "ceo@company.com",
  "first_name": "John",
  "last_name": "Doe",
  "account_type": "company",
  "phone": "+1234567890",
  "is_verified": false,
  "created_at": "2025-11-14T10:00:00Z",
  "company": {
    "id": 1,
    "name": "Acme Corp",
    "role": "ceo",
    "phone": "+1234567890",
    "employee_count": 50
  }
}
```

**Response for Customer User** (200 OK):
```json
{
  "id": 2,
  "email": "customer@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "account_type": "customer",
  "phone": "+1234567890",
  "is_verified": false,
  "created_at": "2025-11-14T10:05:00Z",
  "customer": {
    "id": 1,
    "address": "123 Main St, New York, NY"
  }
}
```

---

### 🔒 POST `/api/auth/token/refresh/`
Refresh an expired access token.

**Status**: ✅ IMPLEMENTED

**Authentication**: None required

**Request**:
```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Error Response** (400 Bad Request):
```json
{
  "detail": "Invalid token."
}
```

---

### 🔒 POST `/api/auth/google/`
Authenticate with Google OAuth.

**Status**: NOT IMPLEMENTED (Phase 2.3)

**Authentication**: None required

**Request**:
```http
POST /api/auth/logout/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "detail": "Successfully logged out."
}
```

---

### 🔒 POST `/api/auth/google/login/`
Login with Google OAuth (existing users only).

**Status**: ✅ IMPLEMENTED

**Authentication**: None required

**Flow**: User clicks "Sign in with Google" → Frontend gets Google token → Send to this endpoint → Returns JWT tokens if user exists

**Request**:
```http
POST /api/auth/google/login/
Content-Type: application/json

{
  "token": "google_oauth_id_token_here"
}
```

**Response** (200 OK - User exists):
```json
{
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "first_name": "John",
    "last_name": "Doe",
    "account_type": "company",
    "phone": "+1234567890",
    "is_verified": true,
    "created_at": "2025-11-14T10:00:00Z"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

**Response** (404 Not Found - User doesn't exist):
```json
{
  "detail": "User not found. Please complete signup first.",
  "email": "user@gmail.com"
}
```

**Response** (401 Unauthorized - Invalid token):
```json
{
  "detail": "Invalid Google token."
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/auth/google/login/ \
  -H "Content-Type: application/json" \
  -d '{"token": "google_oauth_id_token_here"}'
```

---

### 🔒 POST `/api/auth/google/signup/`
Signup with Google OAuth (create new user).

**Status**: ✅ IMPLEMENTED

**Authentication**: None required

**Flow**: User clicks "Sign up with Google" → Frontend gets Google token → User selects account type → Send to this endpoint → Creates user and returns JWT tokens

**Request for Company Account**:
```http
POST /api/auth/google/signup/
Content-Type: application/json

{
  "token": "google_oauth_id_token_here",
  "account_type": "company",
  "company_name": "Tech Innovations Inc",
  "phone": "+1234567890",
  "employee_count": 50
}
```

**Request for Customer Account**:
```http
POST /api/auth/google/signup/
Content-Type: application/json

{
  "token": "google_oauth_id_token_here",
  "account_type": "customer",
  "phone": "+1234567890",
  "address": "123 Main St, City, Country"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": 5,
    "email": "newuser@gmail.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "account_type": "company",
    "phone": "+1234567890",
    "is_verified": true,
    "created_at": "2025-11-14T10:30:00Z"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

**Response** (400 Bad Request - User exists):
```json
{
  "detail": "User with this email already exists. Please login instead.",
  "email": "user@gmail.com"
}
```

**Response** (400 Bad Request - Missing company_name):
```json
{
  "detail": "company_name is required for company accounts."
}
```

**Response** (401 Unauthorized - Invalid token):
```json
{
  "detail": "Invalid Google token."
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/auth/google/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "google_oauth_id_token_here",
    "account_type": "company",
    "company_name": "My Company",
    "phone": "+1234567890",
    "employee_count": 25
  }'
```

**Notes**:
- Email is verified by Google, so `is_verified` is automatically set to `true`
- User password is set to unusable since authentication is via Google
- For company accounts, user is automatically assigned CEO role
- Google token must be a valid ID token from Google OAuth 2.0

---

## Phase 2.5: Company Profile Management (Phase 3.2)

### 🏢 GET `/api/auth/company/profile/`
Get company profile for the current authenticated user.

**Status**: ✅ IMPLEMENTED

**Authentication**: Bearer token required (Company users only)

**Permissions**: IsCompanyUser

**Request**:
```http
GET /api/auth/company/profile/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response** (200 OK):
```json
{
  "id": 1,
  "company_name": "Tech Innovators Inc",
  "logo": null,
  "logo_url": null,
  "website": "https://techinnovators.com",
  "industry": "technology",
  "description": "Leading provider of innovative tech solutions",
  "phone": "+1234567890",
  "employee_count": 150,
  "address": "123 Tech Street",
  "city": "San Francisco",
  "country": "USA",
  "timezone": "America/Los_Angeles",
  "is_active": true,
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-14T15:30:00Z",
  "created_by_name": "John Doe",
  "created_by_email": "john@techinnovators.com",
  "team_count": 12,
  "active_team_count": 10
}
```

**Error Responses**:

**401 Unauthorized** (Not authenticated):
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden** (Not a company user):
```json
{
  "detail": "This endpoint is only for company accounts."
}
```

**404 Not Found** (Not a member of any company):
```json
{
  "detail": "You are not a member of any company."
}
```

---

### 🏢 PUT `/api/auth/company/profile/`
Update company profile. Only CEO can update sensitive fields (company_name, employee_count).

**Status**: ✅ IMPLEMENTED

**Authentication**: Bearer token required (Company users only)

**Permissions**: IsCompanyUser (CEO required for sensitive fields)

**Content-Type**: `multipart/form-data` (for logo upload) or `application/json`

**Request** (JSON):
```http
PUT /api/auth/company/profile/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "website": "https://newtechinnovators.com",
  "industry": "finance",
  "description": "Financial technology solutions provider",
  "phone": "+1234567899",
  "address": "456 Finance Avenue",
  "city": "New York",
  "country": "USA",
  "timezone": "America/New_York"
}
```

**Request** (with logo upload):
```http
PUT /api/auth/company/profile/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: multipart/form-data

logo: [file upload]
website: https://newtechinnovators.com
industry: finance
```

**Response** (200 OK):
```json
{
  "id": 1,
  "company_name": "Tech Innovators Inc",
  "logo": "company_logos/logo_xyz123.png",
  "logo_url": "http://localhost:8000/media/company_logos/logo_xyz123.png",
  "website": "https://newtechinnovators.com",
  "industry": "finance",
  "description": "Financial technology solutions provider",
  "phone": "+1234567899",
  "employee_count": 150,
  "address": "456 Finance Avenue",
  "city": "New York",
  "country": "USA",
  "timezone": "America/New_York",
  "is_active": true,
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-14T16:00:00Z",
  "created_by_name": "John Doe",
  "created_by_email": "john@techinnovators.com",
  "team_count": 12,
  "active_team_count": 10
}
```

**Error Responses**:

**400 Bad Request** (Non-CEO trying to update sensitive fields):
```json
{
  "non_field_errors": [
    "Only CEO can update company name and employee count."
  ]
}
```

**403 Forbidden** (Not a company user):
```json
{
  "detail": "This endpoint is only for company accounts."
}
```

**Updateable Fields**:
- **All users**: logo, website, industry, description, phone, address, city, country, timezone
- **CEO only**: company_name, employee_count

**Industry Choices**:
- `technology`
- `healthcare`
- `finance`
- `retail`
- `manufacturing`
- `other`

---

### 👥 GET `/api/auth/company/team/`
Get list of all team members in the company.

**Status**: ✅ IMPLEMENTED

**Authentication**: Bearer token required (Company users only)

**Permissions**: IsCompanyUser

**Query Parameters**:
- `role` (optional): Filter by role (ceo, manager, sales_manager, support_staff)
- `is_active` (optional): Filter by active status (true, false)

**Request**:
```http
GET /api/auth/company/team/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Request** (with filters):
```http
GET /api/auth/company/team/?role=manager&is_active=true
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response** (200 OK):
```json
{
  "count": 12,
  "team_members": [
    {
      "id": 1,
      "user_id": 1,
      "email": "john@techinnovators.com",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "phone": "+1234567890",
      "role": "ceo",
      "department": "management",
      "is_active": true,
      "joined_at": "2025-11-01T10:00:00Z",
      "can_invite_users": true,
      "can_manage_deals": true,
      "can_view_reports": true,
      "can_manage_customers": true
    },
    {
      "id": 2,
      "user_id": 5,
      "email": "jane@techinnovators.com",
      "first_name": "Jane",
      "last_name": "Smith",
      "full_name": "Jane Smith",
      "phone": "+1234567891",
      "role": "manager",
      "department": "sales",
      "is_active": true,
      "joined_at": "2025-11-02T14:30:00Z",
      "can_invite_users": true,
      "can_manage_deals": true,
      "can_view_reports": true,
      "can_manage_customers": true
    },
    {
      "id": 3,
      "user_id": 8,
      "email": "bob@techinnovators.com",
      "first_name": "Bob",
      "last_name": "Johnson",
      "full_name": "Bob Johnson",
      "phone": "+1234567892",
      "role": "sales_manager",
      "department": "sales",
      "is_active": true,
      "joined_at": "2025-11-03T09:15:00Z",
      "can_invite_users": false,
      "can_manage_deals": true,
      "can_view_reports": true,
      "can_manage_customers": true
    }
  ]
}
```

**Role Choices**:
- `ceo` - Chief Executive Officer
- `manager` - Manager
- `sales_manager` - Sales Manager
- `support_staff` - Support Staff

**Department Choices**:
- `sales` - Sales
- `support` - Support
- `marketing` - Marketing
- `management` - Management

**Permission Fields**:
- `can_invite_users`: Can send team invitations
- `can_manage_deals`: Can create and manage deals
- `can_view_reports`: Can access reports and analytics
- `can_manage_customers`: Can manage customer information

---

### 📊 GET `/api/auth/company/stats/`
Get company statistics including team breakdown and recent activity.

**Status**: ✅ IMPLEMENTED

**Authentication**: Bearer token required (Company users only)

**Permissions**: IsCompanyUser

**Request**:
```http
GET /api/auth/company/stats/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response** (200 OK):
```json
{
  "company_name": "Tech Innovators Inc",
  "total_members": 12,
  "active_members": 10,
  "inactive_members": 2,
  "roles": {
    "ceo": 1,
    "manager": 3,
    "sales_manager": 4,
    "support_staff": 4
  },
  "departments": {
    "management": 1,
    "sales": 6,
    "support": 2,
    "marketing": 1
  },
  "recent_members": [
    {
      "id": 12,
      "name": "Alice Brown",
      "email": "alice@techinnovators.com",
      "role": "support_staff",
      "joined_at": "2025-11-14T10:00:00Z"
    },
    {
      "id": 11,
      "name": "Charlie Wilson",
      "email": "charlie@techinnovators.com",
      "role": "sales_manager",
      "joined_at": "2025-11-13T14:30:00Z"
    },
    {
      "id": 10,
      "name": "Diana Martinez",
      "email": "diana@techinnovators.com",
      "role": "manager",
      "joined_at": "2025-11-12T09:15:00Z"
    },
    {
      "id": 9,
      "name": "Ethan Davis",
      "email": "ethan@techinnovators.com",
      "role": "sales_manager",
      "joined_at": "2025-11-11T11:45:00Z"
    },
    {
      "id": 8,
      "name": "Bob Johnson",
      "email": "bob@techinnovators.com",
      "role": "sales_manager",
      "joined_at": "2025-11-03T09:15:00Z"
    }
  ]
}
```

**Statistics Provided**:
- **Total Members**: Total number of team members (active + inactive)
- **Active Members**: Number of currently active team members
- **Inactive Members**: Number of inactive team members
- **Roles Breakdown**: Count of members by role
- **Departments Breakdown**: Count of active members by department
- **Recent Members**: Last 5 members who joined (newest first)

---

## Phase 2.6: Customer Profile Management (Phase 3.3)

### 👤 GET `/api/auth/customer/profile/`
Get customer profile for the current authenticated customer user.

**Status**: ✅ IMPLEMENTED

**Authentication**: Bearer token required (Customer users only)

**Permissions**: IsCustomer

**Request**:
```http
GET /api/auth/customer/profile/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response** (200 OK):
```json
{
  "id": 1,
  "user_id": 5,
  "email": "customer@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "full_name": "Jane Smith",
  "phone": "+1234567890",
  "profile_picture": null,
  "profile_picture_url": null,
  "date_of_birth": "1990-05-15",
  "address": "456 Customer Street",
  "city": "Los Angeles",
  "country": "USA",
  "created_at": "2025-11-10T12:00:00Z",
  "updated_at": "2025-11-14T10:30:00Z",
  "linked_companies_count": 2,
  "verified_companies_count": 1
}
```

**Error Responses**:

**403 Forbidden** (Not a customer):
```json
{
  "detail": "This endpoint is only for customer accounts."
}
```

**404 Not Found** (Customer profile not found):
```json
{
  "detail": "Customer profile not found."
}
```

---

### 👤 PUT `/api/auth/customer/profile/`
Update customer profile information.

**Status**: ✅ IMPLEMENTED

**Authentication**: Bearer token required (Customer users only)

**Permissions**: IsCustomer

**Content-Type**: `multipart/form-data` (for profile picture) or `application/json`

**Request** (JSON):
```http
PUT /api/auth/customer/profile/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",
  "date_of_birth": "1990-05-15",
  "address": "789 New Address",
  "city": "San Francisco",
  "country": "USA"
}
```

**Request** (with profile picture):
```http
PUT /api/auth/customer/profile/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: multipart/form-data

profile_picture: [file upload]
city: San Francisco
country: USA
```

**Response** (200 OK):
```json
{
  "id": 1,
  "user_id": 5,
  "email": "customer@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "full_name": "Jane Smith",
  "phone": "+1234567890",
  "profile_picture": "customer_profiles/profile_abc123.jpg",
  "profile_picture_url": "http://localhost:8000/media/customer_profiles/profile_abc123.jpg",
  "date_of_birth": "1990-05-15",
  "address": "789 New Address",
  "city": "San Francisco",
  "country": "USA",
  "created_at": "2025-11-10T12:00:00Z",
  "updated_at": "2025-11-14T16:45:00Z",
  "linked_companies_count": 2,
  "verified_companies_count": 1
}
```

**Error Responses**:

**400 Bad Request** (Invalid date of birth):
```json
{
  "date_of_birth": [
    "Date of birth cannot be in the future."
  ]
}
```

**Updateable Fields**:
- `first_name` - CharField (updates User model)
- `last_name` - CharField (updates User model)
- `phone` - CharField (updates User model)
- `profile_picture` - ImageField (requires Pillow)
- `date_of_birth` - DateField (cannot be in future)
- `address` - TextField
- `city` - CharField
- `country` - CharField

**Note**: When updating `first_name`, `last_name`, or `phone`, these fields update the related User model, not just the Customer model.

---

### 🏢 GET `/api/auth/customer/companies/`
Get list of all companies customer is linked to with verification status.

**Status**: ✅ IMPLEMENTED

**Authentication**: Bearer token required (Customer users only)

**Permissions**: IsCustomer

**Query Parameters**:
- `verified` (optional): Filter by verification status (true, false)

**Request**:
```http
GET /api/auth/customer/companies/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Request** (with filter):
```http
GET /api/auth/customer/companies/?verified=true
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response** (200 OK):
```json
{
  "count": 2,
  "companies": [
    {
      "id": 1,
      "company_id": 1,
      "company_name": "Tech Innovators Inc",
      "company_logo": "http://localhost:8000/media/company_logos/logo_xyz123.png",
      "company_website": "https://techinnovators.com",
      "company_industry": "technology",
      "company_phone": "+1234567890",
      "company_address": "123 Tech Street",
      "company_city": "San Francisco",
      "company_country": "USA",
      "verified": true,
      "verified_at": "2025-11-12T10:00:00Z",
      "created_at": "2025-11-10T14:30:00Z"
    },
    {
      "id": 2,
      "company_id": 3,
      "company_name": "Healthcare Solutions",
      "company_logo": null,
      "company_website": "https://healthcaresolutions.com",
      "company_industry": "healthcare",
      "company_phone": "+1234567891",
      "company_address": "456 Health Ave",
      "company_city": "Boston",
      "company_country": "USA",
      "verified": false,
      "verified_at": null,
      "created_at": "2025-11-14T09:15:00Z"
    }
  ]
}
```

**Verification Status**:
- `verified: true` - Company has verified the customer relationship
- `verified: false` - Waiting for company verification
- `verified_at` - Timestamp when company verified the relationship (null if unverified)

---

### 🔗 POST `/api/auth/customer/link-company/`
Customer requests to link their account to a company. Creates unverified relationship.

**Status**: ✅ IMPLEMENTED

**Authentication**: Bearer token required (Customer users only)

**Permissions**: IsCustomer

**Request** (by company ID):
```http
POST /api/auth/customer/link-company/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "company_id": 1
}
```

**Request** (by company name - exact match):
```http
POST /api/auth/customer/link-company/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "company_name": "Tech Innovators"
}
```

**Response** (201 Created):
```json
{
  "detail": "Link request sent successfully. Waiting for company verification.",
  "company": {
    "id": 1,
    "name": "Tech Innovators Inc",
    "city": "San Francisco",
    "country": "USA"
  },
  "verified": false,
  "created_at": "2025-11-14T16:50:00Z"
}
```

**Error Responses**:

**400 Bad Request** (Missing parameters):
```json
{
  "non_field_errors": [
    "Either company_id or company_name must be provided."
  ]
}
```

**400 Bad Request** (Already linked):
```json
{
  "detail": "You are already linked to this company.",
  "verified": false,
  "created_at": "2025-11-14T10:00:00Z"
}
```

**400 Bad Request** (Company not found):
```json
{
  "company_id": [
    "Company not found or inactive."
  ]
}
```

**400 Bad Request** (Multiple matches):
```json
{
  "company_name": [
    "Multiple companies found. Please use company_id."
  ],
  "matches": [
    {
      "id": 1,
      "name": "Tech Innovators Inc",
      "city": "San Francisco"
    },
    {
      "id": 5,
      "name": "Tech Innovators LLC",
      "city": "New York"
    }
  ]
}
```

**How It Works**:
1. Customer provides company_id or company_name
2. System validates company exists and is active
3. System checks for existing link (prevents duplicates)
4. Creates CustomerCompany relationship with `verified=false`
5. Company admin will be notified (Phase 9 - Notifications)
6. Company admin can verify the relationship later

**Search by Name**:
- Searches using case-insensitive partial match (`icontains`)
- If no matches: Returns error
- If one match: Automatically links to that company
- If multiple matches: Returns list of options, asks user to use `company_id`

---

## Phase 3: User Management



### 👤 GET `/api/users/me/`
Get current authenticated user profile.

**Status**: NOT IMPLEMENTED

**Authentication**: Bearer token required

**Request**:
```http
GET /api/users/me/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "user",
  "company": {
    "id": 1,
    "name": "Acme Corp"
  },
  "profile_picture": "https://example.com/profile.jpg",
  "created_at": "2025-11-14T10:00:00Z"
}
```

---

### 👤 PATCH `/api/users/me/`
Update current user profile.

**Status**: NOT IMPLEMENTED

**Authentication**: Bearer token required

**Request**:
```http
PATCH /api/users/me/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "user"
}
```

---

### 👥 GET `/api/users/`
List all users in company (Admin only).

**Status**: NOT IMPLEMENTED

**Authentication**: Bearer token required (Admin role)

**Query Parameters**:
- `role` (optional): Filter by role (admin, manager, user)
- `search` (optional): Search by name or email
- `page` (optional): Page number for pagination

**Request**:
```http
GET /api/users/?role=user&page=1
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response** (200 OK):
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": 2,
      "email": "user2@example.com",
      "first_name": "Alice",
      "last_name": "Johnson",
      "role": "user",
      "is_active": true
    }
  ]
}
```

---

## Phase 4.2: Lead Management APIs (Implemented)
## Phase 4.3: Pipeline Management APIs (Implemented)

### Overview
Manage sales pipelines and their stages. Restricted to Company CEO or Manager roles. Pipelines are soft-deleted (`is_active=false`). Stages are ordered and can be bulk reordered.

### Endpoints Summary
| Method | Path | Description | Permissions |
|--------|------|-------------|-------------|
| GET | `/api/pipelines/` | List pipelines for company | CEO/Manager |
| POST | `/api/pipelines/` | Create pipeline (default or custom stages) | CEO/Manager |
| GET | `/api/pipelines/{id}/` | Pipeline detail + stages | CEO/Manager |
| PUT | `/api/pipelines/{id}/` | Update pipeline name/description | CEO/Manager |
| DELETE | `/api/pipelines/{id}/` | Soft delete pipeline (no deals) | CEO/Manager |
| GET | `/api/pipelines/{id}/stages/` | List stages ordered | CEO/Manager |
| POST | `/api/pipelines/{id}/stages/` | Add new stage (append) | CEO/Manager |
| PUT | `/api/stages/{id}/` | Update stage (name/probability/order) | CEO/Manager |
| DELETE | `/api/stages/{id}/` | Soft delete stage (no deals) | CEO/Manager |
| POST | `/api/pipelines/{id}/reorder-stages/` | Bulk reorder stages | CEO/Manager |

### Pipeline Object (PipelineSerializer)
Fields: `id, company, name, description, is_default, created_by, created_at, is_active, stages[], total_deals_count`.
`stages[]` uses `DealStageSerializer` (`id, pipeline, name, order, probability, is_active, created_at, deal_count`).

### Create Pipeline – POST `/api/pipelines/`
Body (default stages omitted):
```json
{
  "name": "Enterprise Pipeline",
  "description": "High value enterprise deals",
  "is_default": false,
  "stages": [
    {"name": "Initial Contact", "probability": 5, "order": 1},
    {"name": "Discovery", "probability": 15, "order": 2},
    {"name": "Proposal", "probability": 40, "order": 3},
    {"name": "Negotiation", "probability": 70, "order": 4},
    {"name": "Closed Won", "probability": 100, "order": 5},
    {"name": "Closed Lost", "probability": 0, "order": 6}
  ]
}
```
Validation: stage orders unique, contiguous starting at 1.
Response 201: Pipeline with stages.

### Add Stage – POST `/api/pipelines/{id}/stages/`
Body:
```json
{"name": "Legal Review", "probability": 55}
```
Appended with next order value.

### Update Stage – PUT `/api/stages/{id}/`
Body (any subset):
```json
{"name":"Technical Validation","probability":30,"order":2}
```
Reorders affected pipeline stages automatically.

### Reorder Stages – POST `/api/pipelines/{id}/reorder-stages/`
Body:
```json
{"stage_ids": [10, 11, 8, 9, 12, 13]}
```
Must include all current stage IDs exactly once. New order applied sequentially.
Response 200: `{ "detail": "Stages reordered." }`

### Delete Stage – DELETE `/api/stages/{id}/`
Only if no deals at that stage; sets `is_active=false`.

### Delete Pipeline – DELETE `/api/pipelines/{id}/`
Only if pipeline has no deals; sets `is_active=false`.

### Error Examples
`400`: `{ "detail": "Cannot delete pipeline with active deals." }`
`400`: `{ "detail": "Stage order values must be unique." }`
`404`: `{ "detail": "Not found." }`
`403`: `{ "detail": "Only company CEO or Manager can manage pipelines." }`

### Notes
- Default pipeline constraint ensures at most one `is_default=True` per company.
- Reorder endpoint simplifies drag-and-drop UI integration.
- Soft deletes retain historical references for reporting.

---

### Overview
Core lead CRUD, assignment, conversion to deals, and statistics endpoints. All endpoints require authentication and a company user context. Base path: `/api/`.

### Permissions
- `IsCompanyUser`: Authenticated company account with active membership.
- `IsLeadOwnerOrManager`: Lead creator, assignee, or user with manage deals permission.
- `CanManageLeads`: User with `can_manage_deals` flag (manager/CEO etc.).

### Endpoints Summary
| Method | Path | Description | Permissions |
|--------|------|-------------|-------------|
| GET | `/api/leads/` | List leads (filters, search, sort, pagination) | IsCompanyUser |
| POST | `/api/leads/` | Create lead | IsCompanyUser |
| GET | `/api/leads/{id}/` | Lead detail + recent activities | IsCompanyUser + Owner/Manager |
| PUT | `/api/leads/{id}/` | Update lead (status changes tracked) | IsCompanyUser + Owner/Manager |
| DELETE | `/api/leads/{id}/` | Soft delete (set `is_active=false`) | IsCompanyUser + Owner/Manager |
| POST | `/api/leads/{id}/convert/` | Convert lead to deal | IsCompanyUser + Owner/Manager |
| POST | `/api/leads/{id}/assign/` | Assign lead to user | IsCompanyUser + CanManageLeads |
| GET | `/api/leads/stats/` | Aggregate lead statistics | IsCompanyUser |

### Lead Object (Full Serializer)
Fields: `id, company, created_by, assigned_to, first_name, last_name, email, phone, company_name, job_title, lead_source, status, estimated_value, notes, created_at, updated_at, converted_to_deal, converted_at, is_active, days_since_created, is_overdue`

Computed:
- `days_since_created`: Integer days from creation.
- `is_overdue`: True if no activity in last 7 days.

### 1. List Leads – GET `/api/leads/`
Query Params:
- `company_id` (int) select specific company if member
- `status` (string)
- `assigned_to` (user id)
- `lead_source` (string)
- `start_date` / `end_date` (YYYY-MM-DD)
- `search` (matches first_name, last_name, email, company_name)
- `sort` (`created_at|updated_at|estimated_value`) + `direction=asc|desc`

Response (200): Array of minimal lead objects.

### 2. Create Lead – POST `/api/leads/`
Body:
```json
{
  "first_name": "Alice",
  "last_name": "Brown",
  "email": "alice@acme.com",
  "lead_source": "website",
  "estimated_value": 1500.00,
  "assigned_to_id": 5
}
```
Automatically sets `company` (first active membership) and `created_by`.
Response (201): Full lead object.
Errors: 400 with `missing_fields` array.

### 3. Lead Detail – GET `/api/leads/{id}/`
Returns full lead plus `activities` (recent up to 100) with: `id,type,subject,description,created_at,scheduled_at,completed`.

### 4. Update Lead – PUT `/api/leads/{id}/`
Partial updates allowed. When `status` changes an Activity note is auto-created.
Response (200): Updated lead.

### 5. Delete Lead – DELETE `/api/leads/{id}/`
Soft delete sets `is_active=false`. Response 204.

### 6. Convert Lead – POST `/api/leads/{id}/convert/`
Body:
```json
{
  "pipeline_id": 3,
  "stage_id": 12,
  "title": "Enterprise Subscription",
  "value": 50000,
  "currency": "USD",
  "contact_name": "Alice Brown",
  "contact_email": "alice@acme.com",
  "company_name": "Acme Corp",
  "expected_close_date": "2025-12-31",
  "priority": "high"
}
```
Creates a Deal linked to lead; sets lead `status=converted`, `converted_to_deal`, `converted_at`.
Response (201): `{ "detail":"Lead converted", "deal_id": <id> }`
Errors: 400 invalid pipeline/stage or already converted.

### 7. Assign Lead – POST `/api/leads/{id}/assign/`
Body: `{ "user_id": 7 }`
Assigns user if belongs to same company. Response (200): `{ "detail":"Lead assigned", "assigned_to": 7 }`

### 8. Lead Stats – GET `/api/leads/stats/`
Query Params: `company_id` optional.
Response:
```json
{
  "total_leads": 42,
  "leads_by_status": {"new":20,"qualified":10,"converted":5,"contacted":7},
  "leads_by_source": {"website":15,"referral":8},
  "conversion_rate_percent": 11.9,
  "average_time_to_conversion_days": 6.25,
  "leads_by_assigned_user": {"5":12,"7":9,"None":21}
}
```

### Status & Source Choices
- Status: `new, contacted, qualified, unqualified, converted`
- Source: `website, referral, cold_call, social_media, event, other`

### Error Examples
`403 Forbidden` (not owner/manager editing lead): `{ "detail": "You must be lead owner, assignee or manager." }`
`400 Bad Request` (missing fields): `{ "missing_fields": ["first_name"] }`
`404 Not Found`: `{ "detail":"Not found." }`

### Notes
- Soft deletion keeps historical conversion and activity data.
- `is_overdue` helps prioritize follow-up workflows.
- Activities can be extended later for tasks scheduling.

---

### 📈 GET `/api/leads/`
List all leads.

**Status**: NOT IMPLEMENTED

**Authentication**: Bearer token required

**Query Parameters**:
- `status` (optional): Filter by status (new, contacted, qualified, lost)
- `assigned_to` (optional): Filter by assigned user ID
- `search` (optional): Search by name, email, or company
- `ordering` (optional): Sort by field (e.g., `-created_at`)

**Request**:
```http
GET /api/leads/?status=new&ordering=-created_at
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response** (200 OK):
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "name": "John Smith",
      "email": "john@company.com",
      "phone": "+1234567890",
      "company": "Tech Corp",
      "status": "new",
      "source": "website",
      "assigned_to": {
        "id": 2,
        "name": "Sales Rep"
      },
      "created_at": "2025-11-14T10:00:00Z"
    }
  ]
}
```

---

### 📈 POST `/api/leads/`
Create a new lead.

**Status**: NOT IMPLEMENTED

**Authentication**: Bearer token required

**Request**:
```http
POST /api/leads/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "New Corp",
  "source": "referral",
  "notes": "Interested in enterprise plan"
}
```

**Response** (201 Created):
```json
{
  "id": 2,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "New Corp",
  "status": "new",
  "source": "referral",
  "notes": "Interested in enterprise plan",
  "created_at": "2025-11-14T11:00:00Z"
}
```

---

### 📈 GET `/api/leads/{id}/`
Get lead details.

**Status**: NOT IMPLEMENTED

**Authentication**: Bearer token required

**Request**:
```http
GET /api/leads/1/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "John Smith",
  "email": "john@company.com",
  "phone": "+1234567890",
  "company": "Tech Corp",
  "status": "contacted",
  "source": "website",
  "assigned_to": {
    "id": 2,
    "name": "Sales Rep"
  },
  "notes": "Follow up next week",
  "activities": [
    {
      "id": 1,
      "type": "call",
      "note": "Initial contact",
      "created_at": "2025-11-14T10:30:00Z"
    }
  ],
  "created_at": "2025-11-14T10:00:00Z"
}
```

---

## Phase 5: Deal Management (Implemented)

### Overview
Manage deals moving through pipeline stages, with stage changes, closing (won/lost), assignments, Kanban grouping, and stats. Deals are soft-deleted (`is_active=false`).

### Permissions
- `IsCompanyUser`: Required for all endpoints.
- `IsDealOwnerOrManager`: For viewing/updating/deleting a specific deal (owner/assignee or manager with `can_manage_deals`).
- `CanManageLeads`: For assigning deals to users.

### Endpoints Summary
| Method | Path | Description | Permissions |
|--------|------|-------------|-------------|
| GET | `/api/deals/` | List deals (filters/search/sort) | IsCompanyUser |
| POST | `/api/deals/` | Create deal (defaults first stage) | IsCompanyUser |
| GET | `/api/deals/{id}/` | Deal detail + recent activities | IsCompanyUser + Owner/Manager |
| PUT | `/api/deals/{id}/` | Update deal (tracks stage changes) | IsCompanyUser + Owner/Manager |
| DELETE | `/api/deals/{id}/` | Soft delete | IsCompanyUser + Owner/Manager |
| POST | `/api/deals/{id}/move-stage/` | Move deal to another stage | IsCompanyUser + Owner/Manager |
| POST | `/api/deals/{id}/close/` | Close deal as won/lost | IsCompanyUser + Owner/Manager |
| POST | `/api/deals/{id}/assign/` | Assign deal to user | IsCompanyUser + CanManageLeads |
| GET | `/api/deals/stats/` | Aggregate deal statistics | IsCompanyUser |
| GET | `/api/deals/by-stage/` | Kanban grouping by stage | IsCompanyUser |

### Deal Object (DealSerializer)
Fields: `id, company, created_by, assigned_to, pipeline, stage, title, value, currency, contact_name, contact_email, company_name, status, expected_close_date, actual_close_date, probability, priority, lost_reason, created_at, updated_at, is_active, activity_count, days_in_stage, weighted_value, is_overdue`.

Computed:
- `activity_count`: Total activities linked to deal.
- `days_in_stage`: Integer days from `stage_changed_at`.
- `weighted_value`: `value * probability/100`.
- `is_overdue`: True if open and no recent activity within threshold.

### 1. List Deals – GET `/api/deals/`
Query Params:
- `company_id` (int) specific company if member
- `pipeline` (id), `stage` (id), `status` (`open|won|lost`)
- `assigned_to` (user id)
- `priority` (`low|medium|high`)
- `start_date` / `end_date` (YYYY-MM-DD, by `created_at`)
- `search` (matches title, company_name, contact_name)
- `sort` (`created_at|value|expected_close_date`) + `direction=asc|desc`

Response (200): Array of compact deal objects via `DealListSerializer`.

### 2. Create Deal – POST `/api/deals/`
Body (minimal):
```json
{
  "pipeline_id": 3,
  "title": "Enterprise Subscription",
  "value": 50000,
  "currency": "USD",
  "company_name": "Acme Corp",
  "contact_name": "Alice Brown",
  "contact_email": "alice@acme.com",
  "assigned_to_id": 7,
  "priority": "high"
}
```
Notes:
- `company` and `created_by` are set automatically from the requester.
- If `stage_id` omitted, defaults to first stage of pipeline.

Response (201): Full deal object.

### 3. Deal Detail – GET `/api/deals/{id}/`
Returns full deal plus `activities` (recent up to 200): `id,type,subject,description,created_at,scheduled_at,completed`.

### 4. Update Deal – PUT `/api/deals/{id}/`
Partial updates allowed. When `stage_id` changes, probability syncs to stage, `stage_changed_at` updated, and an Activity is logged.

### 5. Delete Deal – DELETE `/api/deals/{id}/`
Soft delete sets `is_active=false`. Response 204.

### 6. Move Stage – POST `/api/deals/{id}/move-stage/`
Body:
```json
{ "stage_id": 12 }
```
Moves stage and updates probability; logs an Activity. Response 200 with new `stage_id` and `probability`.

### 7. Close Deal – POST `/api/deals/{id}/close/`
Body:
```json
{ "status": "won" }
```
or
```json
{ "status": "lost", "lost_reason": "Pricing" }
```
Sets `actual_close_date`, adjusts probability to `100` or `0`, logs an Activity. Response 200 summary.

### 8. Assign Deal – POST `/api/deals/{id}/assign/`
Body: `{ "user_id": 7 }`
Assigns user if member of same company; logs an Activity. Response 200.

### 9. Deal Stats – GET `/api/deals/stats/`
Query Params: `company_id` optional.
Response:
```json
{
  "total_deals_value": 125000.0,
  "deals_by_stage": {"Proposal": {"count": 3, "value": 65000.0}},
  "win_rate_percent": 28.6,
  "average_deal_size": 19000.0,
  "average_days_to_close": 12.5,
  "deals_by_assigned_user": {"7": {"count": 8, "value": 82000.0}},
  "monthly_trends": [{"month": "2025-11", "count": 12, "value": 90000.0}]
}
```

### 10. Deals By Stage – GET `/api/deals/by-stage/?pipeline_id=3`
Returns stages with their deals for Kanban UI. Response object keyed by stage id containing stage info and list of deals.

---

## Phase 4.5: Activity Management (Implemented)

### Overview
Track notes, calls, emails, meetings, and tasks on leads and deals. Activities belong to a company and are listed in timeline order. Completion can be toggled for task-like activities.

### Permissions
- `IsCompanyUser`: Required for all endpoints.
- `IsLeadOwnerOrManager`: For lead-specific timelines.
- `IsDealOwnerOrManager`: For deal-specific timelines.

### Endpoints Summary
| Method | Path | Description | Permissions |
|--------|------|-------------|-------------|
| GET | `/api/activities/` | List activities (filters/sort) | IsCompanyUser |
| POST | `/api/activities/` | Create activity (lead or deal required) | IsCompanyUser |
| GET | `/api/activities/{id}/` | Activity detail | IsCompanyUser (same company) |
| PUT | `/api/activities/{id}/` | Update type/subject/description/scheduled/completed | IsCompanyUser (same company) |
| DELETE | `/api/activities/{id}/` | Delete activity | IsCompanyUser (same company) |
| GET | `/api/leads/{id}/activities/` | Lead timeline | IsCompanyUser + Owner/Manager |
| GET | `/api/deals/{id}/activities/` | Deal timeline | IsCompanyUser + Owner/Manager |
| POST | `/api/activities/{id}/complete/` | Mark as completed | IsCompanyUser (same company) |

### Activity Object (ActivitySerializer)
Fields: `id, company, user, lead, deal, activity_type, subject, description, created_at, scheduled_at, completed`.
- `user`: mini (id, first_name, last_name, email)
- `lead`: mini (id, first_name, last_name, email, company_name)
- `deal`: mini (id, title, value, status, stage)

### 1. List Activities – GET `/api/activities/`
Query Params:
- `company_id` (optional)
- `lead` (id), `deal` (id), `user` (id), `activity_type` (`note|call|email|meeting|task`)
- `start_date` / `end_date` (YYYY-MM-DD by `created_at`)
- `sort` (`created_at|scheduled_at`) + `direction=asc|desc`

Response (200): Array of `ActivityListSerializer` items with: `id, activity_type, subject, description, created_at, scheduled_at, completed, user, target_type, target_id`.

### 2. Create Activity – POST `/api/activities/`
Body:
```json
{ "lead_id": 10, "activity_type": "call", "subject": "Intro call", "description": "Talked about needs", "scheduled_at": "2025-11-20T10:00:00Z" }
```
Rules:
- Provide exactly one of `lead_id` or `deal_id`.
- User must belong to the target company.

### 3. Activity Detail/Update/Delete – `/api/activities/{id}/`
- GET returns full object.
- PUT accepts `activity_type, subject, description, scheduled_at, completed`.
- DELETE removes the activity.

### 4. Lead/Deal Timelines – `/api/leads/{id}/activities/`, `/api/deals/{id}/activities/`
Return recent activities ordered by `created_at desc`.

### 5. Mark Complete – POST `/api/activities/{id}/complete/`
Marks an activity as completed and returns `{ detail, id, completed }`.

---

## Phase 6: Customer Management

### 👤 GET `/api/contacts/`
List all contacts.

**Status**: NOT IMPLEMENTED

**Authentication**: Bearer token required

---

### 🏢 GET `/api/organizations/`
List all organizations.

**Status**: NOT IMPLEMENTED

**Authentication**: Bearer token required

---

## Phase 7: Communication

### 📞 GET `/api/activities/`
List all activities (calls, emails, meetings).

**Status**: NOT IMPLEMENTED

**Authentication**: Bearer token required

---

### 📧 POST `/api/activities/email/`
Send an email.

**Status**: NOT IMPLEMENTED

**Authentication**: Bearer token required

---

## Reports & Analytics

**Status**: ✅ IMPLEMENTED (Phase 4)

Role-based scope applied via `scope` query parameter derived from user role:
- `all` (CEO, Manager)
- `team` (Sales Manager)
- `self` (Staff / default)

### GET `/api/reports`
Aggregated bundle of all report datasets.

**Query Params**:
`start_date` (YYYY-MM-DD), `end_date` (YYYY-MM-DD), `scope`

**Response**:
```json
{
  "summary": {
    "total_leads": 128,
    "total_deals_value": 452000.75,
    "win_rate": 32.4,
    "average_deal_size": 11300.19
  },
  "leads_by_source": [{ "source": "referral", "count": 34 }],
  "leads_by_status": [{ "status": "qualified", "count": 48 }],
  "deals_by_stage": [{ "stage": "Negotiation", "count": 12 }],
  "revenue_trend": [{ "month": "2025-11", "value": 34000.75 }],
  "deals_won_lost": [ { "status": "won", "count": 18 }, { "status": "lost", "count": 6 } ],
  "top_performers": [{ "name": "Jane S.", "deals_closed": 9 }],
  "recent_won_deals": [{ "id": 91, "title": "Enterprise Plan", "value": 12000, "won_date": "2025-11-10" }],
  "deals_closing_this_month": [{ "id": 97, "title": "Renewal", "value": 8000, "expected_close_date": "2025-11-28" }],
  "overdue_deals": [{ "id": 88, "title": "Expansion", "value": 5000, "expected_close_date": "2025-10-30" }]
}
```

### GET `/api/reports/summary`
High-level KPIs only.

**Response**:
```json
{ "total_leads": 128, "total_deals_value": 452000.75, "win_rate": 32.4, "average_deal_size": 11300.19 }
```

### GET `/api/reports/leads-by-source`
Returns counts by lead_source.
```json
[{ "source": "website", "count": 55 }, { "source": "referral", "count": 34 }]
```

### GET `/api/reports/leads-by-status`
Returns counts by lead status.
```json
[{ "status": "qualified", "count": 48 }, { "status": "converted", "count": 22 }]
```

### GET `/api/reports/deals-by-stage`
Deals grouped by current stage.
```json
[{ "stage": "Proposal", "count": 15 }, { "stage": "Negotiation", "count": 12 }]
```

### GET `/api/reports/revenue-trend`
Monthly closed/won revenue values.
```json
[{ "month": "2025-07", "value": 24000.00 }, { "month": "2025-08", "value": 31000.50 }]
```

### GET `/api/reports/deals-won-lost`
Counts of won vs lost deals.
```json
[{ "status": "won", "count": 18 }, { "status": "lost", "count": 6 }]
```

### GET `/api/reports/top-performers`
Team members ranked by deals closed.
```json
[{ "name": "Jane S.", "deals_closed": 9 }, { "name": "Alex T.", "deals_closed": 7 }]
```

### GET `/api/reports/recent-won-deals`
Recently closed won deals (limit 20).
```json
[{ "id": 91, "title": "Enterprise Plan", "value": 12000, "won_date": "2025-11-10" }]
```

### GET `/api/reports/deals-closing-this-month`
Open deals with expected close date in current month.
```json
[{ "id": 97, "title": "Renewal", "value": 8000, "expected_close_date": "2025-11-28" }]
```

### GET `/api/reports/overdue-deals`
Open deals whose expected close date has passed.
```json
[{ "id": 88, "title": "Expansion", "value": 5000, "expected_close_date": "2025-10-30" }]
```

### Notes
- All endpoints support `start_date`, `end_date`, `scope` query parameters.
- Pagination not applied (datasets intentionally small for dashboard usage).
- To optimize performance, prefer the aggregated `/api/reports` endpoint.


## Phase 9: Notifications

### 🔔 GET `/api/notifications/`
List user notifications.

**Status**: NOT IMPLEMENTED

**Authentication**: Bearer token required

---

## Phase 2.7: Team Invitations (Phase 3.4)

Invite and onboard team members to a company using email-based tokens.

**Status**: ✅ IMPLEMENTED

**Authentication**: Bearer token required for company actions (invite/list/cancel). Public for validate/accept.

### ✉️ POST `/api/auth/company/invite/`
Invite a user to join your company.

**Permissions**: Company user with `can_invite_users` (CEO/Manager by default)

**Request**:
```http
POST /api/auth/company/invite/
Authorization: Bearer <access>
Content-Type: application/json

{
  "email": "teammate@example.com",
  "role": "manager"
}
```

**Response** (201 Created):
```json
{
  "id": 12,
  "email": "teammate@example.com",
  "role": "manager",
  "status": "pending",
  "invitation_token": "uuid-token",
  "expires_at": "2025-11-21T10:00:00Z",
  "created_at": "2025-11-14T10:00:00Z",
  "inviter_name": "John Doe",
  "inviter_email": "ceo@company.com",
  "company_id": 1,
  "company_name": "Acme Corp"
}
```

---

### 📜 GET `/api/auth/company/invitations/`
List invitations for your company. Optional filter: `?status=pending|accepted|expired`.

**Permissions**: Company user

**Response** (200 OK):
```json
{
  "count": 2,
  "invitations": [
    { "id": 12, "email": "t1@example.com", "status": "pending", "role": "manager" },
    { "id": 13, "email": "t2@example.com", "status": "pending", "role": "support_staff" }
  ]
}
```

---

### ❌ DELETE `/api/auth/company/invitations/{id}/cancel/`
Cancel a pending invitation (sets status to `expired`).

**Permissions**: Company user

**Response** (200 OK):
```json
{ "detail": "Invitation cancelled." }
```

---

### ✅ GET `/api/auth/validate-invitation/{token}/`
Validate an invitation token (public).

**Response** (200 OK):
```json
{
  "valid": true,
  "email": "teammate@example.com",
  "role": "manager",
  "company": { "id": 1, "name": "Acme Corp" },
  "expires_at": "2025-11-21T10:00:00Z"
}
```

---

### 🔓 POST `/api/auth/accept-invitation/`
Accept an invitation and join the company (public). If the email is new, a user is created; otherwise the existing user is linked to the company and switched to `account_type=company` for access.

**Request**:
```http
POST /api/auth/accept-invitation/
Content-Type: application/json

{
  "invitation_token": "uuid-token",
  "password": "SecurePass123!",   // required if new user
  "department": "sales"
}
```

**Response** (200 OK):
```json
{
  "detail": "Invitation accepted successfully.",
  "user": { "id": 5, "email": "teammate@example.com", "account_type": "company" },
  "company": { "id": 1, "name": "Acme Corp" },
  "tokens": { "access": "...", "refresh": "..." }
}
```

---

### 🔔 PATCH `/api/notifications/{id}/read/`
Mark notification as read.

**Status**: NOT IMPLEMENTED

**Authentication**: Bearer token required

---

## 🔐 Authentication

All protected endpoints require a JWT access token in the Authorization header:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Token Expiration
- **Access Token**: 1 hour
- **Refresh Token**: 7 days

### Error Responses

**401 Unauthorized**:
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden**:
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found**:
```json
{
  "detail": "Not found."
}
```

**500 Internal Server Error**:
```json
{
  "detail": "Internal server error."
}
```

---

## Customer Management (B2B) - Phase 5.2

Companies can manage their customer relationships, including adding customers, assigning account managers, tracking orders, and segmenting customers.

### List Customers

**GET** `/api/customers/`

List all customers linked to the company with filtering, searching, sorting, and pagination.

**Query Parameters**:
- `status` (string): Filter by customer status (`active`, `inactive`, `blocked`)
- `verified` (boolean): Filter by verification status
- `tags` (array): Filter by tag IDs
- `account_manager` (integer): Filter by account manager ID
- `since_from` (datetime): Filter by customer_since date (from)
- `since_to` (datetime): Filter by customer_since date (to)
- `search` (string): Search by name, email, phone, or company name
- `sort_by` (string): Sort field (e.g., `name`, `-lifetime_value`, `last_order_date`)
- `page` (integer): Page number (default: 1)
- `page_size` (integer): Items per page (default: 20)

**Response** (200 OK):
```json
{
  "count": 150,
  "page": 1,
  "page_size": 20,
  "total_pages": 8,
  "results": [
    {
      "id": 1,
      "customer_id": 45,
      "customer_email": "john.doe@example.com",
      "customer_name": "John Doe",
      "customer_phone": "+1234567890",
      "company_name": "Acme Corp",
      "lifetime_value": 15750.00,
      "total_orders": 12,
      "last_order_date": "2025-11-10T14:30:00Z",
      "tags": [
        {
          "id": 1,
          "name": "VIP",
          "color": "#FFD700",
          "created_at": "2025-01-15T10:00:00Z"
        }
      ],
      "customer_status": "active",
      "customer_since": "2024-06-15T09:30:00Z",
      "account_manager": {
        "id": 5,
        "email": "manager@company.com",
        "first_name": "Sarah",
        "last_name": "Johnson",
        "role": "sales_manager"
      },
      "verified": true,
      "notes": "High-value customer, requires premium support"
    }
  ]
}
```

### Add Customer to Company

**POST** `/api/customers/`

Add an existing customer to the company or create a new customer.

**Request Body**:
```json
{
  "email": "customer@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone_number": "+1234567890",
  "company_name": "Tech Solutions Inc",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "postal_code": "10001",
  "notes": "Referred by John Doe"
}
```

**Response** (201 Created):
```json
{
  "message": "Customer added successfully",
  "customer": {
    "id": 2,
    "customer": {
      "id": 46,
      "email": "customer@example.com",
      "first_name": "Jane",
      "last_name": "Smith",
      "phone_number": "+1234567890",
      "company_name": "Tech Solutions Inc",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "postal_code": "10001"
    },
    "verified": false,
    "customer_status": "active",
    "notes": "Referred by John Doe",
    "recent_orders": [],
    "order_count": 0,
    "total_spent": 0.00
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "email": ["This customer is already linked to your company."]
}
```

### Get Customer Details

**GET** `/api/customers/{customer_id}/`

Get full customer details including order history and interactions.

**Response** (200 OK):
```json
{
  "id": 1,
  "customer": {
    "id": 45,
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+1234567890",
    "company_name": "Acme Corp",
    "address": "456 Oak Ave",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "postal_code": "94102"
  },
  "profile": {
    "id": 1,
    "customer_type": "business",
    "company_size": "50-200",
    "industry": "Technology",
    "annual_revenue": 5000000.00,
    "preferences": {
      "contact_method": "email",
      "newsletter": true
    },
    "lifetime_value": 15750.00,
    "total_orders": 12,
    "last_order_date": "2025-11-10T14:30:00Z",
    "tags": [
      {
        "id": 1,
        "name": "VIP",
        "color": "#FFD700"
      }
    ],
    "notes": "Tech-savvy, prefers API integration"
  },
  "verified": true,
  "customer_since": "2024-06-15T09:30:00Z",
  "customer_status": "active",
  "account_manager": {
    "id": 5,
    "email": "manager@company.com",
    "first_name": "Sarah",
    "last_name": "Johnson",
    "role": "sales_manager"
  },
  "notes": "High-value customer, requires premium support",
  "recent_orders": [
    {
      "id": 25,
      "order_number": "ORD-2025-0025",
      "title": "Annual Subscription Renewal",
      "status": "delivered",
      "total_amount": 2500.00,
      "currency": "USD",
      "order_date": "2025-11-10T14:30:00Z",
      "payment_status": "paid"
    }
  ],
  "order_count": 12,
  "total_spent": 15750.00,
  "recent_interactions": [
    {
      "id": 50,
      "interaction_type": "call",
      "subject": "Subscription renewal discussion",
      "sentiment": "positive",
      "user_name": "Sarah Johnson",
      "created_at": "2025-11-09T15:00:00Z"
    }
  ],
  "interaction_count": 24
}
```

### Update Customer

**PUT** `/api/customers/{customer_id}/`

Update customer relationship information.

**Request Body**:
```json
{
  "notes": "Updated notes about the customer",
  "customer_status": "active",
  "tag_ids": [1, 3, 5],
  "account_manager_id": 7
}
```

**Response** (200 OK):
```json
{
  "message": "Customer updated successfully",
  "customer": { /* full customer details */ }
}
```

### Assign Account Manager

**POST** `/api/customers/{customer_id}/assign-manager/`

Assign a company user as the account manager for this customer.

**Request Body**:
```json
{
  "account_manager_id": 5
}
```

**Response** (200 OK):
```json
{
  "message": "Account manager Sarah Johnson assigned successfully",
  "customer": { /* full customer details */ }
}
```

**Error Response** (400 Bad Request):
```json
{
  "account_manager_id": [
    "Account manager must have CEO, Manager, or Sales Manager role."
  ]
}
```

### Verify Customer

**POST** `/api/customers/{customer_id}/verify/`

Verify the customer's link to the company. This sets `verified=True` and records `customer_since` date.

**Response** (200 OK):
```json
{
  "message": "Customer verified successfully",
  "customer": { /* full customer details */ }
}
```

**Error Response** (400 Bad Request):
```json
{
  "message": "Customer is already verified"
}
```

### Unlink Customer

**DELETE** `/api/customers/{customer_id}/unlink/`

Remove the customer from the company. The customer profile remains intact.

**Response** (200 OK):
```json
{
  "message": "Customer john.doe@example.com unlinked successfully"
}
```

### Customer Statistics

**GET** `/api/customers/stats/`

Get comprehensive customer statistics for the company.

**Response** (200 OK):
```json
{
  "total_customers": 150,
  "active_customers": 132,
  "inactive_customers": 15,
  "verified_customers": 145,
  "total_lifetime_value": 485750.50,
  "average_order_value": 850.25,
  "customers_by_tag": [
    {
      "tag_name": "VIP",
      "tag_color": "#FFD700",
      "count": 25
    },
    {
      "tag_name": "At Risk",
      "tag_color": "#FF6B6B",
      "count": 8
    }
  ],
  "new_customers_this_month": 12,
  "customers_at_risk": 8,
  "top_customers": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "lifetime_value": 15750.00,
      "total_orders": 12
    }
  ]
}
```

### List Customer Tags

**GET** `/api/customers/tags/`

List all tags for the company.

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "VIP",
    "color": "#FFD700",
    "created_at": "2025-01-15T10:00:00Z"
  },
  {
    "id": 2,
    "name": "At Risk",
    "color": "#FF6B6B",
    "created_at": "2025-02-20T14:30:00Z"
  }
]
```

### Create Customer Tag

**POST** `/api/customers/tags/`

Create a new customer tag.

**Request Body**:
```json
{
  "name": "High Value",
  "color": "#4CAF50"
}
```

**Response** (201 Created):
```json
{
  "id": 3,
  "name": "High Value",
  "color": "#4CAF50",
  "created_at": "2025-11-15T10:00:00Z"
}
```

### Update Customer Tag

**PUT** `/api/customers/tags/{tag_id}/`

Update a customer tag.

**Request Body**:
```json
{
  "name": "Premium Customer",
  "color": "#9C27B0"
}
```

**Response** (200 OK):
```json
{
  "id": 3,
  "name": "Premium Customer",
  "color": "#9C27B0",
  "created_at": "2025-11-15T10:00:00Z"
}
```

### Delete Customer Tag

**DELETE** `/api/customers/tags/{tag_id}/`

Delete a customer tag.

**Response** (204 No Content)

### List Customer Segments

**GET** `/api/customers/segments/`

List all customer segments for the company.

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "High Value Customers",
    "description": "Customers with lifetime value > $10,000",
    "criteria": {
      "lifetime_value_min": 10000,
      "customer_status": "active"
    },
    "created_by_name": "Sarah Johnson",
    "customer_count": 35,
    "created_at": "2025-03-01T09:00:00Z",
    "updated_at": "2025-03-01T09:00:00Z"
  }
]
```

### Create Customer Segment

**POST** `/api/customers/segments/`

Create a new customer segment with custom criteria.

**Request Body**:
```json
{
  "name": "Inactive Customers",
  "description": "Customers with no orders in 90 days",
  "criteria": {
    "last_order_days_ago": 90,
    "customer_status": "active"
  }
}
```

**Response** (201 Created):
```json
{
  "id": 2,
  "name": "Inactive Customers",
  "description": "Customers with no orders in 90 days",
  "criteria": {
    "last_order_days_ago": 90,
    "customer_status": "active"
  },
  "created_by_name": "John Smith",
  "customer_count": 0,
  "created_at": "2025-11-15T10:30:00Z",
  "updated_at": "2025-11-15T10:30:00Z"
}
```

### Get Customers by Segment

**GET** `/api/customers/segments/{segment_id}/customers/`

Get all customers matching a segment's criteria.

**Query Parameters**:
- `page` (integer): Page number (default: 1)
- `page_size` (integer): Items per page (default: 20)

**Response** (200 OK):
```json
{
  "segment": {
    "id": 1,
    "name": "High Value Customers",
    "description": "Customers with lifetime value > $10,000"
  },
  "count": 35,
  "page": 1,
  "page_size": 20,
  "total_pages": 2,
  "results": [
    { /* customer list data */ }
  ]
}
```

---

## Order Management - Phase 5.3

Companies can manage customer orders, track shipments, and analyze order statistics.

### List Orders

**GET** `/api/orders/`

List all orders for the company with filtering, searching, sorting, and pagination.

**Query Parameters**:
- `status` (string): Filter by order status (`pending`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`)
- `payment_status` (string): Filter by payment status (`pending`, `paid`, `failed`, `refunded`)
- `customer` (integer): Filter by customer ID
- `date_from` (datetime): Filter by order date (from)
- `date_to` (datetime): Filter by order date (to)
- `search` (string): Search by order number or customer name
- `sort_by` (string): Sort field (e.g., `order_date`, `-total_amount`)
- `page` (integer): Page number (default: 1)
- `page_size` (integer): Items per page (default: 20)

**Response** (200 OK):
```json
{
  "count": 250,
  "page": 1,
  "page_size": 20,
  "total_pages": 13,
  "results": [
    {
      "id": 1,
      "order_number": "ORD-2025-12345",
      "customer_name": "John Doe",
      "customer_email": "john.doe@example.com",
      "title": "Monthly subscription renewal",
      "status": "delivered",
      "payment_status": "paid",
      "total_amount": 299.99,
      "currency": "USD",
      "order_date": "2025-11-01T10:30:00Z",
      "expected_delivery_date": "2025-11-05",
      "item_count": 3,
      "created_at": "2025-11-01T10:30:00Z"
    }
  ]
}
```

### Create Order

**POST** `/api/orders/`

Create a new order with items.

**Request Body**:
```json
{
  "customer_id": 45,
  "title": "Product Purchase",
  "description": "Standard product order",
  "currency": "USD",
  "expected_delivery_date": "2025-11-25",
  "shipping_address": "123 Main St, New York, NY 10001",
  "billing_address": "123 Main St, New York, NY 10001",
  "payment_method": "credit_card",
  "notes": "Customer requested express delivery",
  "items": [
    {
      "product_name": "Premium Widget",
      "product_sku": "WDG-001",
      "quantity": 2,
      "unit_price": 99.99,
      "discount": 10.00,
      "tax": 15.00
    },
    {
      "product_name": "Basic Widget",
      "product_sku": "WDG-002",
      "quantity": 1,
      "unit_price": 49.99,
      "discount": 0.00,
      "tax": 4.00
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "message": "Order created successfully",
  "order": {
    "id": 26,
    "order_number": "ORD-2025-67890",
    "customer": {
      "id": 45,
      "email": "john.doe@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone_number": "+1234567890",
      "company_name": "Acme Corp"
    },
    "title": "Product Purchase",
    "description": "Standard product order",
    "status": "pending",
    "payment_status": "pending",
    "payment_method": "credit_card",
    "total_amount": 258.97,
    "currency": "USD",
    "order_date": "2025-11-15T14:30:00Z",
    "expected_delivery_date": "2025-11-25",
    "actual_delivery_date": null,
    "shipping_address": "123 Main St, New York, NY 10001",
    "billing_address": "123 Main St, New York, NY 10001",
    "tracking_number": "",
    "notes": "Customer requested express delivery",
    "items": [
      {
        "id": 45,
        "product_name": "Premium Widget",
        "product_sku": "WDG-001",
        "quantity": 2,
        "unit_price": 99.99,
        "discount": 10.00,
        "tax": 15.00,
        "total_price": 204.98,
        "created_at": "2025-11-15T14:30:00Z"
      },
      {
        "id": 46,
        "product_name": "Basic Widget",
        "product_sku": "WDG-002",
        "quantity": 1,
        "unit_price": 49.99,
        "discount": 0.00,
        "tax": 4.00,
        "total_price": 53.99,
        "created_at": "2025-11-15T14:30:00Z"
      }
    ],
    "created_by_name": "Test CEO",
    "created_at": "2025-11-15T14:30:00Z",
    "updated_at": "2025-11-15T14:30:00Z"
  }
}
```

### Get Order Details

**GET** `/api/orders/{order_id}/`

Get full order details including all items.

**Response** (200 OK):
```json
{
  "id": 26,
  "order_number": "ORD-2025-67890",
  "customer": { /* customer details */ },
  "title": "Product Purchase",
  "status": "processing",
  "total_amount": 258.97,
  "items": [ /* order items */ ]
}
```

### Update Order

**PUT** `/api/orders/{order_id}/`

Update order information.

**Request Body**:
```json
{
  "status": "shipped",
  "payment_status": "paid",
  "tracking_number": "TRACK123456",
  "expected_delivery_date": "2025-11-20",
  "notes": "Package shipped via FedEx"
}
```

**Response** (200 OK):
```json
{
  "message": "Order updated successfully",
  "order": { /* full order details */ }
}
```

### Update Order Status

**POST** `/api/orders/{order_id}/update-status/`

Update order status and create interaction log.

**Request Body**:
```json
{
  "status": "delivered",
  "notes": "Package delivered successfully"
}
```

**Response** (200 OK):
```json
{
  "message": "Order status updated to delivered",
  "order": { /* full order details */ }
}
```

**Status Options**:
- `pending` - Order placed, awaiting processing
- `processing` - Order being prepared
- `shipped` - Order shipped to customer
- `delivered` - Order delivered (auto-sets actual_delivery_date)
- `cancelled` - Order cancelled
- `refunded` - Order refunded

### Cancel Order

**DELETE** `/api/orders/{order_id}/`

Cancel an order (sets status to cancelled).

**Response** (200 OK):
```json
{
  "message": "Order cancelled successfully",
  "order": { /* order details */ }
}
```

**Error Response** (400 Bad Request):
```json
{
  "detail": "Cannot cancel delivered order"
}
```

### Add Item to Order

**POST** `/api/orders/{order_id}/add-item/`

Add a new item to an existing order.

**Request Body**:
```json
{
  "product_name": "Extra Widget",
  "product_sku": "WDG-003",
  "quantity": 1,
  "unit_price": 29.99,
  "discount": 0.00,
  "tax": 2.50
}
```

**Response** (201 Created):
```json
{
  "message": "Item added successfully",
  "item": {
    "id": 47,
    "product_name": "Extra Widget",
    "product_sku": "WDG-003",
    "quantity": 1,
    "unit_price": 29.99,
    "discount": 0.00,
    "tax": 2.50,
    "total_price": 32.49
  },
  "order_total": 291.46
}
```

### Remove Item from Order

**DELETE** `/api/orders/{order_id}/items/{item_id}/`

Remove an item from an order.

**Response** (200 OK):
```json
{
  "message": "Item removed successfully",
  "order_total": 258.97
}
```

**Error Response** (400 Bad Request):
```json
{
  "detail": "Cannot remove last item from order"
}
```

### Get Customer Orders

**GET** `/api/orders/customer/{customer_id}/`

Get all orders for a specific customer.

**Query Parameters**:
- `page` (integer): Page number (default: 1)
- `page_size` (integer): Items per page (default: 20)

**Response** (200 OK):
```json
{
  "customer": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "stats": {
    "total_orders": 12,
    "total_spent": 3567.89,
    "average_order_value": 297.32
  },
  "count": 12,
  "page": 1,
  "page_size": 20,
  "total_pages": 1,
  "results": [ /* order list */ ]
}
```

### Order Statistics

**GET** `/api/orders/stats/`

Get comprehensive order statistics for the company.

**Response** (200 OK):
```json
{
  "total_orders": 250,
  "total_revenue": 75420.50,
  "orders_by_status": {
    "pending": 15,
    "processing": 8,
    "shipped": 12,
    "delivered": 195,
    "cancelled": 18,
    "refunded": 2
  },
  "average_order_value": 301.68,
  "orders_trend": [
    {
      "month": "2024-12-01T00:00:00Z",
      "count": 18,
      "revenue": 5234.50
    },
    {
      "month": "2025-01-01T00:00:00Z",
      "count": 22,
      "revenue": 6789.20
    }
  ],
  "top_customers": [
    {
      "customer_id": 45,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "order_count": 12,
      "total_spent": 3567.89
    }
  ],
  "pending_deliveries": [ /* list of orders pending delivery */ ]
}
```

---

## Customer Interaction Tracking - Phase 5.4

Track all interactions with customers across multiple touchpoints.

### List Interactions

**GET** `/api/interactions/`

List all customer interactions with filtering and pagination.

**Query Parameters**:
- `customer` (integer): Filter by customer ID
- `user` (integer): Filter by company user ID
- `interaction_type` (string): Filter by type (`call`, `email`, `meeting`, `support`, `purchase`, `inquiry`)
- `sentiment` (string): Filter by sentiment (`positive`, `neutral`, `negative`)
- `date_from` (datetime): Filter by date from
- `date_to` (datetime): Filter by date to
- `sort_by` (string): Sort field (default: `-created_at`)
- `page` (integer): Page number
- `page_size` (integer): Items per page

**Response** (200 OK):
```json
{
  "count": 150,
  "page": 1,
  "page_size": 20,
  "total_pages": 8,
  "results": [
    {
      "id": 1,
      "customer": 45,
      "customer_name": "John Doe",
      "customer_email": "john.doe@example.com",
      "user": 2,
      "user_name": "Sales Manager",
      "interaction_type": "call",
      "subject": "Product inquiry",
      "description": "Customer called regarding premium widget pricing",
      "sentiment": "positive",
      "created_at": "2025-11-15T10:30:00Z"
    }
  ]
}
```

### Create Interaction

**POST** `/api/interactions/`

Log a new customer interaction.

**Request Body**:
```json
{
  "customer_id": 45,
  "interaction_type": "meeting",
  "subject": "Quarterly business review",
  "description": "Discussed Q4 performance and 2026 goals. Customer satisfied with service.",
  "sentiment": "positive"
}
```

**Response** (201 Created):
```json
{
  "message": "Interaction logged successfully",
  "interaction": {
    "id": 156,
    "customer": 45,
    "customer_name": "John Doe",
    "customer_email": "john.doe@example.com",
    "user": 2,
    "user_name": "Sales Manager",
    "interaction_type": "meeting",
    "subject": "Quarterly business review",
    "description": "Discussed Q4 performance and 2026 goals. Customer satisfied with service.",
    "sentiment": "positive",
    "created_at": "2025-11-15T14:30:00Z"
  }
}
```

### Get Interaction Details

**GET** `/api/interactions/{interaction_id}/`

Get details of a specific interaction.

**Response** (200 OK):
```json
{
  "id": 156,
  "customer": 45,
  "customer_name": "John Doe",
  "customer_email": "john.doe@example.com",
  "user": 2,
  "user_name": "Sales Manager",
  "interaction_type": "meeting",
  "subject": "Quarterly business review",
  "description": "Discussed Q4 performance and 2026 goals. Customer satisfied with service.",
  "sentiment": "positive",
  "created_at": "2025-11-15T14:30:00Z"
}
```

### Update Interaction

**PUT** `/api/interactions/{interaction_id}/`

Update an existing interaction.

**Request Body**:
```json
{
  "subject": "Quarterly business review - Updated",
  "description": "Discussed Q4 performance, 2026 goals, and new product offerings.",
  "sentiment": "positive"
}
```

**Response** (200 OK):
```json
{
  "message": "Interaction updated successfully",
  "interaction": { /* updated interaction details */ }
}
```

### Delete Interaction

**DELETE** `/api/interactions/{interaction_id}/`

Delete an interaction.

**Response** (200 OK):
```json
{
  "message": "Interaction deleted successfully"
}
```

### Get Customer Interaction Timeline

**GET** `/api/customers/{customer_id}/interactions/`

Get all interactions for a specific customer (timeline view).

**Query Parameters**:
- `page` (integer): Page number
- `page_size` (integer): Items per page

**Response** (200 OK):
```json
{
  "customer": {
    "id": 45,
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "count": 24,
  "page": 1,
  "page_size": 20,
  "total_pages": 2,
  "results": [ /* interaction list sorted by date */ ]
}
```

### Interaction Statistics

**GET** `/api/interactions/stats/`

Get comprehensive interaction analytics.

**Response** (200 OK):
```json
{
  "total_interactions": 1250,
  "interactions_by_type": {
    "call": 450,
    "email": 320,
    "meeting": 180,
    "support": 200,
    "purchase": 80,
    "inquiry": 20
  },
  "interactions_by_sentiment": {
    "positive": 800,
    "neutral": 350,
    "negative": 100
  },
  "average_interactions_per_customer": 12.5,
  "most_active_customers": [
    {
      "customer_id": 45,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "interaction_count": 24
    }
  ],
  "interactions_trend": [
    {
      "date": "2025-11-01",
      "count": 45
    },
    {
      "date": "2025-11-02",
      "count": 38
    }
}
```

---

## Phase 5: Customer Management (IMPLEMENTED)

Company users can manage their customers (B2B relationships) with full CRUD operations, verification, tagging, segmentation, and interaction tracking.

### Customer List

**GET** `/api/customers/`

List all customers for the authenticated company user.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Query Parameters**:
- `page` (integer): Page number for pagination (default: 1)
- `page_size` (integer): Items per page (default: 20, max: 100)
- `search` (string): Search by name or email
- `status` (string): Filter by status: active, inactive, blocked
- `verified` (boolean): Filter by verification status
- `tags` (string): Comma-separated tag IDs
- `ordering` (string): Sort field (prefix with `-` for descending): created_at, lifetime_value, last_order_date

**Scope**:
- CEO/Manager: See all company customers
- Sales Manager: See team customers
- Support Staff: See own customers

**Response** (200 OK):
```json
{
  "count": 145,
  "next": "http://localhost:8000/api/customers/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": {
        "id": 5,
        "email": "customer@example.com",
        "first_name": "Jane",
        "last_name": "Smith",
        "phone": "+1234567890"
      },
      "verified": true,
      "customer_since": "2024-01-15T10:00:00Z",
      "customer_status": "active",
      "account_manager": {
        "id": 2,
        "name": "John Doe",
        "email": "john@company.com"
      },
      "profile": {
        "customer_type": "individual",
        "lifetime_value": 5678.90,
        "total_orders": 12,
        "last_order_date": "2025-11-10T14:30:00Z"
      },
      "tags": [
        {
          "id": 1,
          "name": "VIP",
          "color": "#ff6b6b"
        }
      ],
      "notes": "Prefers email communication",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2025-11-10T14:30:00Z"
    }
  ]
}
```

**Example**:
```bash
curl -X GET "http://localhost:8000/api/customers/?status=active&verified=true&ordering=-lifetime_value" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

### Customer Detail

**GET** `/api/customers/{id}/`

Get details of a specific customer.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Response** (200 OK):
```json
{
  "id": 1,
  "user": {
    "id": 5,
    "email": "customer@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+1234567890"
  },
  "verified": true,
  "customer_since": "2024-01-15T10:00:00Z",
  "customer_status": "active",
  "account_manager": {
    "id": 2,
    "name": "John Doe",
    "email": "john@company.com"
  },
  "profile": {
    "customer_type": "business",
    "company_size": "51-200",
    "industry": "Technology",
    "annual_revenue": 5000000.00,
    "preferences": {
      "communication_method": "email",
      "language": "en"
    },
    "lifetime_value": 5678.90,
    "total_orders": 12,
    "last_order_date": "2025-11-10T14:30:00Z",
    "notes": "Prefers email communication"
  },
  "tags": [
    {
      "id": 1,
      "name": "VIP",
      "color": "#ff6b6b"
    },
    {
      "id": 2,
      "name": "Enterprise",
      "color": "#4c6fff"
    }
  ],
  "recent_orders": [
    {
      "id": 45,
      "order_number": "ORD-2025-12345",
      "status": "delivered",
      "total_amount": 299.99,
      "order_date": "2025-11-10T14:30:00Z"
    }
  ],
  "recent_interactions": [
    {
      "id": 23,
      "interaction_type": "call",
      "subject": "Follow-up on order",
      "created_at": "2025-11-12T09:15:00Z"
    }
  ],
  "notes": "Key account with quarterly orders",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2025-11-10T14:30:00Z"
}
```

---

### Create Customer

**POST** `/api/customers/`

Add a new customer to the company.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Permission**: IsCompanyUser, CanManageCustomers

**Request**:
```json
{
  "email": "newcustomer@example.com",
  "first_name": "Alice",
  "last_name": "Johnson",
  "phone": "+1234567890",
  "customer_type": "individual",
  "tags": [1, 2],
  "notes": "Referred by existing customer"
}
```

**Response** (201 Created):
```json
{
  "id": 25,
  "user": {
    "id": 50,
    "email": "newcustomer@example.com",
    "first_name": "Alice",
    "last_name": "Johnson",
    "phone": "+1234567890"
  },
  "verified": false,
  "customer_since": null,
  "customer_status": "active",
  "account_manager": null,
  "profile": {
    "customer_type": "individual",
    "lifetime_value": 0.00,
    "total_orders": 0,
    "last_order_date": null
  },
  "tags": [
    {
      "id": 1,
      "name": "New",
      "color": "#4c6fff"
    }
  ],
  "notes": "Referred by existing customer",
  "created_at": "2025-11-16T10:00:00Z",
  "updated_at": "2025-11-16T10:00:00Z"
}
```

**Validation Errors** (400 Bad Request):
```json
{
  "email": ["Customer with this email already exists in your company."]
}
```

---

### Update Customer

**PUT/PATCH** `/api/customers/{id}/`

Update customer information.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Permission**: IsCompanyUser, CanManageCustomers

**Request** (PATCH example):
```json
{
  "customer_status": "inactive",
  "account_manager": 3,
  "tags": [1, 2, 3],
  "notes": "Updated account manager"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "customer_status": "inactive",
  "account_manager": {
    "id": 3,
    "name": "Sarah Williams",
    "email": "sarah@company.com"
  },
  "tags": [
    {"id": 1, "name": "VIP", "color": "#ff6b6b"},
    {"id": 2, "name": "Enterprise", "color": "#4c6fff"},
    {"id": 3, "name": "Priority", "color": "#51cf66"}
  ],
  "notes": "Updated account manager",
  "updated_at": "2025-11-16T10:30:00Z"
}
```

---

### Delete Customer

**DELETE** `/api/customers/{id}/`

Delete a customer (soft delete recommended, but this performs hard delete).

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Permission**: IsCompanyUser, IsCEOOrManager

**Response** (204 No Content)

---

### Verify Customer

**POST** `/api/customers/{id}/verify/`

Mark customer as verified (sets customer_since date automatically).

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Permission**: IsCompanyUser, CanManageCustomers

**Response** (200 OK):
```json
{
  "message": "Customer verified successfully",
  "customer": {
    "id": 1,
    "verified": true,
    "customer_since": "2025-11-16T10:45:00Z"
  }
}
```

---

### Customer Analytics

**GET** `/api/customers/analytics/`

Get customer statistics and analytics.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Response** (200 OK):
```json
{
  "total_customers": 145,
  "active_customers": 120,
  "verified_customers": 98,
  "total_lifetime_value": 567890.50,
  "average_lifetime_value": 3916.80,
  "customers_by_status": {
    "active": 120,
    "inactive": 20,
    "blocked": 5
  },
  "customers_by_type": {
    "individual": 89,
    "business": 56
  },
  "top_customers": [
    {
      "id": 5,
      "name": "John Smith",
      "lifetime_value": 15678.90,
      "total_orders": 45
    }
  ],
  "recent_verifications": 12,
  "growth_trend": {
    "this_month": 15,
    "last_month": 12,
    "growth_rate": 25.0
  }
}
```

---

## Phase 5: Order Management (IMPLEMENTED)

Company users can manage customer orders with full lifecycle tracking, status updates, and analytics.

### Order List

**GET** `/api/orders/`

List all orders for the authenticated company user.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Query Parameters**:
- `page` (integer): Page number
- `page_size` (integer): Items per page
- `search` (string): Search by order number or customer name
- `status` (string): Filter by status: pending, processing, shipped, delivered, cancelled, refunded
- `payment_status` (string): Filter by payment: pending, paid, failed, refunded
- `customer` (integer): Filter by customer ID
- `date_from` (date): Filter orders from date (YYYY-MM-DD)
- `date_to` (date): Filter orders to date
- `ordering` (string): Sort field: order_date, total_amount, status

**Response** (200 OK):
```json
{
  "count": 234,
  "next": "http://localhost:8000/api/orders/?page=2",
  "previous": null,
  "results": [
    {
      "id": 45,
      "order_number": "ORD-2025-12345",
      "customer": {
        "id": 1,
        "name": "Jane Smith",
        "email": "customer@example.com"
      },
      "title": "Monthly subscription",
      "status": "delivered",
      "payment_status": "paid",
      "total_amount": 299.99,
      "currency": "USD",
      "order_date": "2025-11-01T10:30:00Z",
      "expected_delivery_date": "2025-11-05",
      "actual_delivery_date": "2025-11-04",
      "items_count": 3,
      "created_by": {
        "id": 2,
        "name": "John Doe"
      },
      "created_at": "2025-11-01T10:30:00Z"
    }
  ]
}
```

---

### Order Detail

**GET** `/api/orders/{id}/`

Get details of a specific order including items.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Response** (200 OK):
```json
{
  "id": 45,
  "order_number": "ORD-2025-12345",
  "customer": {
    "id": 1,
    "name": "Jane Smith",
    "email": "customer@example.com",
    "phone": "+1234567890"
  },
  "title": "Monthly subscription",
  "description": "Premium subscription package with extras",
  "status": "delivered",
  "payment_status": "paid",
  "payment_method": "credit_card",
  "total_amount": 299.99,
  "currency": "USD",
  "order_date": "2025-11-01T10:30:00Z",
  "expected_delivery_date": "2025-11-05",
  "actual_delivery_date": "2025-11-04",
  "shipping_address": "123 Main St, New York, NY 10001",
  "billing_address": "123 Main St, New York, NY 10001",
  "tracking_number": "TRACK123456",
  "notes": "Handle with care",
  "items": [
    {
      "id": 89,
      "product_name": "Premium Widget",
      "product_sku": "WDG-001",
      "quantity": 2,
      "unit_price": 99.99,
      "discount": 10.00,
      "tax": 15.00,
      "total_price": 204.98,
      "created_at": "2025-11-01T10:30:00Z"
    },
    {
      "id": 90,
      "product_name": "Standard Accessory",
      "product_sku": "ACC-002",
      "quantity": 1,
      "unit_price": 95.00,
      "discount": 0.00,
      "tax": 0.01,
      "total_price": 95.01,
      "created_at": "2025-11-01T10:30:00Z"
    }
  ],
  "subtotal": 289.99,
  "total_discount": 10.00,
  "total_tax": 15.01,
  "total": 299.99,
  "status_history": [
    {
      "status": "pending",
      "timestamp": "2025-11-01T10:30:00Z",
      "note": "Order placed"
    },
    {
      "status": "processing",
      "timestamp": "2025-11-01T14:00:00Z",
      "note": "Payment confirmed"
    },
    {
      "status": "shipped",
      "timestamp": "2025-11-02T09:00:00Z",
      "note": "Shipped via FedEx"
    },
    {
      "status": "delivered",
      "timestamp": "2025-11-04T15:30:00Z",
      "note": "Delivered successfully"
    }
  ],
  "created_by": {
    "id": 2,
    "name": "John Doe",
    "email": "john@company.com"
  },
  "created_at": "2025-11-01T10:30:00Z",
  "updated_at": "2025-11-04T15:30:00Z"
}
```

---

### Create Order

**POST** `/api/orders/`

Create a new order for a customer.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Permission**: IsCompanyUser, CanManageOrders

**Request**:
```json
{
  "customer": 1,
  "title": "New order",
  "description": "Custom order for customer",
  "status": "pending",
  "payment_method": "credit_card",
  "payment_status": "pending",
  "expected_delivery_date": "2025-12-01",
  "shipping_address": "456 Oak St, Boston, MA 02101",
  "billing_address": "456 Oak St, Boston, MA 02101",
  "notes": "Rush order",
  "items": [
    {
      "product_name": "Product A",
      "product_sku": "PRD-A-001",
      "quantity": 2,
      "unit_price": 50.00,
      "discount": 5.00,
      "tax": 7.50
    },
    {
      "product_name": "Product B",
      "product_sku": "PRD-B-001",
      "quantity": 1,
      "unit_price": 100.00,
      "discount": 0.00,
      "tax": 8.00
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "id": 46,
  "order_number": "ORD-2025-12346",
  "customer": {
    "id": 1,
    "name": "Jane Smith",
    "email": "customer@example.com"
  },
  "title": "New order",
  "status": "pending",
  "payment_status": "pending",
  "total_amount": 203.50,
  "currency": "USD",
  "items": [
    {
      "id": 91,
      "product_name": "Product A",
      "quantity": 2,
      "unit_price": 50.00,
      "total_price": 102.50
    },
    {
      "id": 92,
      "product_name": "Product B",
      "quantity": 1,
      "unit_price": 100.00,
      "total_price": 108.00
    }
  ],
  "created_at": "2025-11-16T11:00:00Z"
}
```

**Note**: Order number is auto-generated. Total amount is calculated from items.

---

### Update Order

**PUT/PATCH** `/api/orders/{id}/`

Update order information.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Permission**: IsCompanyUser, CanManageOrders

**Request** (PATCH example):
```json
{
  "tracking_number": "TRACK789012",
  "notes": "Updated tracking information"
}
```

**Response** (200 OK):
```json
{
  "id": 45,
  "order_number": "ORD-2025-12345",
  "tracking_number": "TRACK789012",
  "notes": "Updated tracking information",
  "updated_at": "2025-11-16T11:15:00Z"
}
```

---

### Update Order Status

**PATCH** `/api/orders/{id}/update-status/`

Update order status with optional note.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Permission**: IsCompanyUser, CanManageOrders

**Request**:
```json
{
  "status": "shipped",
  "note": "Shipped via FedEx, tracking number: TRACK123"
}
```

**Response** (200 OK):
```json
{
  "message": "Order status updated successfully",
  "order": {
    "id": 45,
    "order_number": "ORD-2025-12345",
    "status": "shipped",
    "status_history": [
      {
        "status": "pending",
        "timestamp": "2025-11-01T10:30:00Z",
        "note": "Order placed"
      },
      {
        "status": "shipped",
        "timestamp": "2025-11-16T11:20:00Z",
        "note": "Shipped via FedEx, tracking number: TRACK123"
      }
    ]
  }
}
```

**Status Values**:
- `pending` - Order placed, awaiting processing
- `processing` - Order being prepared
- `shipped` - Order shipped to customer
- `delivered` - Order delivered successfully
- `cancelled` - Order cancelled
- `refunded` - Order refunded

---

### Delete Order

**DELETE** `/api/orders/{id}/`

Delete an order (typically only for pending orders).

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Permission**: IsCompanyUser, IsCEOOrManager

**Response** (204 No Content)

---

### Order Analytics

**GET** `/api/orders/analytics/`

Get order statistics and analytics.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Response** (200 OK):
```json
{
  "total_orders": 234,
  "total_revenue": 67890.50,
  "average_order_value": 290.13,
  "orders_by_status": {
    "pending": 15,
    "processing": 23,
    "shipped": 18,
    "delivered": 170,
    "cancelled": 5,
    "refunded": 3
  },
  "orders_by_payment_status": {
    "pending": 20,
    "paid": 205,
    "failed": 6,
    "refunded": 3
  },
  "revenue_trend": {
    "this_month": 12450.00,
    "last_month": 10890.00,
    "growth_rate": 14.3
  },
  "top_customers_by_orders": [
    {
      "customer_id": 5,
      "customer_name": "Jane Smith",
      "order_count": 45,
      "total_spent": 13456.78
    }
  ],
  "recent_orders": [
    {
      "id": 45,
      "order_number": "ORD-2025-12345",
      "customer_name": "Jane Smith",
      "total_amount": 299.99,
      "status": "delivered",
      "order_date": "2025-11-01T10:30:00Z"
    }
  ]
}
```

---

## Phase 5: Customer Interaction Tracking (IMPLEMENTED)

### Interaction List

**GET** `/api/customers/{customer_id}/interactions/`

List all interactions with a specific customer.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Query Parameters**:
- `interaction_type` (string): Filter by type: call, email, meeting, support, purchase, inquiry
- `date_from` (date): From date
- `date_to` (date): To date
- `ordering` (string): Sort by created_at

**Response** (200 OK):
```json
{
  "count": 23,
  "results": [
    {
      "id": 45,
      "interaction_type": "call",
      "subject": "Follow-up on order",
      "description": "Discussed delivery timeline and answered questions about product features",
      "sentiment": "positive",
      "user": {
        "id": 2,
        "name": "John Doe",
        "email": "john@company.com"
      },
      "created_at": "2025-11-12T09:15:00Z"
    }
  ]
}
```

---

### Create Interaction

**POST** `/api/customers/{customer_id}/interactions/`

Log a new interaction with a customer.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Permission**: IsCompanyUser

**Request**:
```json
{
  "interaction_type": "email",
  "subject": "Product inquiry",
  "description": "Customer asked about enterprise pricing and volume discounts",
  "sentiment": "neutral"
}
```

**Response** (201 Created):
```json
{
  "id": 46,
  "interaction_type": "email",
  "subject": "Product inquiry",
  "description": "Customer asked about enterprise pricing and volume discounts",
  "sentiment": "neutral",
  "user": {
    "id": 2,
    "name": "John Doe"
  },
  "created_at": "2025-11-16T11:30:00Z"
}
```

**Interaction Types**:
- `call` - Phone call
- `email` - Email communication
- `meeting` - In-person or virtual meeting
- `support` - Support ticket or help request
- `purchase` - Purchase-related interaction
- `inquiry` - General inquiry

**Sentiment Values**:
- `positive` - Positive interaction
- `neutral` - Neutral interaction
- `negative` - Negative interaction

---

## Phase 5: Customer Tags & Segments (IMPLEMENTED)

### Tag List

**GET** `/api/customers/tags/`

List all customer tags for the company.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Response** (200 OK):
```json
{
  "count": 8,
  "results": [
    {
      "id": 1,
      "name": "VIP",
      "color": "#ff6b6b",
      "customer_count": 12,
      "created_by": {
        "id": 2,
        "name": "John Doe"
      },
      "created_at": "2025-01-10T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Enterprise",
      "color": "#4c6fff",
      "customer_count": 8,
      "created_at": "2025-01-15T14:00:00Z"
    }
  ]
}
```

---

### Create Tag

**POST** `/api/customers/tags/`

Create a new customer tag.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Request**:
```json
{
  "name": "Priority",
  "color": "#51cf66"
}
```

**Response** (201 Created):
```json
{
  "id": 9,
  "name": "Priority",
  "color": "#51cf66",
  "customer_count": 0,
  "created_at": "2025-11-16T11:45:00Z"
}
```

---

### Segment List

**GET** `/api/customers/segments/`

List all customer segments.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Response** (200 OK):
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "name": "High Value Customers",
      "description": "Customers with lifetime value > $5000",
      "criteria": {
        "lifetime_value_min": 5000,
        "verified": true
      },
      "customer_count": 23,
      "created_by": {
        "id": 2,
        "name": "John Doe"
      },
      "created_at": "2025-01-20T10:00:00Z"
    }
  ]
}
```

---

### Create Segment

**POST** `/api/customers/segments/`

Create a new customer segment.

**Status**: ✅ IMPLEMENTED

**Authentication**: Company user only

**Request**:
```json
{
  "name": "Recent Customers",
  "description": "Customers joined in the last 30 days",
  "criteria": {
    "customer_since_days": 30,
    "status": "active"
  }
}
```

**Response** (201 Created):
```json
{
  "id": 6,
  "name": "Recent Customers",
  "description": "Customers joined in the last 30 days",
  "criteria": {
    "customer_since_days": 30,
    "status": "active"
  },
  "customer_count": 15,
  "created_at": "2025-11-16T12:00:00Z"
}
```

---

## Customer Portal APIs - Phase 5.5

Self-service portal for customers (B2C).

### Customer Dashboard

**GET** `/api/customer/dashboard/`

Get customer dashboard overview.

**Permission**: Customer only

**Response** (200 OK):
```json
{
  "linked_companies": [
    {
      "id": 1,
      "company_id": 5,
      "company_name": "Acme Corp",
      "company_phone": "+1234567890",
      "verified": true,
      "customer_status": "active",
      "customer_since": "2024-01-15T10:00:00Z",
      "account_manager_name": "Jane Smith",
      "account_manager_email": "jane.smith@acme.com",
      "order_count": 12,
      "total_spent": 3567.89,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total_orders": 25,
  "recent_orders": [
    {
      "id": 45,
      "order_number": "ORD-2025-12345",
      "company_name": "Acme Corp",
      "title": "Monthly subscription",
      "status": "delivered",
      "payment_status": "paid",
      "total_amount": 299.99,
      "currency": "USD",
      "order_date": "2025-11-01T10:30:00Z",
      "expected_delivery_date": "2025-11-05",
      "actual_delivery_date": "2025-11-04",
      "tracking_number": "TRACK123456",
      "item_count": 3,
      "created_at": "2025-11-01T10:30:00Z"
    }
  ],
  "active_complaints_count": 0,
  "pending_verifications_count": 1
}
```

### My Orders

**GET** `/api/customer/my-orders/`

List all customer's orders across all companies.

**Permission**: Customer only

**Query Parameters**:
- `company` (integer): Filter by company ID
- `status` (string): Filter by order status
- `date_from` (date): Filter by date from
- `date_to` (date): Filter by date to
- `sort_by` (string): Sort field (default: `-order_date`)
- `page` (integer): Page number
- `page_size` (integer): Items per page

**Response** (200 OK):
```json
{
  "count": 25,
  "page": 1,
  "page_size": 20,
  "total_pages": 2,
  "results": [ /* order list */ ]
}
```

### Order Details

**GET** `/api/customer/orders/{order_id}/`

View order details (customer can only see their own orders).

**Permission**: Customer only, IsOrderOwner

**Response** (200 OK):
```json
{
  "id": 45,
  "order_number": "ORD-2025-12345",
  "company_name": "Acme Corp",
  "company_phone": "+1234567890",
  "title": "Monthly subscription",
  "description": "Premium subscription package",
  "status": "delivered",
  "payment_status": "paid",
  "payment_method": "credit_card",
  "total_amount": 299.99,
  "currency": "USD",
  "order_date": "2025-11-01T10:30:00Z",
  "expected_delivery_date": "2025-11-05",
  "actual_delivery_date": "2025-11-04",
  "shipping_address": "123 Main St, New York, NY 10001",
  "billing_address": "123 Main St, New York, NY 10001",
  "tracking_number": "TRACK123456",
  "notes": "",
  "items": [
    {
      "id": 89,
      "product_name": "Premium Widget",
      "product_sku": "WDG-001",
      "quantity": 2,
      "unit_price": 99.99,
      "discount": 10.00,
      "tax": 15.00,
      "total_price": 204.98,
      "created_at": "2025-11-01T10:30:00Z"
    }
  ],
  "created_at": "2025-11-01T10:30:00Z",
  "updated_at": "2025-11-04T15:20:00Z"
}
```

### My Companies

**GET** `/api/customer/my-companies/`

List all companies customer is linked to.

**Permission**: Customer only

**Response** (200 OK):
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "company_id": 5,
      "company_name": "Acme Corp",
      "company_phone": "+1234567890",
      "verified": true,
      "customer_status": "active",
      "customer_since": "2024-01-15T10:00:00Z",
      "account_manager_name": "Jane Smith",
      "account_manager_email": "jane.smith@acme.com",
      "order_count": 12,
      "total_spent": 3567.89,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Request Verification

**POST** `/api/customer/request-verification/{company_id}/`

Request verification from a company.

**Permission**: Customer only

**Response** (201 Created):
```json
{
  "message": "Verification request sent successfully",
  "company": {
    "id": 5,
    "name": "Acme Corp"
  }
}
```

**Response** (200 OK - Already verified):
```json
{
  "message": "You are already verified with this company"
}
```

### Order Tracking

**GET** `/api/customer/orders/{order_id}/tracking/`

Track order shipping status and delivery.

**Permission**: Customer only, IsOrderOwner

**Response** (200 OK):
```json
{
  "order_number": "ORD-2025-12345",
  "status": "shipped",
  "payment_status": "paid",
  "order_date": "2025-11-01T10:30:00Z",
  "expected_delivery_date": "2025-11-20",
  "actual_delivery_date": null,
  "tracking_number": "TRACK123456",
  "days_until_delivery": 5,
  "shipping_address": "123 Main St, New York, NY 10001",
  "company": {
    "name": "Acme Corp",
    "phone": "+1234567890"
  },
  "timeline": [
    {
      "status": "pending",
      "label": "Order Placed",
      "completed": true,
      "date": "2025-11-01T10:30:00Z"
    },
    {
      "status": "processing",
      "label": "Processing",
      "completed": true,
      "date": null
    },
    {
      "status": "shipped",
      "label": "Shipped",
      "completed": false,
      "date": null
    },
    {
      "status": "delivered",
      "label": "Delivered",
      "completed": false,
      "date": null
    }
  ]
}
```

---

## Phase 7: Call System (IMPLEMENTED)

### Overview
Complete call management system with Twilio integration for making/receiving calls, managing phone numbers, call recordings, voicemail, and analytics.

**Status**: ✅ IMPLEMENTED (Phase 7.1, 7.2, 7.3, 7.4)

**Base Path**: `/api/calls/`

### Permissions
- `IsCompanyUser`: Required for all endpoints (authenticated company account)
- `CanManagePhoneNumbers`: CEO and Managers only (for purchasing/deleting phone numbers)

### Phone Number Management

#### List Phone Numbers

**GET** `/api/calls/phone-numbers/`

List all phone numbers for the company.

**Query Parameters**:
- `company_id` (integer): Filter by specific company
- `is_active` (boolean): Filter by active status

**Response** (200 OK):
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "company": 1,
      "user": {
        "id": 2,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@company.com"
      },
      "phone_number": "+1234567890",
      "country_code": "+1",
      "number_type": "Mobile",
      "provider": "Twilio",
      "twilio_phone_sid": "PN1234567890abcdef",
      "is_active": true,
      "is_default": true,
      "capabilities": {
        "voice": true,
        "sms": true,
        "mms": false
      },
      "monthly_cost": "1.00",
      "purchased_at": "2025-11-16T10:00:00Z",
      "created_at": "2025-11-16T10:00:00Z",
      "call_count": 45
    }
  ]
}
```

---

#### Search Available Numbers

**GET** `/api/calls/phone-numbers/available/`

Search Twilio for available phone numbers to purchase.

**Permission**: IsCompanyUser, CanManagePhoneNumbers

**Query Parameters**:
- `area_code` (string, required): Area code to search (e.g., "415")
- `country` (string): Country code (default: "US")

**Response** (200 OK):
```json
[
  {
    "phone_number": "+14155551234",
    "friendly_name": "(415) 555-1234",
    "locality": "San Francisco",
    "region": "CA",
    "postal_code": "94102",
    "iso_country": "US",
    "capabilities": {
      "voice": true,
      "sms": true,
      "mms": false
    }
  }
]
```

---

#### Purchase Phone Number

**POST** `/api/calls/phone-numbers/purchase/`

Purchase a phone number from Twilio.

**Permission**: IsCompanyUser, CanManagePhoneNumbers

**Request**:
```json
{
  "area_code": "415",
  "country": "US",
  "user_id": 2
}
```

**Response** (201 Created):
```json
{
  "id": 2,
  "phone_number": "+14155551234",
  "twilio_phone_sid": "PN1234567890abcdef",
  "capabilities": {
    "voice": true,
    "sms": true
  },
  "country_code": "+1",
  "number_type": "Mobile",
  "is_active": true,
  "monthly_cost": "1.00",
  "created_at": "2025-11-16T11:00:00Z"
}
```

---

#### Phone Number Detail

**GET** `/api/calls/phone-numbers/{id}/`

Get phone number details.

**PUT** `/api/calls/phone-numbers/{id}/`

Update phone number settings (is_default, etc.).

**DELETE** `/api/calls/phone-numbers/{id}/`

Release number from Twilio and deactivate (CEO/Manager only).

**Response** (204 No Content)

---

#### Set Default Number

**POST** `/api/calls/phone-numbers/{id}/set-default/`

Set phone number as default for user.

**Response** (200 OK):
```json
{
  "id": 1,
  "phone_number": "+1234567890",
  "is_default": true,
  ...
}
```

---

### Call Management

#### List Calls

**GET** `/api/calls/`

List all calls for company with filters.

**Query Parameters**:
- `company_id` (integer): Filter by company
- `user` (integer): Filter by user ID
- `direction` (string): Filter by direction (Inbound, Outbound)
- `status` (string): Filter by status
- `lead_id` (integer): Filter by lead
- `deal_id` (integer): Filter by deal
- `customer_id` (integer): Filter by customer
- `start_date` (date): Filter from date
- `end_date` (date): Filter to date
- `search` (string): Search by phone number
- `sort_by` (string): Sort field (start_time, duration, created_at)

**Response** (200 OK):
```json
{
  "count": 150,
  "results": [
    {
      "id": 1,
      "phone_number": "+1234567890",
      "user": {
        "id": 2,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@company.com"
      },
      "lead": {
        "id": 5,
        "name": "Jane Smith"
      },
      "deal": null,
      "customer": null,
      "direction": "Outbound",
      "from_number": "+1234567890",
      "to_number": "+1987654321",
      "status": "Completed",
      "duration": 180,
      "start_time": "2025-11-16T10:00:00Z",
      "end_time": "2025-11-16T10:03:00Z",
      "recording_url": "https://api.twilio.com/...",
      "disposition": "Connected",
      "created_at": "2025-11-16T10:00:00Z"
    }
  ]
}
```

---

#### Make Call

**POST** `/api/calls/make/`

Initiate outbound call via Twilio.

**Request**:
```json
{
  "to_number": "+1987654321",
  "from_number_id": 1,
  "lead_id": 5,
  "deal_id": null,
  "customer_id": null,
  "record": true
}
```

**Response** (201 Created):
```json
{
  "id": 2,
  "twilio_call_sid": "CA1234567890abcdef",
  "status": "Initiated",
  "from_number": "+1234567890",
  "to_number": "+1987654321",
  "direction": "Outbound",
  "user": {
    "id": 2,
    "first_name": "John",
    "last_name": "Doe"
  },
  "lead": {
    "id": 5,
    "name": "Jane Smith"
  },
  "created_at": "2025-11-16T11:00:00Z"
}
```

---

#### Call Detail

**GET** `/api/calls/{id}/`

Get full call details with recording and notes.

**Response** (200 OK):
```json
{
  "id": 1,
  "company": 1,
  "phone_number": {
    "id": 1,
    "phone_number": "+1234567890",
    ...
  },
  "user": {
    "id": 2,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@company.com"
  },
  "lead": {
    "id": 5,
    "name": "Jane Smith"
  },
  "direction": "Outbound",
  "from_number": "+1234567890",
  "to_number": "+1987654321",
  "status": "Completed",
  "duration": 180,
  "start_time": "2025-11-16T10:00:00Z",
  "end_time": "2025-11-16T10:03:00Z",
  "recording_url": "https://api.twilio.com/...",
  "recording_duration": 180,
  "twilio_call_sid": "CA1234567890abcdef",
  "price": "0.0234",
  "price_unit": "USD",
  "notes": "Follow-up call regarding pricing",
  "disposition": "Connected",
  "recordings": [
    {
      "id": 1,
      "recording_url": "https://api.twilio.com/...",
      "recording_sid": "RE1234567890abcdef",
      "duration": 180,
      "file_size": 144000,
      "transcription": "Hello, this is a test call...",
      "created_at": "2025-11-16T10:03:00Z"
    }
  ],
  "call_notes": [
    {
      "id": 1,
      "user": {
        "id": 2,
        "first_name": "John",
        "last_name": "Doe"
      },
      "note": "Customer interested in enterprise plan",
      "created_at": "2025-11-16T10:05:00Z"
    }
  ],
  "created_at": "2025-11-16T10:00:00Z"
}
```

---

#### Update Call

**PUT/PATCH** `/api/calls/{id}/`

Update call (disposition, notes).

**Request**:
```json
{
  "disposition": "Connected",
  "notes": "Customer confirmed interest in enterprise plan"
}
```

**Response** (200 OK): Full call details

---

#### End Call

**POST** `/api/calls/{id}/end/`

End active call.

**Response** (200 OK): Updated call details

---

#### Get Call Recording

**GET** `/api/calls/{id}/recording/`

Get recording URL and details.

**Response** (200 OK):
```json
{
  "recording_url": "https://api.twilio.com/...",
  "recording_duration": 180,
  "recordings": [
    {
      "recording_url": "https://api.twilio.com/...",
      "duration": 180,
      "transcription": "Hello, this is a test call..."
    }
  ]
}
```

---

#### Add Call Note

**POST** `/api/calls/{id}/notes/`

Add note to call.

**Request**:
```json
{
  "note": "Customer requested callback tomorrow"
}
```

**Response** (201 Created):
```json
{
  "id": 2,
  "call": 1,
  "user": {
    "id": 2,
    "first_name": "John",
    "last_name": "Doe"
  },
  "note": "Customer requested callback tomorrow",
  "created_at": "2025-11-16T11:15:00Z"
}
```

---

#### Call Statistics

**GET** `/api/calls/stats/`

Get call statistics and analytics.

**Query Parameters**:
- `company_id` (integer): Filter by company
- `start_date` (date): Filter from date
- `end_date` (date): Filter to date

**Response** (200 OK):
```json
{
  "total_calls": 150,
  "calls_by_direction": [
    {"direction": "Inbound", "count": 80},
    {"direction": "Outbound", "count": 70}
  ],
  "calls_by_status": [
    {"status": "Completed", "count": 120},
    {"status": "NoAnswer", "count": 20},
    {"status": "Failed", "count": 10}
  ],
  "calls_by_user": [
    {
      "user__first_name": "John",
      "user__last_name": "Doe",
      "user__email": "john@company.com",
      "count": 45
    }
  ],
  "average_duration": 180.5,
  "answer_rate": 80.0,
  "call_volume_trend": [
    {"day": "2025-11-01", "count": 5},
    {"day": "2025-11-02", "count": 8}
  ]
}
```

---

### Voicemail Management

#### List Voicemails

**GET** `/api/calls/voicemails/`

List voicemail messages.

**Query Parameters**:
- `company_id` (integer): Filter by company
- `is_listened` (boolean): Filter by listened status

**Response** (200 OK):
```json
{
  "count": 12,
  "results": [
    {
      "id": 1,
      "company": 1,
      "phone_number": "+1234567890",
      "from_number": "+1987654321",
      "duration": 45,
      "recording_url": "https://api.twilio.com/...",
      "transcription": "Hello, this is a voicemail message...",
      "is_listened": false,
      "listened_at": null,
      "listened_by": null,
      "created_at": "2025-11-16T09:00:00Z"
    }
  ]
}
```

---

#### Voicemail Detail

**GET** `/api/calls/voicemails/{id}/`

Get voicemail details.

**PUT/PATCH** `/api/calls/voicemails/{id}/`

Mark voicemail as listened.

**Request**:
```json
{
  "is_listened": true
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "from_number": "+1987654321",
  "duration": 45,
  "recording_url": "https://api.twilio.com/...",
  "transcription": "Hello, this is a voicemail message...",
  "is_listened": true,
  "listened_at": "2025-11-16T11:30:00Z",
  "listened_by": {
    "id": 2,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@company.com"
  },
  "created_at": "2025-11-16T09:00:00Z"
}
```

---

### Webhook Endpoints

These endpoints are called by Twilio and do not require authentication (signature verified).

#### Incoming Call Webhook

**POST** `/api/calls/webhook/incoming/`

Handle incoming call from Twilio.

**Authentication**: None (Twilio signature verified)

**Response**: TwiML XML

---

#### Status Callback Webhook

**POST** `/api/calls/webhook/status/`

Handle call status updates from Twilio.

**Authentication**: None (Twilio signature verified)

**Response** (200 OK):
```json
{
  "status": "updated"
}
```

---

#### Recording Webhook

**POST** `/api/calls/webhook/recording/`

Handle recording ready callback from Twilio.

**Authentication**: None (Twilio signature verified)

**Response** (200 OK):
```json
{
  "status": "recording saved"
}
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All endpoints support CORS for configured origins
- Rate limiting will be implemented in Phase 14
- API versioning to be added in future phases
- Customer portal endpoints require customer account authentication
- Company endpoints require company user authentication with appropriate permissions

---

**Last Updated**: November 16, 2025  
**API Version**: 1.0 (Phase 5 - Customer Management & Order Management COMPLETED)
