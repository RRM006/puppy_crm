# 🛠️ Backend Environment Setup (.env)

This guide walks you through configuring the backend environment for Puppy CRM, including core variables and email (SMTP) for invitation emails.

---

## 📁 Location of .env

- File: `backend/.env`
- Example template: `backend/.env.example`

If `backend/.env` is missing, copy from the example:

```powershell
Copy-Item "backend/.env.example" "backend/.env"
```

---

## ✅ Required Variables

Group your environment variables in `backend/.env` as follows.

### Core
- `SECRET_KEY`: Any long random string for JWT signing and Django
- `DEBUG`: `True` for local development, `False` for production

### Database (PostgreSQL)
- `DATABASE_NAME`: e.g., `crm_db`
- `DATABASE_USER`: e.g., `postgres`
- `DATABASE_PASSWORD`: your database password
- `DATABASE_HOST`: typically `localhost`
- `DATABASE_PORT`: typically `5432`

### Google OAuth (Optional for Google login)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`: `http://localhost:3000/auth/google/callback` (or your frontend)

### Frontend URL (used in emails/links)
- `FRONTEND_URL`: e.g., `http://localhost:3000`

### Email (SMTP) — Required for Invitation Emails
- `EMAIL_HOST`: e.g., `smtp.gmail.com`
- `EMAIL_PORT`: e.g., `587`
- `EMAIL_HOST_USER`: your sender email (e.g., `your.gmail.address@gmail.com`)
- `EMAIL_HOST_PASSWORD`: email password or Gmail App Password
- `EMAIL_USE_TLS`: `True`
- `DEFAULT_FROM_EMAIL`: e.g., `"Puppy CRM <no-reply@puppycrm.local>"`

The backend reads these from `backend/config/settings.py` (already wired).

---

## ✉️ Gmail SMTP (Recommended for Dev)

Using Gmail? Create an App Password first:

1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Google Account → Security → App passwords
   - App: Mail; Device: Other (Puppy CRM)
   - Copy the 16-character password
3. Put that value in `EMAIL_HOST_PASSWORD` in `backend/.env`

More details: `docs/THIRD_PARTY_APIS.md` → SMTP Email (Gmail)

---

## 🔗 How invitations use these settings

- `FRONTEND_URL` is used to build the accept-invitation link in emails
- SMTP variables enable sending the email via `django.core.mail.send_mail`
- Implementation locations:
  - Settings: `backend/config/settings.py` (SMTP + `FRONTEND_URL`)
  - Email util: `backend/apps/authentication/utils.py`
  - Endpoints: `backend/apps/authentication/views.py` (Phase 3.4)

---

## ▶️ Apply settings and run

From the repo root:

```powershell
Set-Location H:\puppy_crm\backend
H:/puppy_crm/.venv/Scripts/python.exe manage.py migrate
H:/puppy_crm/.venv/Scripts/python.exe manage.py check
H:/puppy_crm/.venv/Scripts/python.exe manage.py runserver
```

If you use the `python` command directly instead of the venv path, ensure the terminal is using the correct interpreter.

---

## 🔍 Quick test: Invitation flow

1) Invite a teammate (requires a company user token)

```powershell
$ACCESS = "<your_company_user_access_token>"
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/auth/company/invite/" -Headers @{Authorization="Bearer $ACCESS"} -ContentType "application/json" -Body '{"email":"teammate@example.com","role":"manager"}'
```

2) Validate a token (public)

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:8000/api/auth/validate-invitation/<uuid-token>/"
```

3) Accept the invite (public)

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/auth/accept-invitation/" -ContentType "application/json" -Body '{"invitation_token":"<uuid-token>","password":"SecurePass123!","department":"sales"}'
```

---

## ✅ Troubleshooting

- If `manage.py check` complains about `ImageField`/Pillow, install:

```powershell
H:/puppy_crm/.venv/Scripts/python.exe -m pip install Pillow
```

- If emails don’t arrive:
  - Double-check `EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD`
  - For Gmail, ensure App Password is used (not your regular password)
  - Check spam folder
  - In development, invitation sending fails silently by design

---

Last updated: November 14, 2025
