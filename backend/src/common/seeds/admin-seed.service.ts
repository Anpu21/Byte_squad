import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@users/entities/user.entity';
import { Branch } from '@branches/entities/branch.entity';
import { UserRole } from '@common/enums/user-roles.enums';

interface SeedDefaults {
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
}

/**
 * Seeds a default admin account and branch on application startup.
 * Idempotent — will not create duplicates if the records already exist.
 */
@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly configService: ConfigService,
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
    const defaults = this.getSeedDefaults();

    // 1. Ensure a default branch exists
    const branch = await this.ensureDefaultBranch(defaults);

    // 2. Ensure a default admin user exists
    await this.ensureAdminUser(branch.id, defaults);

    this.logger.log('Admin seed completed.');
  }

  // ── Private Helpers ────────────────────────────────────

  private async ensureDefaultBranch(defaults: SeedDefaults): Promise<Branch> {
    let branch = await this.branchRepository.findOne({
      where: { name: defaults.branchName },
    });

    if (!branch) {
      branch = this.branchRepository.create({
        name: defaults.branchName,
        address: defaults.branchAddress,
        phone: defaults.branchPhone,
        isActive: true,
      });
      branch = await this.branchRepository.save(branch);
      this.logger.log(`Default branch "${defaults.branchName}" created.`);
    } else {
      this.logger.log(
        ` Default branch "${defaults.branchName}" already exists — skipped.`,
      );
    }

    return branch;
  }

  private async ensureAdminUser(
    branchId: string,
    defaults: SeedDefaults,
  ): Promise<void> {
    const existing = await this.userRepository.findOne({
      where: { email: defaults.adminEmail },
    });

    if (existing) {
      // Fix: ensure seeded admin is never stuck in first-login state
      if (existing.isFirstLogin) {
        await this.userRepository.update(existing.id, { isFirstLogin: false });
        this.logger.log(
          `Admin user "${defaults.adminEmail}" — fixed isFirstLogin flag.`,
        );
      }
      this.logger.log(
        `Admin user "${defaults.adminEmail}" already exists — skipped.`,
      );
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaults.adminPassword, salt);

    const admin = this.userRepository.create({
      email: defaults.adminEmail,
      passwordHash,
      firstName: defaults.adminFirstName,
      lastName: defaults.adminLastName,
      role: UserRole.ADMIN,
      branchId,
      isFirstLogin: false,
      isVerified: true,
    });

    await this.userRepository.save(admin);
    this.logger.log(` Default admin user created: ${defaults.adminEmail}`);
  }

  private getSeedDefaults(): SeedDefaults {
    return {
      adminEmail: this.getConfigValue(
        'SEED_ADMIN_EMAIL',
        'admin@ledgerpro.com',
      ),
      adminPassword: this.getConfigValue('SEED_ADMIN_PASSWORD', 'Admin@123'),
      adminFirstName: this.getConfigValue('SEED_ADMIN_FIRST_NAME', 'System'),
      adminLastName: this.getConfigValue('SEED_ADMIN_LAST_NAME', 'Admin'),
      branchName: this.getConfigValue('SEED_ADMIN_BRANCH_NAME', 'Main Branch'),
      branchAddress: this.getConfigValue(
        'SEED_ADMIN_BRANCH_ADDRESS',
        'Head Office',
      ),
      branchPhone: this.getConfigValue(
        'SEED_ADMIN_BRANCH_PHONE',
        '+94000000000',
      ),
    };
  }

  private getConfigValue(key: string, fallback: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      return fallback;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : fallback;
  }
}
