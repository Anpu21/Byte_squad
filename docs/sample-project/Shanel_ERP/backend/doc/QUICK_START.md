# ⚡ Quick Start Guide for Team Members

## **First Time Setup (New Developer)**

```bash
# 1. Clone repository
git clone <repo-url>
cd Shanel_ERP/backend

# 2. Create your .env file (copy from template)
cp .env.example .env

# 3. Edit .env with YOUR database credentials
# Open .env and update:
#   DB_USER=root
#   DB_PASS=your_password

# 4. Install dependencies
npm install

# 5. Run migrations
npx sequelize-cli db:migrate

# 6. Start backend
npm start
```

---

## **Daily Workflow (After Pull)**

```bash
# 1. Pull new code
git pull origin main

# 2. Install new dependencies (if any)
npm install

# 3. Run migrations (ALWAYS!)
npx sequelize-cli db:migrate

# 4. Start working
npm start
```

---

## **Before Committing**

```bash
# 1. Make sure migrations ran
npx sequelize-cli db:migrate:status

# 2. Test your code
npm start

# 3. Check for errors
# All good? Ready to commit!
```

---

## **If Database Gets Messed Up**

```bash
# Check status
npx sequelize-cli db:migrate:status

# See what migrations are pending
npx sequelize-cli db:migrate:status

# Contact team lead if stuck!
```

---

## **Payment Table Fields (After Migrations)**

✅ These columns should exist:
- `Pay_ID`, `Sale_ID`, `Payment_Date`, `Payment_Time`
- `Payment_Method` (with: Cash, Cheque, Bank_Transfer, Credit, Mixed, Pending)
- `Payment_Amount`, `Invoice_Total` ⭐
- `Cash_Tendered`, `Cash_Amount`, `Cash_Change`
- `Cheque_No`, `Cheque_Amount` ⭐, `Cheque_Bank`, `Cheque_Branch`, etc.
- `Bank_Transfer_Amount`, `Bank_Name`, `Bank_Branch`, `Bank_Ref`
- `Credit_Amount` ⭐, `Keep_Balance`, `Credit_Ref`
- `Receipt_No`, `Receipt_Printed`, `Receipt_Print_Date`
- `Notes`, `Status`, `Created_At`

⭐ = New fields added by recent migrations

---

## **Don't Forget!**

🔴 **MUST run after git pull:**
```bash
npx sequelize-cli db:migrate
```

🔴 **DO NOT commit `.env`** (keep it local)

🔴 **DO commit `.env.example`** (template only)

---

**That's it! You're ready to develop!** 🎉
