# 🗄️ Database Schema

## 📊 Current State

**Database**: PostgreSQL  
**ORM**: Django ORM  
**Status**: Phase 7.1 - Call Database Design COMPLETED  
**Last Updated**: December 2024

---

## ✅ Implemented Tables (Phase 2)

### authentication_user
Custom user model extending Django's AbstractUser.

**Table Name**: `authentication_user`  
**Inherits**: All fields from AbstractUser (id, username, email, password, first_name, last_name, is_active, is_staff, is_superuser, date_joined, last_login)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer (PK) | Primary Key, Auto-increment | Unique identifier |
| username | String(150) | Unique, Indexed | Username (auto-generated from email) |
| email | String(254) | Unique, Not Null, Indexed | User email (login) |
| password | String(128) | Not Null | Hashed password (PBKDF2) |
| first_name | String(150) | Not Null | First name |
| last_name | String(150) | Not Null | Last name |
| account_type | String(16) | Not Null | 'company' or 'customer' |
| phone | String(32) | Nullable | Phone number |
| is_verified | Boolean | Default: False | Email verification status |
| is_active | Boolean | Default: True | Account active status |
| is_staff | Boolean | Default: False | Staff access |
| is_superuser | Boolean | Default: False | Admin access |
| date_joined | DateTime | Auto, Not Null | Registration timestamp |
| last_login | DateTime | Nullable | Last login timestamp |
| created_at | DateTime | Auto, Not Null | Creation timestamp |
| updated_at | DateTime | Auto, Not Null | Last update timestamp |

**Indexes**: 
- `email` (unique)
- `username` (unique)
- `account_type`

**Constraints**:
- `account_type` must be 'company' or 'customer'
- Email must be unique and valid format
- Password must be at least 8 characters

---

### authentication_company
Company/organization information for B2B users.

**Table Name**: `authentication_company`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer (PK) | Primary Key, Auto-increment | Unique identifier |
| company_name | String(255) | Not Null | Company name |
| logo | ImageField | Nullable | Company logo (upload_to='company_logos/') |
| website | URLField(200) | Nullable | Company website URL |
| industry | String(32) | Nullable | Industry type |
| description | Text | Nullable | Company description |
| phone | String(32) | Nullable | Company phone |
| employee_count | Integer | Nullable, Positive | Number of employees |
| address | Text | Nullable | Company physical address |
| city | String(100) | Nullable | Company city |
| country | String(100) | Nullable | Company country |
| timezone | String(100) | Nullable | Company timezone |
| created_by_id | Integer (FK) | Foreign Key → User | Creator user |
| is_active | Boolean | Default: True | Company active status |
| created_at | DateTime | Auto, Not Null | Creation timestamp |
| updated_at | DateTime | Auto, Not Null | Last update timestamp |

**Indexes**: 
- `created_by_id`
- `is_active`
- `industry`

**Foreign Keys**:
- `created_by_id` → `authentication_user(id)` ON DELETE CASCADE

**Industry Choices**:
- `technology` - Technology
- `healthcare` - Healthcare
- `finance` - Finance
- `retail` - Retail
- `manufacturing` - Manufacturing
- `other` - Other

**Relationships**:
- One Company has many CompanyUsers
- One Company has many CustomerCompanies
- One Company has many UserInvitations
- Created by one User

---

### authentication_companyuser
Relationship between users and companies (team members).

**Table Name**: `authentication_companyuser`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer (PK) | Primary Key, Auto-increment | Unique identifier |
| user_id | Integer (FK) | Foreign Key → User, Not Null | User reference |
| company_id | Integer (FK) | Foreign Key → Company, Not Null | Company reference |
| role | String(32) | Not Null | User role in company |
| department | String(32) | Nullable | Department assignment |
| invited_by_id | Integer (FK) | Foreign Key → User, Nullable | Inviter user |
| joined_at | DateTime | Default: now, Not Null | Join timestamp |
| is_active | Boolean | Default: True | Membership active status |
| can_invite_users | Boolean | Default: False | Permission to invite users |
| can_manage_deals | Boolean | Default: False | Permission to manage deals |
| can_view_reports | Boolean | Default: False | Permission to view reports |
| can_manage_customers | Boolean | Default: False | Permission to manage customers |

**Indexes**: 
- `user_id`
- `company_id`
- `role`
- `department`

**Foreign Keys**:
- `user_id` → `authentication_user(id)` ON DELETE CASCADE
- `company_id` → `authentication_company(id)` ON DELETE CASCADE
- `invited_by_id` → `authentication_user(id)` ON DELETE SET_NULL

**Constraints**:
- `role` must be one of: 'ceo', 'manager', 'sales_manager', 'support_staff'
- `department` must be one of: 'sales', 'support', 'marketing', 'management'
- Unique together: (user_id, company_id)

**Role Hierarchy & Default Permissions**:
- `ceo` - Company owner/CEO (all permissions: True)
- `manager` - Manager (all permissions: True)
- `sales_manager` - Sales Manager (manage_deals, view_reports, manage_customers)
- `support_staff` - Support Staff (manage_customers only)

**Department Choices**:
- `sales` - Sales
- `support` - Support
- `marketing` - Marketing
- `management` - Management

---

### authentication_customer
Customer profile information for B2C users.

**Table Name**: `authentication_customer`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer (PK) | Primary Key, Auto-increment | Unique identifier |
| user_id | Integer (FK) | Foreign Key → User, Unique, Not Null | User reference (one-to-one) |
| profile_picture | ImageField | Nullable | Customer profile picture (upload_to='customer_profiles/') |
| date_of_birth | Date | Nullable | Customer date of birth |
| address | Text | Nullable | Customer address |
| city | String(100) | Nullable | Customer city |
| country | String(100) | Nullable | Customer country |
| created_at | DateTime | Auto, Not Null | Creation timestamp |
| updated_at | DateTime | Auto, Not Null | Last update timestamp |

**Indexes**: 
- `user_id` (unique)

**Foreign Keys**:
- `user_id` → `authentication_user(id)` ON DELETE CASCADE

**Relationships**:
- One Customer belongs to one User (one-to-one)
- One Customer can have many CustomerCompany relationships

---

### authentication_customercompany
Relationship between customers and companies (customer associations).

**Table Name**: `authentication_customercompany`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer (PK) | Primary Key, Auto-increment | Unique identifier |
| customer_id | Integer (FK) | Foreign Key → Customer, Not Null | Customer reference |
| company_id | Integer (FK) | Foreign Key → Company, Not Null | Company reference |
| verified | Boolean | Default: False | Relationship verified status |
| verified_at | DateTime | Nullable | Verification timestamp |
| added_by_id | Integer (FK) | Foreign Key → User, Nullable | User who added customer |
| created_at | DateTime | Auto, Not Null | Creation timestamp |

**Indexes**: 
- `customer_id`
- `company_id`
- `verified`

**Foreign Keys**:
- `customer_id` → `authentication_customer(id)` ON DELETE CASCADE
- `company_id` → `authentication_company(id)` ON DELETE CASCADE

---

## ✅ Implemented Tables (Phase 6: Email System)

### emails_emailaccount
Email account configuration for sending and receiving emails.

**Table Name**: `emails_emailaccount`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer (PK) | Primary Key, Auto-increment | Unique identifier |
| user_id | Integer (FK) | Foreign Key → User, Not Null | Owner user |
| email_address | String(255) | Not Null, Indexed | Email address |
| provider | String(32) | Not Null | 'smtp', 'imap', 'gmail' |
| smtp_host | String(255) | Nullable | SMTP server hostname |
| smtp_port | Integer | Nullable | SMTP port (587, 465) |
| imap_host | String(255) | Nullable | IMAP server hostname |
| imap_port | Integer | Nullable | IMAP port (993) |
| username | String(255) | Nullable | Login username |
| password_encrypted | Text | Nullable | Fernet-encrypted password |
| oauth_token_encrypted | Text | Nullable | Fernet-encrypted OAuth token JSON |
| is_active | Boolean | Default: True | Account active status |
| is_default | Boolean | Default: False | Default sending account |
| sync_enabled | Boolean | Default: True | Auto-sync enabled |
| last_sync_at | DateTime | Nullable | Last successful sync timestamp |
| unread_count | Integer | Default: 0 | Cached unread count |
| created_at | DateTime | Auto, Not Null | Creation timestamp |
| updated_at | DateTime | Auto, Not Null | Last update timestamp |

**Indexes**: 
- `user_id, email_address` (composite)
- `provider`
- `is_default`

**Foreign Keys**:
- `user_id` → `authentication_user(id)` ON DELETE CASCADE

**Provider Choices**:
- `smtp` - SMTP/IMAP (Gmail, Outlook, etc.)
- `gmail` - Gmail OAuth

**Encryption**: `password_encrypted` and `oauth_token_encrypted` use Fernet symmetric encryption with key from `EMAIL_ENCRYPTION_KEY` env var.

---

### emails_email
Individual email messages.

**Table Name**: `emails_email`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer (PK) | Primary Key, Auto-increment | Unique identifier |
| email_account_id | Integer (FK) | Foreign Key → EmailAccount, Not Null | Account reference |
| thread_id | Integer (FK) | Foreign Key → EmailThread, Nullable | Thread grouping |
| message_id | String(512) | Unique, Indexed | RFC 2822 Message-ID |
| in_reply_to | String(512) | Nullable | Parent Message-ID |
| references | Text | Nullable | Full reference chain |
| from_address | String(255) | Not Null, Indexed | Sender email |
| from_display | String(255) | Nullable | Sender display name |
| to_addresses | JSON | Not Null | List of recipient emails |
| cc_addresses | JSON | Nullable | List of CC emails |
| bcc_addresses | JSON | Nullable | List of BCC emails |
| subject | String(500) | Not Null, Indexed | Email subject |
| body_text | Text | Nullable | Plain text body |
| body_html | Text | Nullable | HTML body |
| attachments | JSON | Nullable | Attachment metadata |
| sent_at | DateTime | Not Null, Indexed | Send/receive timestamp |
| is_read | Boolean | Default: False | Read status |
| is_starred | Boolean | Default: False | Starred flag |
| direction | String(16) | Not Null | 'inbound' or 'outbound' |
| status | String(16) | Not Null | 'draft', 'queued', 'sent', 'delivered', 'failed' |
| folder | String(64) | Nullable | IMAP folder (INBOX, Sent, etc.) |
| uid | Integer | Nullable | IMAP UID |
| created_at | DateTime | Auto, Not Null | Creation timestamp |

**Indexes**: 
- `message_id` (unique)
- `email_account_id, sent_at` (composite, DESC)
- `thread_id`
- `from_address`
- `status`

**Foreign Keys**:
- `email_account_id` → `emails_emailaccount(id)` ON DELETE CASCADE
- `thread_id` → `emails_emailthread(id)` ON DELETE SET_NULL

**Direction Choices**:
- `inbound` - Received email
- `outbound` - Sent email

**Status Choices**:
- `draft` - Draft saved
- `queued` - Queued for sending
- `sent` - Successfully sent
- `delivered` - Delivered (tracking confirmation)
- `failed` - Send failed

---

### emails_emailthread
Email conversation threads.

**Table Name**: `emails_emailthread`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer (PK) | Primary Key, Auto-increment | Unique identifier |
| email_account_id | Integer (FK) | Foreign Key → EmailAccount, Not Null | Account reference |
| subject | String(500) | Not Null | Thread subject |
| participants | JSON | Not Null | List of all participants |
| other_party | String(255) | Nullable | Primary external contact |
| last_message_at | DateTime | Not Null, Indexed | Last email timestamp |
| message_count | Integer | Default: 0 | Number of emails |
| is_read | Boolean | Default: False | All messages read |
| is_starred | Boolean | Default: False | Thread starred |
| category | String(32) | Nullable, Indexed | AI-assigned category |
| sentiment | String(16) | Nullable | AI sentiment analysis |
| lead_id | Integer (FK) | Foreign Key → Lead, Nullable | Linked lead |
| deal_id | Integer (FK) | Foreign Key → Deal, Nullable | Linked deal |
| customer_id | Integer (FK) | Foreign Key → Customer, Nullable | Linked customer |
| created_at | DateTime | Auto, Not Null | Creation timestamp |
| updated_at | DateTime | Auto, Not Null | Last update timestamp |

**Indexes**: 
- `email_account_id, last_message_at` (composite, DESC)
- `category`
- `lead_id, deal_id, customer_id`

**Foreign Keys**:
- `email_account_id` → `emails_emailaccount(id)` ON DELETE CASCADE
- `lead_id` → `crm_lead(id)` ON DELETE SET_NULL
- `deal_id` → `crm_deal(id)` ON DELETE SET_NULL
- `customer_id` → `customers_customer(id)` ON DELETE SET_NULL

**Category Choices**:
- `primary` - General correspondence
- `lead` - Lead-related
- `deal` - Deal-related
- `customer` - Customer support
- `complaint` - Customer complaint

**Sentiment Choices**:
- `positive` - Positive tone
- `neutral` - Neutral tone
- `negative` - Negative tone

---

### emails_emailtemplate
Reusable email templates with variables.

**Table Name**: `emails_emailtemplate`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer (PK) | Primary Key, Auto-increment | Unique identifier |
| company_id | Integer (FK) | Foreign Key → Company, Not Null | Company reference |
| created_by_id | Integer (FK) | Foreign Key → User, Not Null | Creator user |
| name | String(255) | Not Null | Template name |
| subject | String(500) | Not Null | Email subject (with variables) |
| body_html | Text | Nullable | HTML body (with variables) |
| body_text | Text | Nullable | Plain text body (with variables) |
| category | String(64) | Nullable, Indexed | Template category |
| usage_count | Integer | Default: 0 | Times template used |
| created_at | DateTime | Auto, Not Null | Creation timestamp |
| updated_at | DateTime | Auto, Not Null | Last update timestamp |

**Indexes**: 
- `company_id, category`
- `name`

**Foreign Keys**:
- `company_id` → `authentication_company(id)` ON DELETE CASCADE
- `created_by_id` → `authentication_user(id)` ON DELETE CASCADE

**Variable Syntax**: `{{variable_name}}` (replaced on render)

**Common Variables**:
- `{{customer_name}}` - Customer/contact name
- `{{company_name}}` - Company name
- `{{deal_title}}` - Deal title
- `{{user_name}}` - Sender name
- `{{custom_field}}` - Any custom field

---

### emails_emailtracking
Email engagement tracking (opens, clicks).

**Table Name**: `emails_emailtracking`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer (PK) | Primary Key, Auto-increment | Unique identifier |
| email_id | Integer (FK) | Foreign Key → Email, Not Null | Email reference |
| event_type | String(16) | Not Null | 'open' or 'click' |
| tracked_at | DateTime | Auto, Not Null, Indexed | Event timestamp |
| ip_address | String(45) | Nullable | Visitor IP |
| user_agent | Text | Nullable | Browser user agent |
| link_url | Text | Nullable | Clicked URL (for click events) |

**Indexes**: 
- `email_id, event_type`
- `tracked_at` (DESC)

**Foreign Keys**:
- `email_id` → `emails_email(id)` ON DELETE CASCADE

**Event Types**:
- `open` - Email opened (pixel loaded)
- `click` - Link clicked

---

### emails_emailrule
Automation rules for email processing.

**Table Name**: `emails_emailrule`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer (PK) | Primary Key, Auto-increment | Unique identifier |
| email_account_id | Integer (FK) | Foreign Key → EmailAccount, Not Null | Account reference |
| name | String(255) | Not Null | Rule name |
| trigger_type | String(32) | Not Null | 'received', 'sent' |
| conditions | JSON | Not Null | Match conditions |
| actions | JSON | Not Null | Actions to perform |
| is_active | Boolean | Default: True | Rule enabled |
| priority | Integer | Default: 0 | Execution order |
| created_at | DateTime | Auto, Not Null | Creation timestamp |
| updated_at | DateTime | Auto, Not Null | Last update timestamp |

**Indexes**: 
- `email_account_id, is_active`
- `priority`

**Foreign Keys**:
- `email_account_id` → `emails_emailaccount(id)` ON DELETE CASCADE

**Trigger Types**:
- `received` - When email received
- `sent` - When email sent

**Condition Format** (JSON):
```json
{
  "subject_contains": ["urgent", "support"],
  "from_domain": "example.com",
  "has_attachment": true
}
```

**Action Format** (JSON):
```json
{
  "set_category": "customer",
  "create_task": true,
  "notify_users": [1, 2, 3]
}
```

---
- `added_by_id` → `authentication_user(id)` ON DELETE SET_NULL

**Purpose**: 
Links customers to companies they interact with. Allows companies to track their customer relationships.

---

### authentication_userinvitation
Team member invitations for companies.

**Table Name**: `authentication_userinvitation`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer (PK) | Primary Key, Auto-increment | Unique identifier |
| company_id | Integer (FK) | Foreign Key → Company, Not Null | Company sending invitation |
| email | EmailField | Not Null | Email of invited user |
| role | String(32) | Not Null | Assigned role for invited user |
| invited_by_id | Integer (FK) | Foreign Key → User, Not Null | User who sent invitation |
| invitation_token | String(100) | Unique, Not Null | Unique invitation token (UUID) |
| status | String(16) | Default: 'pending' | Invitation status |
| expires_at | DateTime | Not Null | Invitation expiry (7 days) |
| created_at | DateTime | Auto, Not Null | Creation timestamp |
| accepted_at | DateTime | Nullable | Acceptance timestamp |

**Indexes**: 
- `company_id`
- `email`
- `invitation_token` (unique)
- `status`
- `expires_at`

**Foreign Keys**:
- `company_id` → `authentication_company(id)` ON DELETE CASCADE
- `invited_by_id` → `authentication_user(id)` ON DELETE CASCADE

**Status Choices**:
- `pending` - Invitation sent, awaiting acceptance
- `accepted` - Invitation accepted, user joined
- `expired` - Invitation expired (past expires_at date)

**Constraints**:
- `role` must be one of CompanyUser role choices
- `invitation_token` auto-generated as UUID on creation
- `expires_at` set to 7 days from creation automatically

**Relationships**:
- One Invitation belongs to one Company
- One Invitation sent by one User

**Purpose**: 
Manages team member invitations with token-based acceptance flow. Invitations expire after 7 days.

---

## 🔧 Django System Tables

### token_blacklist_outstandingtoken
Stores all issued refresh tokens for tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | BigInteger (PK) | Primary key |
| user_id | Integer (FK) | User who owns the token |
| jti | String | JWT ID (unique token identifier) |
| token | Text | Full JWT refresh token |
| created_at | DateTime | Token creation time |
| expires_at | DateTime | Token expiration time |

### token_blacklist_blacklistedtoken
Stores blacklisted/revoked tokens (logout).

| Column | Type | Description |
|--------|------|-------------|
| id | BigInteger (PK) | Primary key |
| token_id | BigInteger (FK) | Reference to OutstandingToken |
| blacklisted_at | DateTime | When token was blacklisted |

**Purpose**: Implements logout by blacklisting refresh tokens so they can't be used again.

---

## 📊 Database Relationships Diagram

```
User (authentication_user)
  ├─── One-to-Many → Company (as created_by)
  ├─── Many-to-Many → Company (through CompanyUser)
  ├─── One-to-One → Customer
  └─── One-to-Many → CustomerCompany (as added_by)

Company (authentication_company)
  ├─── Many-to-One → User (created_by)
  ├─── One-to-Many → CompanyUser
  └─── One-to-Many → CustomerCompany

CompanyUser (authentication_companyuser)
  ├─── Many-to-One → User
  ├─── Many-to-One → Company
  └─── Many-to-One → User (as invited_by)

Customer (authentication_customer)
  ├─── One-to-One → User
  └─── One-to-Many → CustomerCompany

CustomerCompany (authentication_customercompany)
  ├─── Many-to-One → Customer
  ├─── Many-to-One → Company
  └─── Many-to-One → User (as added_by)
```

---

## 🔍 Example Queries

### Get all users in a company
```sql
SELECT u.* 
FROM authentication_user u
JOIN authentication_companyuser cu ON cu.user_id = u.id
WHERE cu.company_id = 1 AND cu.is_active = true;
```

### Get all companies a customer is associated with
```sql
SELECT c.* 
FROM authentication_company c
JOIN authentication_customercompany cc ON cc.company_id = c.id
WHERE cc.customer_id = 1 AND cc.verified = true;
```

### Get all customers of a company
```sql
SELECT cust.*, u.email, u.first_name, u.last_name
FROM authentication_customer cust
JOIN authentication_user u ON u.id = cust.user_id
JOIN authentication_customercompany cc ON cc.customer_id = cust.id
WHERE cc.company_id = 1;
```

---

### Phase 4: CRM Database Design (Implemented)

This phase introduces core CRM entities: leads, pipelines, stages, deals and activities. A default pipeline with standard stages is auto-created for each new company via a signal.

#### crm_lead
Potential customer lead captured prior to qualification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Owning company (tenant) |
| created_by_id | Integer (FK) | FK → authentication_user | User who created the lead |
| assigned_to_id | Integer (FK) | FK → authentication_user, Nullable | Responsible user |
| first_name | String(120) | Not Null | Lead first name |
| last_name | String(120) | Not Null | Lead last name |
| email | Email | Not Null | Lead email address |
| phone | String(32) | Nullable | Phone number |
| company_name | String(255) | Nullable | Lead's company name |
| job_title | String(120) | Nullable | Lead job title |
| lead_source | String(32) | Not Null | Source: website, referral, cold_call, social_media, event, other |
| status | String(32) | Default: new | new/contacted/qualified/unqualified/converted |
| estimated_value | Decimal(12,2) | Nullable | Potential deal value |
| notes | Text | Nullable | Internal notes |
| converted_to_deal_id | Integer (FK) | FK → crm_deal, Nullable | Deal created from this lead |
| converted_at | DateTime | Nullable | Timestamp of conversion |
| created_at | DateTime | Auto | Creation timestamp |
| updated_at | DateTime | Auto | Update timestamp |

**Indexes**: (company_id, status), (company_id, email), (created_at)

#### crm_pipeline (Added Phase 4)
Sales pipeline grouping ordered stages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Owning company |
| name | String(255) | Not Null | Pipeline name |
| description | Text | Nullable | Description |
| is_default | Boolean | Default False | Default pipeline flag (1 per company) |
| created_by_id | Integer (FK) | FK → authentication_user | Creator |
| created_at | DateTime | Auto | Creation timestamp |
| is_active | Boolean | Default True | Active flag |

**Constraints**: unique (company_id, name); unique default enforced by conditional constraint.
**Indexes**: (company_id, is_active), (company_id, is_default)

#### crm_dealstage (Added Phase 4)
Stage inside a pipeline defining progress & probability.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| pipeline_id | Integer (FK) | FK → crm_pipeline | Parent pipeline |
| name | String(120) | Not Null | Stage name |
| order | Integer | Not Null | Sort order (unique per pipeline) |
| probability | Integer | 0-100 | Win probability percent |
| is_active | Boolean | Default True | Active flag |
| created_at | DateTime | Auto | Creation timestamp |

**Constraints**: unique (pipeline_id, name); unique (pipeline_id, order)
**Indexes**: (pipeline_id, is_active), (pipeline_id, order)

#### crm_deal (Added Phase 4)
Sales opportunity linked to pipeline & stage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Owning company |
| pipeline_id | Integer (FK) | FK → crm_pipeline | Pipeline reference |
| stage_id | Integer (FK) | FK → crm_dealstage | Current stage |
| created_by_id | Integer (FK) | FK → authentication_user | Deal creator |
| assigned_to_id | Integer (FK) | FK → authentication_user, Nullable | Owner user |
| lead_id | Integer (FK) | FK → crm_lead, Nullable | Originating lead |
| title | String(255) | Not Null | Deal title |
| description | Text | Nullable | Deal description |
| value | Decimal(12,2) | Not Null | Deal monetary value |
| currency | String(8) | Default 'USD' | Currency code |
| expected_close_date | Date | Nullable | Expected close date |
| actual_close_date | Date | Nullable | Actual close date |
| contact_name | String(255) | Not Null | Primary contact name |
| contact_email | Email | Not Null | Primary contact email |
| contact_phone | String(32) | Nullable | Contact phone |
| company_name | String(255) | Not Null | Customer company name |
| status | String(16) | Default 'open' | open/won/lost |
| lost_reason | Text | Nullable | Reason if lost |
| priority | String(16) | Default 'medium' | low/medium/high |
| probability | Integer | Derived | Mirrors stage probability |
| created_at | DateTime | Auto | Creation timestamp |
| updated_at | DateTime | Auto | Update timestamp |
| won_at | DateTime | Nullable | Timestamp of win |
| lost_at | DateTime | Nullable | Timestamp of loss |

**Indexes**: (company_id, status), (company_id, pipeline_id, stage_id), (company_id, expected_close_date), (created_at)

#### crm_activity (Added Phase 4)
Chronological activities linked to leads and/or deals.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Owning company |
| user_id | Integer (FK) | FK → authentication_user | Creator user |
| lead_id | Integer (FK) | FK → crm_lead, Nullable | Target lead |
| deal_id | Integer (FK) | FK → crm_deal, Nullable | Target deal |
| activity_type | String(32) | Not Null | note/call/email/meeting/task |
| subject | String(255) | Not Null | Short subject |
| description | Text | Not Null | Detailed content |
| created_at | DateTime | Auto | Creation timestamp |
| scheduled_at | DateTime | Nullable | Future schedule |
| completed | Boolean | Default False | Completion flag |

**Indexes**: (company_id, lead_id), (company_id, deal_id), (created_at)

#### Default Pipeline Creation
On Company creation, a signal creates a default pipeline "Sales Pipeline" with stages:
Prospecting(10%), Qualification(25%), Proposal(50%), Negotiation(75%), Closed Won(100%), Closed Lost(0%).

#### Updated Relationships (CRM additions)

```
Company ─┬─ Leads
         ├─ Pipelines ─┬─ DealStages ─┬─ Deals
         │              │              └─ Activities (via deal)
         ├─ Deals ────────────────┐    
         └─ Activities (via lead) │
Lead ─────┬─ Activities            │
          └─ Deal (converted) <────┘
Pipeline ──┬─ DealStages ──┬─ Deals
DealStage ─┘               └─ Activities (indirect via Deal)
```

---

### Phase 9: Notifications

#### notifications_notification
User notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID (PK) | Primary Key | Unique identifier |
| user_id | UUID (FK) | Foreign Key | Recipient user |
| title | String | Not Null | Notification title |
| message | Text | Not Null | Notification message |
| type | String | Not Null | Type: info, success, warning, error |
| is_read | Boolean | Default: False | Read status |
| related_object_type | String | Nullable | Related model type |
| related_object_id | UUID | Nullable | Related object ID |
| created_at | DateTime | Auto | Creation timestamp |

**Indexes**: user_id, is_read, created_at

---

### Phase 11: Issue Tracking

#### issues_issue
Bug/task tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID (PK) | Primary Key | Unique identifier |
| title | String | Not Null | Issue title |
| description | Text | Nullable | Issue description |
| status | String | Not Null | Status: open, in_progress, resolved, closed |
| priority | String | Default: medium | Priority: low, medium, high, urgent |
| issue_type | String | Not Null | Type: bug, feature, task |
| github_issue_id | Integer | Nullable | Linked GitHub issue ID |
| assigned_to_id | UUID (FK) | Foreign Key, Nullable | Assigned user |
| deal_id | UUID (FK) | Foreign Key, Nullable | Associated deal |
| contact_id | UUID (FK) | Foreign Key, Nullable | Associated contact |
| company_id | UUID (FK) | Foreign Key | Tenant company |
| created_by_id | UUID (FK) | Foreign Key | Creator user |
| created_at | DateTime | Auto | Creation timestamp |
| updated_at | DateTime | Auto | Last update timestamp |

**Indexes**: status, priority, assigned_to_id, company_id, created_at

---

## 🔗 Relationships

### Entity Relationship Diagram (Text)

```
users_company
    ├── users_customuser (1:N)
    └── crm_lead (1:N)
    └── crm_deal (1:N)
    └── crm_contact (1:N)
    └── crm_organization (1:N)

users_customuser
    ├── crm_lead.assigned_to (1:N)
    ├── crm_deal.assigned_to (1:N)
    └── crm_activity.assigned_to (1:N)

crm_lead
    ├── crm_deal (1:N)
    └── crm_activity (1:N)

crm_organization
    ├── crm_contact (1:N)
    └── crm_deal (1:N)

crm_contact
    ├── crm_deal (1:N)
    └── crm_activity (1:N)

crm_deal
    └── crm_activity (1:N)
```

---

## 📈 Migration Strategy

### Phase 2 Migrations
1. Create `users_company` table
2. Create `users_customuser` table with company FK
3. Migrate existing `auth_user` data to `users_customuser`
4. Add indexes on email, company_id

### Phase 4 Migrations
1. Create `crm_lead` table
2. Add indexes on status, assigned_to, company_id

### Phase 5 Migrations
1. Create `crm_deal` table
2. Add foreign keys to lead, contact, organization

### Phase 6 Migrations
1. Create `crm_contact` table
2. Create `crm_organization` table
3. Add relationship indexes

### Phase 7 Migrations
1. Create `crm_activity` table
2. Create `crm_emailtemplate` table
3. Add polymorphic relationships

---

## 🔐 Security Considerations

---

### Phase 5: Customer Management (Implemented)

Enhanced customer tracking with orders, interactions, segmentation, and tags.

#### customers_customertag
Tags for categorizing customers (VIP, High Value, At Risk).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Owning company |
| name | String(50) | Not Null | Tag name |
| color | String(7) | Default '#4c6fff' | Hex color code for UI |
| created_by_id | Integer (FK) | FK → authentication_user, Nullable | Creator user |
| created_at | DateTime | Auto | Creation timestamp |

**Constraints**: unique (company_id, name)
**Indexes**: (company_id, name)

#### customers_customerprofile
Extended profile information for customers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| customer_id | Integer (FK) | FK → authentication_customer, Unique | Customer reference (one-to-one) |
| customer_type | String(20) | Default 'individual' | individual/business |
| company_size | String(50) | Nullable | Business customers only |
| industry | String(100) | Nullable | Business customers only |
| annual_revenue | Decimal(15,2) | Nullable | Business customers only |
| preferences | JSONField | Default {} | Communication preferences, interests |
| lifetime_value | Decimal(12,2) | Default 0.00 | Calculated total value |
| total_orders | Integer | Default 0 | Order count |
| last_order_date | DateTime | Nullable | Most recent order timestamp |
| notes | Text | Blank | Internal notes by company |
| created_at | DateTime | Auto | Creation timestamp |
| updated_at | DateTime | Auto | Update timestamp |

**Many-to-Many**: tags → CustomerTag

#### customers_customersegment
Customer segmentation for targeting and analytics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Owning company |
| name | String(100) | Not Null | Segment name |
| description | Text | Blank | Segment description |
| criteria | JSONField | Default {} | Filter criteria for segment |
| created_by_id | Integer (FK) | FK → authentication_user, Nullable | Creator user |
| created_at | DateTime | Auto | Creation timestamp |
| updated_at | DateTime | Auto | Update timestamp |

**Constraints**: unique (company_id, name)

#### customers_order
Customer orders/purchases.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Owning company |
| customer_id | Integer (FK) | FK → authentication_customer | Customer reference |
| order_number | String(50) | Unique, Indexed | Unique order identifier |
| title | String(255) | Not Null | Order title |
| description | Text | Blank | Order description |
| status | String(20) | Default 'pending' | pending/processing/shipped/delivered/cancelled/refunded |
| total_amount | Decimal(12,2) | Not Null | Total order value |
| currency | String(3) | Default 'USD' | Currency code |
| order_date | DateTime | Auto, Indexed | Order timestamp |
| expected_delivery_date | Date | Nullable | Expected delivery |
| actual_delivery_date | Date | Nullable | Actual delivery |
| shipping_address | Text | Not Null | Shipping address |
| billing_address | Text | Not Null | Billing address |
| payment_method | String(50) | Blank | Payment method |
| payment_status | String(20) | Default 'pending' | pending/paid/failed/refunded |
| tracking_number | String(100) | Blank | Shipment tracking |
| notes | Text | Blank | Order notes |
| created_by_id | Integer (FK) | FK → authentication_user, Nullable | Creator user |
| created_at | DateTime | Auto | Creation timestamp |
| updated_at | DateTime | Auto | Update timestamp |

**Indexes**: (company_id, customer_id), (company_id, status), (order_date)

#### customers_orderitem
Individual items within an order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| order_id | Integer (FK) | FK → customers_order | Parent order |
| product_name | String(255) | Not Null | Product name |
| product_sku | String(100) | Blank | Product SKU |
| quantity | Integer | Default 1 | Item quantity |
| unit_price | Decimal(10,2) | Not Null | Price per unit |
| discount | Decimal(10,2) | Default 0.00 | Discount amount |
| tax | Decimal(10,2) | Default 0.00 | Tax amount |
| total_price | Decimal(12,2) | Not Null | Calculated total |
| created_at | DateTime | Auto | Creation timestamp |

**Note**: total_price auto-calculated: (unit_price × quantity) - discount + tax

#### customers_customerinteraction
Log of all interactions with customers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Owning company |
| customer_id | Integer (FK) | FK → authentication_customer | Customer reference |
| user_id | Integer (FK) | FK → authentication_user, Nullable | Company user |
| interaction_type | String(20) | Not Null, Indexed | call/email/meeting/support/purchase/inquiry |
| subject | String(255) | Not Null | Interaction subject |
| description | Text | Not Null | Detailed description |
| sentiment | String(20) | Nullable | positive/neutral/negative |
| created_at | DateTime | Auto, Indexed | Interaction timestamp |

**Indexes**: (company_id, customer_id), (company_id, interaction_type)

#### authentication_customercompany (Updated Phase 5)
Added fields for enhanced customer relationship tracking.

**New Fields Added**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| customer_since | DateTime | Nullable | Date when verified (auto-set) |
| customer_status | String(20) | Default 'active' | active/inactive/blocked |
| account_manager_id | Integer (FK) | FK → authentication_user, Nullable | Assigned company user |
| notes | Text | Blank | Relationship notes |

**Note**: customer_since auto-populated when verified flag is set to True.

---

## 🔐 Security Considerations

- All UUIDs for primary keys (prevents enumeration attacks)
- Passwords hashed with Django's PBKDF2 algorithm
- Sensitive fields encrypted at rest (future)
- Row-level security via company_id filtering
- Soft deletes for critical data (add `deleted_at` field)

---

## 🎯 Performance Optimizations

### Indexes
- Foreign keys automatically indexed
- Email fields indexed for lookups
- created_at indexed for sorting
- Composite indexes for common queries

### Query Optimization
- Use `select_related()` for foreign keys
- Use `prefetch_related()` for reverse relationships
- Add database connection pooling
- Implement caching (Redis) for frequently accessed data

---

## 📊 Data Validation

### Database Constraints
- NOT NULL for required fields
- UNIQUE for email, domain
- CHECK constraints for enums
- Foreign key CASCADE on delete (or SET NULL)

### Application-Level Validation
- Email format validation
- Phone number format validation
- Date range validation
- Role enum validation

---

**Last Updated**: November 16, 2025  
**Database Version**: Phase 5 - Customer Management & Order Management COMPLETED  
**Next Update**: Phase 6 (Email Integration & Communication)

---

## 📧 Email System Tables (Phase 6.1 - Email Database Design)

### emails_emailaccount
Stores configuration for a user's connected email account used for sending/receiving and syncing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Owning company (tenant) |
| user_id | Integer (FK) | FK → authentication_user | Owner user of this account |
| email | Email | Unique per company | Email address connected |
| provider | String(32) | Not Null | gmail/outlook/smtp/imap |
| smtp_host | String(255) | Nullable | SMTP host (if applicable) |
| smtp_port | Integer | Nullable | SMTP port |
| imap_host | String(255) | Nullable | IMAP host (if applicable) |
| imap_port | Integer | Nullable | IMAP port |
| username | String(255) | Not Null | Login username |
| password | String(512) | Not Null | Encrypted credential (at rest) |
| is_active | Boolean | Default True | Active flag |
| is_default | Boolean | Default False | Default account for user |
| sync_enabled | Boolean | Default True | Enable inbox/background sync |
| last_sync | DateTime | Nullable | Last successful sync time |
| created_at | DateTime | Auto | Creation timestamp |

**Unique**: (company_id, email)  
**Indexes**: (company_id, email), (user_id, is_default)

**Purpose**: Stores per-user email connection settings supporting multi-account workflows and background sync.

---

### emails_emailthread
Represents a logical conversation grouping related messages (like email provider threads) with CRM linkage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Owning company |
| email_account_id | Integer (FK) | FK → emails_emailaccount | Source account |
| subject | String(500) | Not Null | Thread subject |
| participants | JSON | Default [] | List of participant email addresses |
| lead_id | Integer (FK) | Nullable, FK → crm_lead | Associated lead |
| deal_id | Integer (FK) | Nullable, FK → crm_deal | Associated deal |
| customer_id | Integer (FK) | Nullable, FK → authentication_customer | Associated customer |
| last_message_at | DateTime | Not Null | Timestamp of latest message |
| message_count | Integer | Default 0 | Number of messages |
| is_read | Boolean | Default False | Unread flag |
| is_starred | Boolean | Default False | Starred/important flag |
| category | String(32) | Not Null | primary/social/promotions/updates/lead/deal/customer/complaint/other |
| sentiment | String(16) | Nullable | positive/neutral/negative |
| created_at | DateTime | Auto | Creation timestamp |

**Indexes**: (company_id, last_message_at), (email_account_id, is_read), (category)  
**Purpose**: Aggregates metadata for quick inbox views, CRM cross-linking, and prioritization.

---

### emails_email
Individual email message with tracking and engagement metrics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| thread_id | Integer (FK) | FK → emails_emailthread | Parent thread |
| email_account_id | Integer (FK) | FK → emails_emailaccount | Source/sending account |
| message_id | String(255) | Unique | Provider message id |
| from_email | Email | Not Null | Sender email |
| from_name | String(255) | Blank | Sender display name |
| to_emails | JSON | Default [] | Recipients list |
| cc_emails | JSON | Nullable | CC recipients |
| bcc_emails | JSON | Nullable | BCC recipients |
| subject | String(500) | Not Null | Email subject |
| body_text | Text | Not Null | Plain text body |
| body_html | Text | Blank | HTML body |
| direction | String(16) | Not Null | inbound/outbound |
| status | String(16) | Default 'draft' | draft/queued/sent/delivered/failed/bounced |
| is_read | Boolean | Default False | Read by user flag |
| read_at | DateTime | Nullable | Read timestamp |
| sent_at | DateTime | Nullable | Sent timestamp |
| delivered_at | DateTime | Nullable | Delivery timestamp |
| opened_at | DateTime | Nullable | First open timestamp |
| clicked_at | DateTime | Nullable | First click timestamp |
| tracking_enabled | Boolean | Default True | Enable open/click tracking |
| opens_count | Integer | Default 0 | Total opens |
| clicks_count | Integer | Default 0 | Total tracked clicks |
| reply_to_id | Integer (FK) | Nullable, FK → emails_email | Parent message (threaded reply) |
| has_attachments | Boolean | Default False | Attachment flag |
| created_by_id | Integer (FK) | Nullable, FK → authentication_user | Outbound creator |
| created_at | DateTime | Auto | Creation timestamp |

**Indexes**: (thread_id, sent_at), (email_account_id, status), (direction)  
**Purpose**: Core message entity supporting omnichannel tracking, analytics, and CRM timeline enrichment.

---

### emails_emailattachment
Attachment metadata linked to an email message.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| email_id | Integer (FK) | FK → emails_email | Parent email |
| file_name | String(255) | Not Null | Original filename |
| file_size | Integer | Not Null | Size (bytes) |
| file_type | String(255) | Not Null | MIME type |
| file_path | File | Not Null | Stored file path (email_attachments/) |
| created_at | DateTime | Auto | Upload timestamp |

**Purpose**: Allows structured storage and future virus scanning / quota monitoring.

---

### emails_emailtemplate
Reusable email template with variable substitution for automated and manual sends.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Owning company |
| name | String(255) | Not Null | Template name |
| subject | String(500) | Not Null | Subject (supports placeholders) |
| body_html | Text | Not Null | HTML content (supports placeholders) |
| body_text | Text | Blank | Fallback plain text |
| category | String(32) | Not Null | lead/deal/customer/general |
| created_by_id | Integer (FK) | FK → authentication_user | Creator user |
| is_active | Boolean | Default True | Active flag |
| usage_count | Integer | Default 0 | Times used |
| created_at | DateTime | Auto | Creation timestamp |
| updated_at | DateTime | Auto | Update timestamp |

**Unique**: (company_id, name)  
**Indexes**: (company_id, category)  
**Purpose**: Enables consistent branding and rapid outreach.

---

### emails_emailrule
Automation rules reacting to triggers and executing actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Owning company |
| name | String(255) | Not Null | Rule name |
| description | Text | Blank | Human readable description |
| trigger | String(64) | Not Null | email_received/email_sent/lead_created/deal_created |
| conditions | JSON | Default {} | Conditional filters (eg. participant contains, status) |
| actions | JSON | Default {} | Actions (send_email, create_lead, assign_user, add_tag) |
| template_id | Integer (FK) | Nullable, FK → emails_emailtemplate | Template used (optional) |
| is_active | Boolean | Default True | Activation flag |
| created_by_id | Integer (FK) | FK → authentication_user | Creator |
| created_at | DateTime | Auto | Creation timestamp |

**Purpose**: Foundation for workflow automation and intelligent engagement.

---

### emails_emailsynclog
Audit log for email account synchronization jobs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| email_account_id | Integer (FK) | FK → emails_emailaccount | Account synced |
| sync_started_at | DateTime | Not Null | Start timestamp |
| sync_completed_at | DateTime | Nullable | Completion timestamp |
| emails_synced | Integer | Default 0 | Count of messages processed |
| status | String(32) | Not Null | running/completed/failed |
| error_message | Text | Nullable | Error details if failed |

**Purpose**: Operational transparency, debugging sync issues, and monitoring throughput.

---

## 🔄 Email System Relationships

```
EmailAccount
  ├─── One-to-Many → EmailThread
  ├─── One-to-Many → Email (direct send/store)
  └─── One-to-Many → EmailSyncLog

EmailThread
  ├─── One-to-Many → Email
  ├─── Many-to-One → Company
  ├─── Many-to-One → EmailAccount
  ├─── Optional Many-to-One → Lead / Deal / Customer

Email
  ├─── Many-to-One → EmailThread
  ├─── Many-to-One → EmailAccount
  ├─── Optional Many-to-One → Parent Email (reply_to)
  └─── One-to-Many → EmailAttachment

EmailTemplate
  └─── One-to-Many → EmailRule

EmailRule
  ├─── Many-to-One → Company
  ├─── Optional Many-to-One → EmailTemplate
  └─── Many-to-One → CreatedBy User

EmailSyncLog
  └─── Many-to-One → EmailAccount
```

---

## 📈 Email Data Considerations

- Future encryption at rest for credentials (move to a secrets manager)
- Add quotas & rate limiting per provider
- Potential partitioning of Email table for scale (by month/company)
- Tracking events (opens/clicks) to be normalized later for analytics
- Background tasks (Celery) update last_sync and create EmailSyncLog rows

---

<<<<<<< HEAD
## 📞 Call System Tables (Phase 7.1)

### calls_phonenumber
Phone numbers purchased from Twilio for the company.

**Table Name**: `calls_phonenumber`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Company owner |
| user_id | Integer (FK) | FK → authentication_user | User owner of the phone number |
| phone_number | String(20) | Not Null | E.164 format, e.g., +1234567890 |
| country_code | String(5) | Not Null | Country code |
| number_type | String(20) | Not Null | Mobile, Landline, VoIP |
| provider | String(50) | Default: 'Twilio' | Provider name |
| twilio_phone_sid | String(100) | Unique, Not Null | Twilio's SID for this number |
| is_active | Boolean | Default: True | Active status |
| is_default | Boolean | Default: False | Default number for user |
| capabilities | JSONField | Default: {} | Voice, SMS, MMS capabilities |
| monthly_cost | Decimal(10,2) | Default: 0.00 | Monthly cost |
| purchased_at | DateTime | Auto, Not Null | Purchase timestamp |
| created_at | DateTime | Auto, Not Null | Creation timestamp |

**Indexes**:
- `company_id, is_active`
- `user_id, is_default`

**Foreign Keys**:
- `company_id` → `authentication_company(id)` ON DELETE CASCADE
- `user_id` → `authentication_user(id)` ON DELETE CASCADE

**Number Type Choices**:
- `Mobile` - Mobile number
- `Landline` - Landline number
- `VoIP` - VoIP number

---

### calls_call
Call records for inbound and outbound calls.

**Table Name**: `calls_call`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Company |
| phone_number_id | Integer (FK) | FK → calls_phonenumber, Nullable | Company's number used |
| user_id | Integer (FK) | FK → authentication_user, Nullable | Company user who made/received call |
| lead_id | Integer (FK) | FK → crm_lead, Nullable | Associated lead |
| deal_id | Integer (FK) | FK → crm_deal, Nullable | Associated deal |
| customer_id | Integer (FK) | FK → authentication_customer, Nullable | Associated customer |
| direction | String(10) | Not Null | Inbound or Outbound |
| from_number | String(20) | Not Null | Caller number |
| to_number | String(20) | Not Null | Recipient number |
| status | String(20) | Default: 'Initiated' | Call status |
| duration | Integer | Nullable | Duration in seconds |
| start_time | DateTime | Nullable | Call start time |
| end_time | DateTime | Nullable | Call end time |
| recording_url | URLField | Nullable | Recording URL |
| recording_duration | Integer | Nullable | Recording duration in seconds |
| twilio_call_sid | String(100) | Unique, Not Null | Twilio's call ID |
| price | Decimal(10,4) | Nullable | Call cost |
| price_unit | String(10) | Default: 'USD' | Price currency |
| notes | TextField | Blank | Call notes added by user |
| disposition | String(20) | Nullable | Call disposition |
| created_at | DateTime | Auto, Not Null | Creation timestamp |

**Indexes**:
- `company_id, user_id`
- `company_id, direction`
- `company_id, status`
- `company_id, created_at`
- `lead_id`
- `deal_id`
- `customer_id`
- `twilio_call_sid` (unique)

**Foreign Keys**:
- `company_id` → `authentication_company(id)` ON DELETE CASCADE
- `phone_number_id` → `calls_phonenumber(id)` ON DELETE SET NULL
- `user_id` → `authentication_user(id)` ON DELETE SET NULL
- `lead_id` → `crm_lead(id)` ON DELETE SET NULL
- `deal_id` → `crm_deal(id)` ON DELETE SET NULL
- `customer_id` → `authentication_customer(id)` ON DELETE SET NULL

**Direction Choices**:
- `Inbound` - Incoming call
- `Outbound` - Outgoing call

**Status Choices**:
- `Initiated` - Call initiated
- `Ringing` - Call ringing
- `InProgress` - Call in progress
- `Completed` - Call completed
- `Failed` - Call failed
- `Busy` - Line busy
- `NoAnswer` - No answer
- `Cancelled` - Call cancelled

**Disposition Choices**:
- `Connected` - Successfully connected
- `NoAnswer` - No answer
- `Busy` - Line busy
- `Failed` - Call failed
- `Voicemail` - Went to voicemail
- `other` - Other

---

### calls_callrecording
Recordings associated with calls.

**Table Name**: `calls_callrecording`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| call_id | Integer (FK) | FK → calls_call | Associated call |
| recording_url | URLField | Not Null | Twilio recording URL |
| recording_sid | String(100) | Unique, Not Null | Twilio recording SID |
| duration | Integer | Not Null | Duration in seconds |
| file_size | Integer | Nullable | File size in bytes |
| transcription | TextField | Nullable | Transcription if enabled |
| created_at | DateTime | Auto, Not Null | Creation timestamp |

**Indexes**:
- `call_id`
- `recording_sid` (unique)

**Foreign Keys**:
- `call_id` → `calls_call(id)` ON DELETE CASCADE

---

### calls_callnote
Notes added to calls by users.

**Table Name**: `calls_callnote`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| call_id | Integer (FK) | FK → calls_call | Associated call |
| user_id | Integer (FK) | FK → authentication_user | User who added note |
| note | TextField | Not Null | Note content |
| created_at | DateTime | Auto, Not Null | Creation timestamp |

**Indexes**:
- `call_id`
- `user_id`

**Foreign Keys**:
- `call_id` → `calls_call(id)` ON DELETE CASCADE
- `user_id` → `authentication_user(id)` ON DELETE CASCADE

---

### calls_voicemailmessage
Voicemail messages received.

**Table Name**: `calls_voicemailmessage`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BigAuto (PK) | Primary Key | Unique identifier |
| company_id | Integer (FK) | FK → authentication_company | Company |
| phone_number_id | Integer (FK) | FK → calls_phonenumber, Nullable | Phone number that received voicemail |
| from_number | String(20) | Not Null | Caller number |
| duration | Integer | Not Null | Duration in seconds |
| recording_url | URLField | Not Null | Recording URL |
| transcription | TextField | Nullable | Transcription |
| is_listened | Boolean | Default: False | Whether voicemail was listened to |
| listened_at | DateTime | Nullable | When voicemail was listened to |
| listened_by_id | Integer (FK) | FK → authentication_user, Nullable | User who listened |
| created_at | DateTime | Auto, Not Null | Creation timestamp |

**Indexes**:
- `company_id, is_listened`
- `phone_number_id`
- `created_at`

**Foreign Keys**:
- `company_id` → `authentication_company(id)` ON DELETE CASCADE
- `phone_number_id` → `calls_phonenumber(id)` ON DELETE SET NULL
- `listened_by_id` → `authentication_user(id)` ON DELETE SET NULL

---

## 🔄 Call System Relationships

```
PhoneNumber
  ├─── Many-to-One → Company
  ├─── Many-to-One → User (owner)
  ├─── One-to-Many → Call
  └─── One-to-Many → VoicemailMessage

Call
  ├─── Many-to-One → Company
  ├─── Many-to-One → PhoneNumber
  ├─── Many-to-One → User
  ├─── Optional Many-to-One → Lead
  ├─── Optional Many-to-One → Deal
  ├─── Optional Many-to-One → Customer
  ├─── One-to-Many → CallRecording
  └─── One-to-Many → CallNote

CallRecording
  └─── Many-to-One → Call

CallNote
  ├─── Many-to-One → Call
  └─── Many-to-One → User

VoicemailMessage
  ├─── Many-to-One → Company
  ├─── Many-to-One → PhoneNumber
  └─── Optional Many-to-One → User (listened_by)
```

---

=======
>>>>>>> 517ed252086bbf69d280f680af46e67f68419d5c
