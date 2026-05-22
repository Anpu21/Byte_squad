# 🛡️ DEPLOYMENT SAFETY CHECKLIST

## ⚠️ CRITICAL: Before Your Friends Run This Project

Follow this checklist to prevent data loss like what happened earlier.

---

## 🚨 Data Loss Risks & Mitigations

| Risk | What Causes It | Prevention |
|------|----------------|-----------|
| **Database reset (force: true)** | `databaseCon.sync({ force: true })` drops ALL tables | ✅ Project uses `alter: true` (SAFE) |
| **Hardcoded credentials lost** | `.env` file committed to Git | ✅ `.env` is in `.gitignore` |
| **Wrong database config** | Connection to someone else's database | ✅ Each dev uses their own `.env` |
| **Seed data duplicates** | Scripts run multiple times | ✅ Seed scripts check before adding data |
| **Missing schema migrations** | Old table structure incompatible | ✅ Migrations in `backend/migrations/` |

---

## ✅ Safety Features Already Implemented

### 1. Safe Database Sync ✓
```javascript
// server.js uses ALTER (safe), NOT FORCE (dangerous)
databaseCon.sync({ alter: true })  // ✅ Modifies schema, keeps data
// NOT this:
databaseCon.sync({ force: true })  // ❌ Would delete ALL data
```

### 2. Idempotent Seed Scripts ✓
- `seedBanks.js` - Uses `findOrCreate()` (no duplicates)
- `seedProducts.js` - Checks count before seeding

### 3. Environment Variables Protected ✓
- `.env` is in `.gitignore` (never committed)
- Each developer has their own `.env` file
- Template: `.env.example`

### 4. Database Migrations ✓
- All schema changes in `backend/migrations/`
- Run automatically on server start
- Can be reverted if needed

---

## 📋 First-Time Setup for Team Members

### Step 1: Clone the Repository
```bash
git clone <repo-url>
cd Shanel_ERP/backend
```

### Step 2: Copy .env.example to .env (IMPORTANT!)
```bash
cp .env.example .env
```

### Step 3: Update .env with YOUR Database Credentials
```bash
# Edit .env with your values:
# Windows PowerShell:
code .env

# macOS/Linux:
nano .env
```

### Step 4: Install Dependencies
```bash
npm install
```

### Step 5: Start the Server
```bash
npm start
```

**Expected output:**
```
Backend running on port 5000
✅ Database connected with Sequelize
✅ Database schema synced safely (data preserved)
```

---

## ⚠️ NEVER DO THIS

❌ **Do NOT:**
- Commit `.env` file to Git
- Use `force: true` in database sync
- Hardcode database passwords
- Delete `backend/migrations/` folder
- Run `npm install` without checking `.env` first

✅ **DO:**
- Keep `.env` file LOCAL only
- Use `alter: true` for schema changes
- Create `.env` from `.env.example`
- Keep migrations intact
- Backup database before major updates

---

## 🔄 If You Pull New Code

When pulling new code from Git:

```bash
# 1. Pull latest code
git pull origin main

# 2. Install new dependencies (if package.json changed)
npm install

# 3. Restart server (database migrations run automatically)
npm start
```

**The server will:**
- Check if `.env` exists
- Run database migrations automatically
- Modify schema safely (NO DATA LOSS)
- Seed only if data is missing

---

## 🆘 If Something Goes Wrong

### "Error: Cannot find module .env"
```bash
# Solution: Create .env from template
cp .env.example .env
# Then edit .env with your credentials
```

### "Error: connect ECONNREFUSED"
```bash
# Solution: Check database is running
# Make sure MySQL is started and credentials in .env are correct
```

### "Error: Database sync failed"
```bash
# Solution: Check .env credentials
cat .env  # Verify DB_HOST, DB_USER, DB_PASS, DB_NAME are correct
```

---

## 📞 Reporting Issues

If data loss or errors occur:

1. **STOP the server** (Ctrl+C)
2. **Backup your database** (if not too late)
3. **Take a screenshot** of the error
4. **Share:** error message, `.env` settings (redact password), what you were doing

---

## ✅ Verification Checklist

Before pushing to production/teammates:

- [ ] `alter: true` is used in `server.js` (NOT `force: true`)
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` exists and has template
- [ ] Seed scripts check before adding data
- [ ] Migrations folder exists and is complete
- [ ] All team members have their own `.env` file
- [ ] Database backup exists
- [ ] README documents the setup process

---

## 🎯 Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| Database Safety | ✅ SAFE | Uses `alter: true` |
| Credential Security | ✅ SAFE | `.env` protected |
| Seed Safety | ✅ SAFE | Idempotent scripts |
| Schema Consistency | ✅ SAFE | Migrations in place |
| **Overall** | **✅ SAFE TO SHARE** | Friends won't lose data |

---

**Created:** May 6, 2026
**Last Updated:** May 6, 2026
**Status:** Ready for team deployment ✅
