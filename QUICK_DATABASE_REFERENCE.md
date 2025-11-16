# 🚀 QUICK REFERENCE: Database Setup

## ✅ Current Status
```
Database: crm_db (Connected ✓)
User: postgres
Host: localhost:5432
Migrations: Applied ✓
Status: READY TO USE
```

---

## 📦 Two Options for New PC

### Option 1: Fresh Start (5 minutes) ⚡
```bash
# 1. Install PostgreSQL → Create database "crm_db"
# 2. Copy project folder
# 3. Run these commands:

cd puppy_crm
python -m venv .venv
.\.venv\Scripts\activate
cd backend
pip install -r requirements.txt
python manage.py migrate  # ← Creates all tables automatically
cd ../frontend-web
npm install

# Done! Empty database, ready for new users
```

### Option 2: Copy Existing Data (15 minutes) 📦
```bash
# 1. Backup on old PC:
pg_dump -U postgres -F c -f backup.dump crm_db

# 2. Copy backup.dump + project folder to new PC
# 3. Install PostgreSQL → Create database "crm_db"
# 4. Restore backup:
pg_restore -U postgres -d crm_db backup.dump

# 5. Setup code (same as Option 1)

# Done! All existing users and data preserved
```

---

## ❓ FAQ

**Q: Is my database correctly connected?**
✅ YES! Test confirmed working.

**Q: Do I need to copy database to new PC?**
❌ NO - Just create new database with same name "crm_db"
✅ Then run `python manage.py migrate` to create tables

**Q: Will same database name auto-connect with data?**
❌ NO - Same name = Empty database
✅ Must restore backup to get data, OR
✅ Just use migrations for fresh start

**Q: What if I use different password on new PC?**
✅ Create `.env` file with new password:
```
DATABASE_PASSWORD=your-new-password
```

**Q: Where is database stored?**
📁 PostgreSQL data folder, NOT in project folder
- NOT in `puppy_crm` folder
- In `C:\Program Files\PostgreSQL\16\data\`

---

## 🔍 Test Database Connection

```bash
cd backend
python manage.py check --database default
# Should show: System check identified no issues ✓
```

---

## 📞 Common Commands

```bash
# Check migrations
python manage.py showmigrations

# Apply migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Open Django shell
python manage.py shell

# Backup database (PowerShell)
pg_dump -U postgres -F c -f backup.dump crm_db

# Restore database (PowerShell)
pg_restore -U postgres -d crm_db backup.dump
```

---

## ⚠️ Remember

1. Migrations create tables ✓
2. Backup saves data ✓
3. Code ≠ Data ✓
4. Always test on new PC ✓

---

**See full guide:** `DATABASE_SETUP_NEW_PC.md`
