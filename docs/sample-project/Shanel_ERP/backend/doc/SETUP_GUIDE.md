# Backend Setup Guide

## ⚠️ Important: Node Modules Management

**`node_modules/` is NOT committed to the repository** for the following reasons:
- It's too large (5000+ files)
- Dependencies are managed through `package.json` and `package-lock.json`
- Each environment may need different native modules

## 🚀 First Time Setup

After cloning or pulling the repository:

```bash
# Navigate to backend directory
cd Shanel_ERP/backend

# Copy the environment template
cp .env.example .env

# Edit .env with your database credentials
# Open .env and update:
# - DB_HOST
# - DB_PORT
# - DB_USER
# - DB_PASS (your database password)
# - DB_NAME
# - PORT

# Install dependencies
npm install
```

## ▶️ Running the Server

```bash
# Start the development server
npm start
# or
npm run dev
```

**The `ensure-deps.js` script will automatically:**
- Check if dependencies are installed
- Run `npm install` if missing
- Start the server with nodemon

## 📝 What Happens on Each Pull

1. **`node_modules/` will NOT be deleted** because it's in `.gitignore`
2. **`.env` will NOT be overwritten** because it's in `.gitignore` and removed from git tracking
3. The `ensure-deps.js` script will verify dependencies are installed
4. If any packages are missing (e.g., after a new dependency is added to `package.json`), they'll be installed automatically

**Your `.env` file is safe!** It will never be modified by git pulls.

## 🔧 Troubleshooting

### If you see "Module not found" errors:

```bash
# Clear and reinstall all dependencies
rm -r node_modules package-lock.json
npm install
npm start
```

### If dependencies are outdated:

```bash
npm update
npm install
npm start
```

### If `.env` file is missing or corrupted:

```bash
# Check if .env exists
ls -la .env

# If missing, create it from the template
cp .env.example .env

# Edit .env with your credentials
# Windows: notepad .env
# Mac/Linux: nano .env
```

### If database connection fails after a pull:

```bash
# Your .env should NOT have changed. Verify credentials:
cat .env

# If credentials are wrong, update them:
# - DB_HOST: your database host
# - DB_USER: your database username
# - DB_PASS: your database password
```

## 📦 Adding New Dependencies

When you add a new package:

```bash
npm install package-name
# Commit both package.json and package-lock.json
git add package.json package-lock.json
git commit -m "Add new dependency: package-name"
```

**DO NOT commit `node_modules/` to git**

## 🔐 Environment Variables

**IMPORTANT:** Never commit `.env` to git!

- **`.env`** - Contains your sensitive credentials (not committed)
- **`.env.example`** - Template showing what variables are needed (committed to git)

When adding new environment variables:

```bash
# 1. Add to .env (local only - not committed)
# 2. Add to .env.example (template - committed to git)

# Example: Adding a new API key
# .env:
API_KEY=your_actual_key_here

# .env.example:
API_KEY=your_key_here
```

Then commit only `.env.example`:
```bash
git add .env.example
git commit -m "Update environment variables template"
```

## ✅ Verification

Confirm the setup is correct:

```bash
npm start
# You should see:
# ✅ Database connected with Sequelize
# Backend running on port 5000
```

---

**Remember:** Always run `npm start` or `npm run dev` to start the server. The ensure-deps script handles dependency verification automatically.
