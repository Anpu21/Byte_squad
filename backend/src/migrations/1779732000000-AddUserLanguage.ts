import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Persist the user's preferred UI language (en/ta) so the choice made in
 * profile settings follows them across devices. Additive + reversible; the
 * `NOT NULL DEFAULT 'en'` keeps every existing row valid.
 */
export class AddUserLanguage1779732000000 implements MigrationInterface {
  name = 'AddUserLanguage1779732000000';
  private readonly logger = new Logger(AddUserLanguage1779732000000.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "language" varchar(8) NOT NULL DEFAULT 'en'
    `);
    this.logger.log('Added users.language');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "language"
    `);
  }
}
