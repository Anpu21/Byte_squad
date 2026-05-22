# 📋 Team Onboarding Checklist

## **For Each Team Member (First Time)**

- [ ] **Clone the repository**
  ```bash
  git clone <repo-url>
  cd Shanel_ERP/backend
  ```

- [ ] **Create `.env` file**
  ```bash
  cp .env.example .env
  ```

- [ ] **Update `.env` with YOUR credentials**
  - Edit `.env` in VS Code
  - Update: `DB_USER`, `DB_PASS`
  - Do NOT commit this file (git will ignore it)

- [ ] **Install dependencies**
  ```bash
  npm install
  ```

- [ ] **Run database migrations**
  ```bash
  npx sequelize-cli db:migrate
  ```

- [ ] **Verify migrations ran**
  ```bash
  npx sequelize-cli db:migrate:status
  ```
  Expected: All show `✅ up`

- [ ] **Start backend**
  ```bash
  npm start
  ```
  Expected: Server starts without database errors

- [ ] **Test Payment table has new columns**
  In MySQL:
  ```sql
  use shanel_erp;
  desc payment;
  ```
  Should see:
  - `Credit_Amount`
  - `Cheque_Amount`
  - `Invoice_Total`
  - `Keep_Balance`
  - All other new fields

- [ ] **Read documentation**
  - [ ] Read `GIT_WORKFLOW.md`
  - [ ] Read `QUICK_START.md`
  - [ ] Bookmark this checklist

---

## **Daily Workflow (Every Day After Pulling)**

```bash
# 1. Get latest code
git pull origin main

# 2. Install any new packages
npm install

# 3. Run migrations (ALWAYS!)
npx sequelize-cli db:migrate

# 4. Start development
npm start
```

---

## **Before Committing Your Code**

- [ ] Ran migrations: `npx sequelize-cli db:migrate`
- [ ] Code starts without errors: `npm start`
- [ ] No database-related errors in console
- [ ] Payment fields being saved correctly
- [ ] Ready to push!

---

## **Troubleshooting**

### ❌ Error: "Unknown column 'Credit_Amount'"
✅ Solution:
```bash
npx sequelize-cli db:migrate
npm start
```

### ❌ Error: "Cannot connect to database"
✅ Solution:
1. Check `.env` file exists
2. Check credentials are correct
3. Check MySQL is running
4. Try: `mysql -u root -p`

### ❌ Error: "Duplicate column name"
✅ Solution: This means migrations already ran - this is GOOD!

### ❌ Error: "No such file or directory: .env"
✅ Solution:
```bash
cp .env.example .env
# Then edit .env with your credentials
```

---

## **Important Reminders**

🔴 **DO THIS:**
- ✅ Run migrations after every git pull
- ✅ Keep `.env` local (don't push it)
- ✅ Update `.env` with your credentials
- ✅ Run `npm install` after pull

🔴 **DON'T DO THIS:**
- ❌ Skip running migrations
- ❌ Commit `.env` file
- ❌ Commit `.env` with hardcoded passwords
- ❌ Run migrations from multiple places at once

---

## **Quick Reference: Migration Commands**

```bash
# Check status
npx sequelize-cli db:migrate:status

# Run pending migrations
npx sequelize-cli db:migrate

# See what will run (without running)
npx sequelize-cli db:migrate:status

# Undo last migration (not recommended)
npx sequelize-cli db:migrate:undo
```

---

## **Files You Need to Know About**

| File | What It Does | Do I Edit? |
|------|------------|-----------|
| `.env` | Your personal DB credentials | ✅ YES (local only) |
| `.env.example` | Template for `.env` | ❌ No |
| `migrations/` | Database changes | ❌ No (just run them) |
| `.sequelizerc` | CLI config | ❌ No |
| `GIT_WORKFLOW.md` | Full workflow guide | ✅ Read it |
| `QUICK_START.md` | Quick commands | ✅ Read it |

---

## **Payment Table Fields (33 Total)**

After migrations, your `payment` table should have:

**✅ Old fields (kept):**
- Pay_ID, Sale_ID, Payment_Date, Payment_Time
- Cash_Tendered, Cash_Change
- Cheque_No, Cheque_Date, Cheque_Bank, Cheque_Status, Cleared_Date
- Bank_Name, Received_By, Receipt_Printed, Receipt_Print_Date
- Receipt_No, Status, Notes, Created_At

**✅ New fields (added):**
- Cash_Amount ⭐
- Cheque_Branch ⭐
- Cheque_Amount ⭐
- Cheque_Delivered_By ⭐
- Bank_Transfer_Amount ⭐
- Bank_Branch ⭐
- Bank_Ref ⭐
- Credit_Amount ⭐
- Keep_Balance ⭐
- Credit_Ref ⭐
- Invoice_Total ⭐
- Note ⭐

**✅ Updated:**
- Payment_Method ENUM: Now includes 'Mixed' and 'Pending'

---

## **Getting Help**

If stuck:
1. Check `GIT_WORKFLOW.md` - Troubleshooting section
2. Check `QUICK_START.md` - Common issues
3. Ask team lead
4. Check error message carefully

---

## **Sign-Off**

Once complete, each team member should confirm:

```
✅ I have .env set up with my credentials
✅ I ran npm install
✅ I ran npx sequelize-cli db:migrate
✅ Backend starts without errors
✅ Payment table has all new fields
✅ I read GIT_WORKFLOW.md and QUICK_START.md
✅ I'm ready to develop!
```

---

**Welcome to the team! Let's build something great! 🚀**
