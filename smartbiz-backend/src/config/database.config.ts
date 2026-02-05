import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
    // SQLite configuration (Primary - Offline)
    sqlite: {
        type: 'better-sqlite3' as const,
        database: process.env.DB_PATH || './data/smartbiz.db',
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV === 'development',
    },

    // PostgreSQL configuration (Cloud Backup)
    postgres: {
        type: 'postgres' as const,
        host: process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT, 10) || 5432,
        username: process.env.PG_USER || 'smartbiz',
        password: process.env.PG_PASSWORD || 'password',
        database: process.env.PG_DATABASE || 'smartbiz_backup',
        synchronize: false,
        logging: false,
    },
}));
