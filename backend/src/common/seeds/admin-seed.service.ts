import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@users/entities/user.entity';
import { Branch } from '@branches/entities/branch.entity';
import { UserRole } from '@common/enums/user-roles.enums';

/**
 * Seeds the default admin account and a "Main Branch" on application startup.
 * Idempotent — will not create duplicates if the records already exist.
 */
@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  // ── Default Admin Credentials ──────────────────────────
  private readonly ADMIN_EMAIL = 'admin@ledgerpro.com';
  private readonly ADMIN_PASSWORD = 'Admin@123';
  private readonly ADMIN_FIRST_NAME = 'System';
  private readonly ADMIN_LAST_NAME = 'Admin';

  // ── Default Branch ─────────────────────────────────────
  private readonly DEFAULT_BRANCH_NAME = 'Main Branch';
  private readonly DEFAULT_BRANCH_ADDRESS = 'Head Office';
  private readonly DEFAULT_BRANCH_PHONE = '+94000000000';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  /**
   * Called automatically by NestJS after the module is initialised.
   */
  async onModuleInit(): Promise<void> {
    await this.seed();
  }

  /**
   * Main seed method — can also be called manually via the standalone script.
   */
  async seed(): Promise<void> {
    this.logger.log('Seeding default admin account...');

    // 1. Ensure a default branch exists
    const branch = await this.ensureDefaultBranch();

    // 2. Ensure a default admin user exists
    await this.ensureAdminUser(branch.id);

    this.logger.log('Admin seed completed.');
  }

  // ── Private Helpers ────────────────────────────────────

  private async ensureDefaultBranch(): Promise<Branch> {
    let branch = await this.branchRepository.findOne({
      where: { name: this.DEFAULT_BRANCH_NAME },
    });

    if (!branch) {
      branch = this.branchRepository.create({
        name: this.DEFAULT_BRANCH_NAME,
        address: this.DEFAULT_BRANCH_ADDRESS,
        phone: this.DEFAULT_BRANCH_PHONE,
        isActive: true,
      });
      branch = await this.branchRepository.save(branch);
      this.logger.log(`Default branch "${this.DEFAULT_BRANCH_NAME}" created.`);
    } else {
      this.logger.log(
        ` Default branch "${this.DEFAULT_BRANCH_NAME}" already exists — skipped.`,
      );
    }

    return branch;
  }

  private async ensureAdminUser(branchId: string): Promise<void> {
    const existing = await this.userRepository.findOne({
      where: { email: this.ADMIN_EMAIL },
    });

    if (existing) {
      this.logger.log(
        `Admin user "${this.ADMIN_EMAIL}" already exists — skipped.`,
      );
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(this.ADMIN_PASSWORD, salt);

    const admin = this.userRepository.create({
      email: this.ADMIN_EMAIL,
      passwordHash,
      firstName: this.ADMIN_FIRST_NAME,
      lastName: this.ADMIN_LAST_NAME,
      role: UserRole.ADMIN,
      branchId,
      isFirstLogin: true,
      isVerified: true,
    });

    await this.userRepository.save(admin);
    this.logger.log(` Default admin user created: ${this.ADMIN_EMAIL}`);
  }
}
