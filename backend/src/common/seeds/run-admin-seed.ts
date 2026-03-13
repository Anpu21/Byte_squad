/**
 * Standalone script to seed the default admin account.
 * Usage: npm run seed:admin
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module.js';
import { AdminSeedService } from '@common/seeds/admin-seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(AdminSeedService);
  await seeder.seed();
  await app.close();
  process.exit(0);
}

void bootstrap();
