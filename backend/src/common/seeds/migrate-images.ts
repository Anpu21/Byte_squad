/**
 * One-shot data migration: lift base64 images out of the database into
 * Cloudinary and replace the column with the secure URL.
 *
 * Migrates:
 *   - users.avatar_url where it starts with `data:image/...`
 *   - products.image_url where it starts with `data:image/...`
 *
 * Idempotent: rows whose URL is already non-base64 are skipped.
 *
 * Requires the CLOUDINARY_* env vars to be set; aborts otherwise.
 *
 * Usage: npm run migrate:images
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '@/app.module.js';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import { User } from '@users/entities/user.entity';
import { Product } from '@products/entities/product.entity';

interface MultiSubResult {
  buffer: Buffer;
  mimetype: string;
}

function parseDataUrl(url: string): MultiSubResult | null {
  const match = url.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimetype: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function asMulterFile(
  parsed: MultiSubResult,
  filename: string,
): Express.Multer.File {
  return {
    fieldname: 'image',
    originalname: filename,
    encoding: '7bit',
    mimetype: parsed.mimetype,
    buffer: parsed.buffer,
    size: parsed.buffer.length,
    destination: '',
    filename,
    path: '',
    stream: undefined as never,
  };
}

async function bootstrap() {
  const logger = new Logger('migrate-images');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const cloudinary = app.get(CloudinaryService);
    if (!cloudinary.isEnabled()) {
      logger.error(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your env, then re-run.',
      );
      process.exitCode = 1;
      return;
    }

    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(User);
    const productRepo = dataSource.getRepository(Product);

    // ── Avatars ──
    const users = await userRepo
      .createQueryBuilder('u')
      .where(`u.avatar_url LIKE 'data:image/%'`)
      .getMany();
    logger.log(`Found ${users.length} user avatar(s) to migrate`);
    let avatarsMigrated = 0;
    for (const user of users) {
      const parsed = user.avatarUrl ? parseDataUrl(user.avatarUrl) : null;
      if (!parsed) {
        logger.log(`  → skip user ${user.email} (could not parse data URL)`);
        continue;
      }
      try {
        const synthFile = asMulterFile(parsed, `avatar-${user.id}`);
        const { url } = await cloudinary.uploadImage(synthFile, {
          folder: 'ledgerpro/avatars',
          publicId: user.id,
        });
        await userRepo.update(user.id, { avatarUrl: url });
        avatarsMigrated += 1;
        logger.log(`  ✓ migrated avatar for ${user.email}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`  ✗ failed avatar for ${user.email}: ${message}`);
      }
    }
    logger.log(`Avatars migrated: ${avatarsMigrated}/${users.length}`);

    // ── Product images ──
    const products = await productRepo
      .createQueryBuilder('p')
      .where(`p.image_url LIKE 'data:image/%'`)
      .getMany();
    logger.log(`Found ${products.length} product image(s) to migrate`);
    let productsMigrated = 0;
    for (const product of products) {
      const parsed = product.imageUrl ? parseDataUrl(product.imageUrl) : null;
      if (!parsed) {
        logger.log(`  → skip ${product.name} (could not parse data URL)`);
        continue;
      }
      try {
        const synthFile = asMulterFile(parsed, `product-${product.id}`);
        const { url } = await cloudinary.uploadImage(synthFile, {
          folder: 'ledgerpro/products',
          publicId: product.id,
        });
        await productRepo.update(product.id, { imageUrl: url });
        productsMigrated += 1;
        logger.log(`  ✓ migrated ${product.name}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`  ✗ failed ${product.name}: ${message}`);
      }
    }
    logger.log(`Products migrated: ${productsMigrated}/${products.length}`);

    logger.log('Migration complete.');
  } finally {
    await app.close();
  }
}

void bootstrap();
