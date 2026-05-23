# Auth & User Management Setup Guide

This guide explains how to bootstrap the authentication system and create an initial Admin user for the Shanel ERP.

## 1. Environment Configuration
Ensure your `.env` file in the `backend` directory contains the following keys:
```env
JWT_SECRET=your_secure_random_secret
REFRESH_TOKEN_SECRET=your_secure_refresh_secret
```

## 2. Generating a Password Hash
If you need to create a user manually via SQL, you must hash the password first. We have provided a utility script for this.

1. Open `backend/scratch/genHash.js`.
2. Change the `password` variable to your desired password.
3. Run the script:
   ```bash
   node scratch/genHash.js
   ```
4. Copy the generated `HASH` string from the terminal.

## 3. Creating the Admin User (SQL)
Run the following SQL commands in your database terminal to create the admin user and grant them access to the **User Management** module.

> [!IMPORTANT]
> Use the hash you generated in Step 2 in the query below.

```sql
-- 1. Create the Admin User
INSERT INTO USER (Username, Password_Hash, Full_Name, User_Type, Status, Created_At, Updated_At)
VALUES (
    'admin', 
    '$2b$12$cKp9He7.KCvJZiLtsF/0WO3d5xwrCV2/mFzgglvdxUhe1Hj2Z3KOW', -- Example hash for 'admin123'
    'System Admin', 
    'Admin', 
    'Active',
    NOW(),
    NOW()
);

-- 2. Grant Access to User Management (Module_ID 8)
-- Check your User_ID for the 'admin' user first (e.g. SELECT User_ID FROM USER WHERE Username='admin';)
INSERT INTO USER_MODULE_ACCESS (User_ID, Module_ID) 
VALUES (14, 8); 
```

## 4. Module Access
The system uses **Module Keys** to control the Sidebar and API access. Ensure the `MODULE` table is populated with the following keys:
- `inventory`
- `pos`
- `hr`
- `finance`
- `user_management`

## 5. Running the Application
1. Start the backend: `npm run dev` (Port 5000)
2. Start the frontend: `npm run dev` (Port 5173)
3. Log in at `http://localhost:5173/login`
