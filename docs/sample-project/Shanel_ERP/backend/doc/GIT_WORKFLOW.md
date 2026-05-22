# 🚀 Backend Git Workflow Guide

## **📋 After Pulling New Code**

Every time you pull code from Git, **always follow these steps** in order:

### **Step 1: Install Dependencies** (if package.json changed)
```bash
npm install
```

### **Step 2: Run Database Migrations** ⚡ **IMPORTANT**
```bash
npx sequelize-cli db:migrate
```

This updates your database schema with any new tables or columns.

### **Step 3: Start the Backend**
```bash
npm start
```
or
```bash
npm run dev
```

---

## **🔄 Full Workflow Command Sequence**

```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Run pending migrations
npx sequelize-cli db:migrate

# Start backend server
npm start
```

---

## **❌ DO NOT Skip Migrations!**

If you skip `npx sequelize-cli db:migrate`:
- ❌ Database schema won't match code
- ❌ Payment table missing new columns
- ❌ App will crash with database errors
- ❌ Credit_Amount, Invoice_Total won't be stored

### **Error signs you skipped migrations:**
```
Error: Unknown column 'Credit_Amount' in payment table
Error: Unknown column 'Cheque_Amount' in payment table
ECONNREFUSED when trying to save payment
```

---

## **🤔 How to Know if Migrations Are Pending?**

Run this to check:
```bash
npx sequelize-cli db:migrate:status
```

Output:
```
✅ up   20260506-update-payment-table.js
✅ up   20260507-add-missing-payment-fields.js
```

All should show `✅ up` (already run)

---

## **🛠️ Individual Database Credentials**

Each developer has their own `.env` file with personal credentials:

```bash
# Your .env (NEVER commit this)
DB_USER=root
DB_PASS=your_password
DB_NAME=shanel_erp
```

**Team members:**
- ✅ Update their own `.env` file
- ✅ Create from `.env.example` template
- ✅ Keep `.env` local (don't push to Git)

---

## **📁 Important Files**

| File | Purpose | Do I Edit? |
|------|---------|-----------|
| `migrations/` | Database changes | ❌ No - only run them |
| `.sequelizerc` | CLI configuration | ❌ No - shared with team |
| `config/config.js` | DB config template | ❌ No - uses your `.env` |
| `.env` | Your local credentials | ✅ Yes - local only |
| `.env.example` | Template for team | ❌ No - don't commit `.env` |

---

## **⚠️ Common Issues & Solutions**

### **Issue: "No migrations were executed"**
✅ This is **GOOD** - it means migrations already ran

### **Issue: "Data truncated for column 'Payment_Method'"**
❌ You have stale data - contact team lead

### **Issue: "Cannot connect to database"**
✅ Check your `.env` file:
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
```

### **Issue: "Unknown column 'Credit_Amount'"**
❌ You forgot to run migrations! Run:
```bash
npx sequelize-cli db:migrate
```

---

## **✅ Checklist Before Committing Code**

- [ ] Pulled latest code: `git pull origin main`
- [ ] Ran migrations: `npx sequelize-cli db:migrate`
- [ ] Tested locally: `npm start`
- [ ] No database errors
- [ ] Payment table has all columns (Credit_Amount, Cheque_Amount, Invoice_Total)

---

## **💡 Tips for Team Members**

1. **Always run migrations after pull** - Don't assume DB is up to date
2. **Create `.env` from `.env.example`** - Never use hardcoded credentials
3. **Test before pushing** - Verify migrations work locally first
4. **Report migration errors** - Let team lead know ASAP
5. **Keep `.env` private** - Never commit sensitive data

---

## **📞 Need Help?**

If you get migration errors:
1. Show the error message
2. Run: `npx sequelize-cli db:migrate:status`
3. Share your `.env` settings (redact passwords)
4. Contact: [Team Lead]

---

## **🎯 Remember:**

> **Migrations = Database updates**
> 
> Without running migrations, your code will fail because the database schema won't match.

