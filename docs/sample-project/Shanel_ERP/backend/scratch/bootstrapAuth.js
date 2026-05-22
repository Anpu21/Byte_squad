const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });

const modules = [
    ['dashboard', 'Dashboard', 'dashboard', 1],
    ['pos', 'Point of Sale', 'pos', 2],
    ['inventory', 'Inventory', 'inventory', 3],
    ['production', 'Production', 'production', 4],
    ['sales', 'Sales', 'sales', 5],
    ['finance', 'Finance', 'finance', 6],
    ['reports', 'Reports', 'reports', 7],
    ['hr', 'Human Resources', 'hr', 8],
    ['user_management', 'User Management', 'users', 9]
];

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    await connection.query(`
        CREATE TABLE IF NOT EXISTS MODULE (
            Module_ID INT PRIMARY KEY AUTO_INCREMENT,
            Module_Key VARCHAR(50) NOT NULL UNIQUE,
            Module_Name VARCHAR(100) NOT NULL,
            Icon VARCHAR(50) NULL,
            Sort_Order INT NOT NULL DEFAULT 0,
            Is_Active BOOLEAN DEFAULT TRUE
        ) ENGINE=InnoDB
    `);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS USER_MODULE_ACCESS (
            Access_ID INT PRIMARY KEY AUTO_INCREMENT,
            User_ID INT NOT NULL,
            Module_ID INT NOT NULL,
            Granted_By INT NULL,
            Granted_At DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_module (User_ID, Module_ID),
            CONSTRAINT fk_uma_user FOREIGN KEY (User_ID) REFERENCES USER(User_ID)
                ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_uma_module FOREIGN KEY (Module_ID) REFERENCES MODULE(Module_ID)
                ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_uma_granter FOREIGN KEY (Granted_By) REFERENCES USER(User_ID)
                ON UPDATE CASCADE ON DELETE SET NULL
        ) ENGINE=InnoDB
    `);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS USER_TOKEN (
            Token_ID INT PRIMARY KEY AUTO_INCREMENT,
            User_ID INT NOT NULL,
            Refresh_Token VARCHAR(512) NOT NULL,
            Device_Info VARCHAR(255) NULL,
            IP_Address VARCHAR(45) NULL,
            Expires_At DATETIME NOT NULL,
            Revoked BOOLEAN DEFAULT FALSE,
            Revoked_At DATETIME NULL,
            Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_user_token_user FOREIGN KEY (User_ID) REFERENCES USER(User_ID)
                ON UPDATE CASCADE ON DELETE CASCADE
        ) ENGINE=InnoDB
    `);

    for (const moduleRow of modules) {
        await connection.execute(
            `INSERT INTO MODULE (Module_Key, Module_Name, Icon, Sort_Order, Is_Active)
             VALUES (?, ?, ?, ?, TRUE)
             ON DUPLICATE KEY UPDATE
                Module_Name = VALUES(Module_Name),
                Icon = VALUES(Icon),
                Sort_Order = VALUES(Sort_Order),
                Is_Active = TRUE`,
            moduleRow
        );
    }

    const [adminRows] = await connection.execute(
        'SELECT User_ID, Password_Hash FROM USER WHERE Username = ?',
        ['admin']
    );

    if (adminRows.length === 0) {
        const passwordHash = await bcrypt.hash('admin123', 12);
        await connection.execute(
            `INSERT INTO USER
                (Username, Password_Hash, Full_Name, User_Type, Status, Created_At, Updated_At)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            ['admin', passwordHash, 'System Admin', 'Admin', 'Active']
        );
    } else {
        const passwordHash = await bcrypt.hash('admin123', 12);
        await connection.execute(
            `UPDATE USER
             SET Password_Hash = ?,
                 Failed_Login_Attempts = 0,
                 Account_Locked_Until = NULL,
                 Status = 'Active',
                 Updated_At = NOW()
             WHERE Username = ?`,
            [passwordHash, 'admin']
        );
    }

    const [[admin]] = await connection.execute(
        'SELECT User_ID FROM USER WHERE Username = ?',
        ['admin']
    );

    await connection.execute(
        `INSERT IGNORE INTO USER_MODULE_ACCESS (User_ID, Module_ID, Granted_By)
         SELECT ?, Module_ID, ?
         FROM MODULE
         WHERE Is_Active = TRUE`,
        [admin.User_ID, admin.User_ID]
    );

    const [accessRows] = await connection.execute(
        `SELECT m.Module_Key
         FROM USER_MODULE_ACCESS uma
         JOIN MODULE m ON m.Module_ID = uma.Module_ID
         WHERE uma.User_ID = ?
         ORDER BY m.Sort_Order`,
        [admin.User_ID]
    );

    console.log('Auth bootstrap complete');
    console.log('Admin username: admin');
    console.log('Admin password: admin123');
    console.log('Admin module access:', accessRows.map(row => row.Module_Key).join(', '));

    await connection.end();
}

main().catch(error => {
    console.error(error.message);
    process.exit(1);
});
