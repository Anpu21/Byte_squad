import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import path from 'node:path';

/**
 * Database module configuring TypeORM with SQLite (better-sqlite3).
 * 
 * Architecture note: The entity definitions and column types are kept
 * PostgreSQL-compatible so switching the driver for remote sync/backup
 * only requires changing DB_TYPE and DB_DATABASE in .env.
 */
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const dbType = config.get<string>('DB_TYPE') || 'better-sqlite3';
                return {
                    type: dbType as 'better-sqlite3',
                    database: path.join(process.cwd(), config.get<string>('DB_DATABASE') || 'data.sqlite'),
                    autoLoadEntities: true,
                    synchronize: true, // Disable in production — use migrations instead
                };
            },
        }),
    ],
})
export class DatabaseModule { }
