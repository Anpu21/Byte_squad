import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'smartbiz-super-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRY || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    },

    // Encryption for backups
    encryption: {
        key: process.env.ENCRYPTION_KEY || 'default-32-byte-encryption-key!!',
        backupKey: process.env.BACKUP_KEY || 'default-backup-encryption-key!!!',
    },

    // Application settings
    settings: {
        companyName: process.env.COMPANY_NAME || 'SmartBiz ERP',
        defaultCurrency: process.env.DEFAULT_CURRENCY || 'INR',
        decimalPlaces: parseInt(process.env.DECIMAL_PLACES, 10) || 2,
    },
}));
