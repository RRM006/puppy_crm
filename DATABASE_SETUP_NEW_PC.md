# Database Connection & Setup Guide

## ✅ Your Current Database Connection Status

**Good News:** Your database is **CORRECTLY CONNECTED** ✓

**Current Configuration:**
- **Database Name:** crm_db
- **Database User:** postgres
- **Database Host:** localhost (127.0.0.1)
- **Database Port:** 5432 (PostgreSQL default)
- **Connection Test:** ✅ PASSED (System check identified no issues)

---

## 🔍 How Database Connection Works

### Configuration Location
Your database settings are in: `backend/config/settings.py`

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DATABASE_NAME', default='postgres'),      # crm_db
        'USER': config('DATABASE_USER', default='postgres'),       # postgres
        'PASSWORD': config('DATABASE_PASSWORD', default='1234'),   # Your password
        'HOST': config('DATABASE_HOST', default='localhost'),      # localhost
        'PORT': config('DATABASE_PORT', default='5432'),           # 5432
    }
}
```

### How Settings Are Loaded

Django uses `python-decouple` to read from `.env` file or use defaults:

1. **First:** Check for `.env` file in project root
2. **If found:** Use values from `.env`
3. **If not found:** Use default values in `settings.py`

**Your current setup:** Using default values (no `.env` file found)

---

## 🆕 Setting Up on a New PC - Two Options

### Option 1: Fresh Setup (Recommended for Development)

**This is EASIER and CLEANER** ✅

#### Step 1: Install PostgreSQL on New PC
1. Download PostgreSQL from: https://www.postgresql.org/download/
2. Install with same settings:
   - **User:** postgres
   - **Password:** 1234 (or your chosen password)
   - **Port:** 5432

#### Step 2: Create Database
```sql
-- Open pgAdmin or psql command line
CREATE DATABASE crm_db;
```

#### Step 3: Clone/Copy Project to New PC
```bash
# Copy entire puppy_crm folder
# OR clone from git repository
```

#### Step 4: Create Virtual Environment
```bash
cd puppy_crm
python -m venv .venv
.\.venv\Scripts\activate  # Windows
```

#### Step 5: Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Step 6: Run Migrations (Creates Tables)
```bash
python manage.py migrate
```
**This automatically creates all tables in the new database!**

#### Step 7: Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

#### Step 8: Install Frontend Dependencies
```bash
cd ../frontend-web
npm install
```

**DONE!** ✅ Your project is ready on the new PC.

**Result:** 
- ✅ Empty database with correct structure
- ✅ Ready to create new users
- ✅ All tables created automatically by migrations
- ❌ No existing user data (fresh start)

---

### Option 2: Copy Database with Existing Data

**Use this if you want to keep all existing users and data** 📦

#### Step 1: Backup Database on Current PC

**Method A: Using pgAdmin (GUI)**
1. Open pgAdmin
2. Right-click on `crm_db` database
3. Select **Backup...**
4. Choose format: **Custom** or **Tar**
5. Choose location: `H:\puppy_crm\database_backup.dump`
6. Click **Backup**

**Method B: Using Command Line**
```bash
# Open PowerShell or Command Prompt
cd H:\puppy_crm

# Create backup file
"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -F c -b -v -f "database_backup.dump" crm_db

# Enter password when prompted: 1234
```

**Result:** You now have `database_backup.dump` file with all your data.

#### Step 2: Copy Files to New PC
Copy these to USB/cloud/network:
1. Entire `puppy_crm` folder
2. `database_backup.dump` file

#### Step 3: Install PostgreSQL on New PC
Same as Option 1 - Step 1

#### Step 4: Create Empty Database
```sql
CREATE DATABASE crm_db;
```

#### Step 5: Restore Database from Backup

**Method A: Using pgAdmin**
1. Open pgAdmin on new PC
2. Right-click on `crm_db` database
3. Select **Restore...**
4. Choose your `database_backup.dump` file
5. Click **Restore**

**Method B: Using Command Line**
```bash
cd path\to\backup

# Restore database
"C:\Program Files\PostgreSQL\16\bin\pg_restore.exe" -U postgres -d crm_db -v "database_backup.dump"

# Enter password when prompted
```

#### Step 6: Setup Project
Same as Option 1 - Steps 3-5 and 8

**DONE!** ✅ Your project with all existing data is now on new PC.

**Result:**
- ✅ Database with all existing users
- ✅ All companies and customers preserved
- ✅ Login with existing accounts works immediately
- ✅ Complete data migration

---

## 📊 Comparison: Fresh vs Copy Database

| Aspect | Option 1: Fresh Setup | Option 2: Copy Database |
|--------|----------------------|------------------------|
| **Speed** | ⚡ Fast (5 minutes) | 🐌 Slower (15-20 minutes) |
| **Complexity** | 😊 Easy | 😐 Moderate |
| **Data** | ❌ No existing data | ✅ All existing data |
| **Users** | ❌ Must create new | ✅ Existing users work |
| **Best for** | Development, Testing | Production, Demo with data |
| **Database size** | Small (empty) | Same as original |
| **Recommended** | ✅ Yes (for dev) | Only if data needed |

---

## 🔧 Create .env File (Optional but Recommended)

Instead of using default values in `settings.py`, create `.env` file:

### Create File: `H:\puppy_crm\.env`

```env
# Django Settings
SECRET_KEY=your-secret-key-here-change-this-in-production
DEBUG=True

# Database Settings
DATABASE_NAME=crm_db
DATABASE_USER=postgres
DATABASE_PASSWORD=1234
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Google OAuth
GOOGLE_CLIENT_ID=324860582148-cbt87g1gg0qmf913n8uv46vjlq1hqqiq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### Benefits of .env File:
- ✅ Easier to change settings
- ✅ Different settings per environment (dev/production)
- ✅ Keep secrets out of code
- ✅ Easy to share with team (without passwords in git)

### Important: Add to .gitignore
```
# In .gitignore file
.env
*.env
```

**Why?** Never commit passwords to git!

---

## 🧪 Test Database Connection

### Method 1: Django Check Command
```bash
cd backend
python manage.py check --database default
```
**Expected:** `System check identified no issues (0 silenced).` ✅

### Method 2: Django Shell
```bash
python manage.py shell
```
```python
from django.db import connection
connection.ensure_connection()
print("Database connected:", connection.is_usable())
# Should print: Database connected: True
```

### Method 3: Query User Count
```bash
python manage.py shell
```
```python
from apps.authentication.models import User
print("Total users:", User.objects.count())
```

### Method 4: pgAdmin Connection Test
1. Open pgAdmin
2. Expand: Servers → PostgreSQL 16
3. Expand: Databases → crm_db
4. If you see tables under Schemas → public → Tables ✅ Connected!

---

## 🚀 Quick Setup Commands for New PC

Copy-paste this entire block:

```bash
# 1. Create database in pgAdmin or psql:
# CREATE DATABASE crm_db;

# 2. Setup Python environment
cd puppy_crm
python -m venv .venv
.\.venv\Scripts\activate

# 3. Install backend dependencies
cd backend
pip install -r requirements.txt

# 4. Run migrations (creates tables)
python manage.py migrate

# 5. Create admin user (optional)
python manage.py createsuperuser

# 6. Test connection
python manage.py check --database default

# 7. Install frontend dependencies
cd ../frontend-web
npm install

# 8. Start servers (in separate terminals)
# Terminal 1 - Backend:
cd backend
python manage.py runserver

# Terminal 2 - Frontend:
cd frontend-web
npm run dev
```

**Time: ~5-10 minutes** ⏱️

---

## 🔒 Important Notes

### 1. **Database Lives in PostgreSQL, NOT in Project Folder**
- ❌ Database is NOT stored in `puppy_crm` folder
- ✅ Database is stored in PostgreSQL data directory:
  - Windows: `C:\Program Files\PostgreSQL\16\data\`
  - Or: `C:\PostgreSQL\16\data\`

### 2. **Copying Project Folder ≠ Copying Database**
- Copying `puppy_crm` folder = Code only
- Must separately backup/restore database

### 3. **Migration Files ARE Portable**
- ✅ `backend/apps/authentication/migrations/*.py` files
- These files CREATE tables on any new database
- Copy them with your project code

### 4. **Same Database Name & Password ≠ Auto-Connect**
- Creating database named `crm_db` on new PC
- Does NOT automatically have your data
- Must either:
  - Run migrations (empty tables)
  - OR restore backup (with data)

---

## 🆘 Troubleshooting Common Issues

### Issue 1: "FATAL: database 'crm_db' does not exist"
**Solution:**
```sql
-- In pgAdmin or psql:
CREATE DATABASE crm_db;
```

### Issue 2: "FATAL: password authentication failed for user 'postgres'"
**Solution:** 
- Check password in `settings.py` matches PostgreSQL password
- Or create `.env` file with correct password

### Issue 3: "psycopg2.OperationalError: could not connect to server"
**Solution:**
- Check PostgreSQL service is running
- Windows: Services → postgresql-x64-16 → Start
- Or: Task Manager → Services → postgresql-x64-16

### Issue 4: "No such table: authentication_user"
**Solution:**
```bash
# Run migrations to create tables
python manage.py migrate
```

### Issue 5: "Port 5432 already in use"
**Solution:**
- Another PostgreSQL instance running
- Or change port in `settings.py`

---

## 📋 Checklist: Moving Project to New PC

- [ ] Install PostgreSQL (same version recommended)
- [ ] Create database: `CREATE DATABASE crm_db;`
- [ ] Copy project folder to new PC
- [ ] Create virtual environment: `python -m venv .venv`
- [ ] Activate environment: `.\.venv\Scripts\activate`
- [ ] Install Python packages: `pip install -r requirements.txt`
- [ ] Run migrations: `python manage.py migrate`
- [ ] (Optional) Restore database backup: `pg_restore ...`
- [ ] Install Node packages: `npm install` (in frontend-web)
- [ ] Test backend: `python manage.py runserver`
- [ ] Test frontend: `npm run dev`
- [ ] Create test user via signup page
- [ ] Verify data in pgAdmin

---

## 🎯 Recommended Workflow

### For Development (Multiple Developers)
```
1. Use Git for code (including migration files)
2. Each developer: Fresh PostgreSQL install
3. Each developer: Run migrations locally
4. Each developer: Create own test data
5. Share: Code + Migration files only
```

### For Demo/Staging
```
1. Setup PostgreSQL on server
2. Restore database backup with sample data
3. Deploy code
4. Use same .env settings
```

### For Production
```
1. Use managed PostgreSQL (AWS RDS, Azure, etc.)
2. Automated backups
3. Use environment variables (not .env file)
4. Different credentials per environment
```

---

## 💡 Best Practices

1. **Always keep database backups**
   - Schedule weekly backups
   - Store in multiple locations
   - Test restore process

2. **Use .env file for settings**
   - Never commit to git
   - Different per environment
   - Easy to change

3. **Document database credentials**
   - Keep team password manager
   - Share securely (not in email)

4. **Test migrations before deploying**
   - Run on dev database first
   - Check for errors
   - Backup before migrate

5. **Use version control for migrations**
   - Commit migration files to git
   - Sequential numbering
   - Never edit old migrations

---

**Created:** 2025-11-14  
**Purpose:** Database connection and setup guide for new PC
