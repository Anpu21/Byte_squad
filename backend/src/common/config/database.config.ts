import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

// Env vars arrive as strings, so coerce explicitly — otherwise the string
// 'false' is truthy and would leave DB_SYNC / DB_SSL enabled when set to false.
const isTrue = (value: unknown): boolean => value === true || value === 'true';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', 'postgres'),
  database: configService.get<string>('DB_NAME', 'ledgerpro'),
  autoLoadEntities: true,
  synchronize: isTrue(configService.get('DB_SYNC')),
  logging: isTrue(configService.get('DB_LOGGING')),
  // Managed Postgres (Supabase, RDS, …) requires TLS. Set DB_SSL=true in prod.
  ssl: isTrue(configService.get('DB_SSL'))
    ? { rejectUnauthorized: false }
    : false,
});
