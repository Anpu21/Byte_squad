/**
 * Standalone script to seed the default admin account.
 * Usage: npm run seed:admin
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module.js';
import {
  AdminSeedService,
  STANDALONE_SEED_ENV,
} from '@common/seeds/admin-seed.service';

async function bootstrap() {
  process.env[STANDALONE_SEED_ENV] = 'true';

  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(AdminSeedService);
  await seeder.seed();
  await app.close();
  process.exit(0);
}

void bootstrap();
