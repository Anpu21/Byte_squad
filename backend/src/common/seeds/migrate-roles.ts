/**
 * One-shot data migration: collapse legacy roles into ADMIN.
 *
 * Run BEFORE deploying the code that drops `super_admin` and `accountant`
 * from the UserRole enum, otherwise TypeORM `synchronize` will fail when
 * it tries to remove enum values still referenced by existing rows.
 *
 * Usage: npm run migrate:roles
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '@/app.module.js';

interface RoleCount {
  role: string;
  count: number;
}

async function bootstrap() {
  const logger = new Logger('migrate-roles');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const dataSource = app.get(DataSource);

    const updateResult: unknown = await dataSource.query(
      `UPDATE users SET role = 'admin' WHERE role IN ('super_admin', 'accountant')`,
    );
    const affectedCount =
      Array.isArray(updateResult) && typeof updateResult[1] === 'number'
        ? updateResult[1]
        : 0;
    logger.log(
      `Migrated rows from super_admin/accountant -> admin. Rows affected: ${affectedCount}`,
    );

    const counts: RoleCount[] = await dataSource.query<RoleCount[]>(
      `SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY role`,
    );
    for (const { role, count } of counts) {
      logger.log(`  role=${role} count=${count}`);
    }

    const stale = counts.find(
      (c) => c.role === 'super_admin' || c.role === 'accountant',
    );
    if (stale) {
      logger.error(
        `Migration incomplete — rows with role=${stale.role} still present.`,
      );
      process.exitCode = 1;
    } else {
      logger.log(
        'Migration complete. Safe to deploy code that drops the enum values.',
      );
    }
  } finally {
    await app.close();
  }
}

void bootstrap();
