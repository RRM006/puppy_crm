# CRM System Backend (Phase 1 Setup)

This is the Django + PostgreSQL backend for the CRM system.

## 1. Project Structure
```
backend/
├── apps/
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── manage.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## 2. Python Version
Use Python 3.11 or 3.12 for best compatibility. (Current environment is 3.14 which causes `psycopg2-binary` load issues.)

## 3. Create & Activate Virtual Environment (Windows PowerShell)
```powershell
python -m venv .venv
./.venv/Scripts/Activate.ps1
```
If using a different Python version installed (e.g. 3.12), specify its executable explicitly.

## 4. Install Dependencies
```powershell
pip install -r requirements.txt
```
If `psycopg2-binary` fails on your Python version, install psycopg 3 instead:
```powershell
pip install "psycopg[binary]"
```

## 5. Environment Variables
Create a `.env` file in `backend/` based on `.env.example`:
```
DATABASE_NAME=crm_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
SECRET_KEY=your-secret-key-here
DEBUG=True
```

## 6. Database Setup
Ensure PostgreSQL is running and the database/user exist:
```sql
CREATE DATABASE crm_db;
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE crm_db TO postgres;
```
Adjust user/password to your secure choices.

## 7. Run Migrations
(Requires working PostgreSQL driver.)
```powershell
python manage.py migrate
```
If you still get `Error loading psycopg2 or psycopg module`, switch to Python 3.12 and recreate the virtual environment.

## 8. Run Development Server (Do NOT start yet per Phase 1 instructions)
When ready:
```powershell
python manage.py runserver
```

## 9. Available Endpoints (Phase 1)
- `GET /api/health/` → `{"status": "ok", "message": "Backend is running"}`

## 10. CORS Configuration
Allowed origins (for upcoming frontend):
- `http://localhost:3000`
- `http://localhost:19006`

## 11. REST & Auth
`rest_framework` and `rest_framework_simplejwt` installed. JWT usage will be configured in later phases.

## 12. Troubleshooting
- Driver error: Ensure compatible Python version and re-install `psycopg2-binary`.
- Env vars not loading: Confirm `.env` file exists and names match `settings.py` expectations.
- CORS blocked: Verify origin matches one of the allowed hosts.

## 13. Next Steps (Future Phases)
- Create core domain apps inside `apps/` (e.g., `leads`, `accounts`, `contacts`).
- Implement authentication & JWT token endpoints.
- Add initial models and serializers.
- Add API versioning and pagination settings.

---
Phase 1 complete except migrations (blocked by driver compatibility). Switch to a supported Python version to finish migrations.
