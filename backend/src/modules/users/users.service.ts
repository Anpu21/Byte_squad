import {
  BadRequestException,
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '@users/entities/user.entity';
import { UsersRepository } from '@users/users.repository';
import { BranchesRepository } from '@branches/branches.repository';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { UpdateUserDto } from '@users/dto/update-user.dto';
import { UserRole } from '@common/enums/user-roles.enums';
import { EmailService } from '../email/email.service';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import { LoyaltyService } from '@/modules/loyalty/loyalty.service';
import { normalizeSriLankaPhone } from '@common/utils/phone.util';
import randomPasswordGenerator from '@/common/utils/random-password-generator';

const AVATAR_CLOUDINARY_FOLDER = 'ledgerpro/avatars';

export interface Actor {
  id: string;
  role: UserRole;
  branchId: string;
}

const ASSIGNABLE_ROLES_ON_CREATE: UserRole[] = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.CASHIER,
];

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly users: UsersRepository,
    private readonly branches: BranchesRepository,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly cloudinary: CloudinaryService,
    @Inject(forwardRef(() => LoyaltyService))
    private readonly loyalty: LoyaltyService,
  ) {}

  // ── Read paths ─────────────────────────────────────────────────────────

  async findAll(actor: Actor): Promise<User[]> {
    const list = await this.users.findAllScoped(
      actor.role === UserRole.ADMIN ? null : actor.branchId,
    );
    return list.map((user) => this.stripPassword(user));
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.users.findByIdWithBranch(id);
    if (!user) return null;
    return this.stripPassword(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.findByEmail(email);
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.users.findById(id);
  }

  // ── Helpers reused by AuthService / customer signup ────────────────────

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.users.update(id, {
      passwordHash,
      isFirstLogin: false,
      isVerified: true,
      otpCode: null,
      otpExpiresAt: null,
    });
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.users.update(id, { lastLoginAt: new Date() });
  }

  async createCustomerAccount(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    otpCode: string;
    otpExpiresAt: Date;
  }): Promise<User> {
    return this.users.createAndSave({
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: this.normalizeOptionalPhone(data.phone),
      role: UserRole.CUSTOMER,
      branchId: null,
      isFirstLogin: false,
      isVerified: false,
      otpCode: data.otpCode,
      otpExpiresAt: data.otpExpiresAt,
    });
  }

  async setOtp(id: string, otpCode: string, otpExpiresAt: Date): Promise<void> {
    await this.users.update(id, { otpCode, otpExpiresAt });
  }

  async markVerified(id: string): Promise<void> {
    await this.users.update(id, {
      isVerified: true,
      otpCode: null,
      otpExpiresAt: null,
    });
    await this.syncLoyaltyIfCustomer(id);
  }

  // Internal: hard-delete a user row without RBAC checks. Used by AuthService
  // to roll back a half-created customer signup when the OTP email fails.
  // Do not expose via HTTP.
  async removeByIdInternal(id: string): Promise<void> {
    await this.users.delete(id);
  }

  // ── Self-service mutations (used by Profile page) ──────────────────────

  async updateProfile(
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string | null },
  ): Promise<User | null> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updateData: Partial<User> = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.phone !== undefined) {
      updateData.phone = this.normalizeOptionalPhone(data.phone);
    }
    if (Object.keys(updateData).length > 0) {
      await this.users.update(id, updateData);
    }
    if (user.role === UserRole.CUSTOMER && updateData.phone) {
      await this.loyalty.syncVerifiedUserByPhone(id);
    }
    return this.findById(id);
  }

  async updateMyBranch(userId: string, branchId: string): Promise<User | null> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException(
        'Only customers can pick their branch through this endpoint',
      );
    }

    const branch = await this.branches.findById(branchId);
    if (!branch || !branch.isActive) {
      throw new NotFoundException('Branch not found or inactive');
    }

    await this.users.update(userId, { branchId });
    this.logger.log(`Customer ${user.email} selected branch ${branch.name}`);
    return this.findById(userId);
  }

  async updateAvatar(
    id: string,
    file: Express.Multer.File,
  ): Promise<User | null> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let avatarUrl: string;
    if (this.cloudinary.isEnabled()) {
      const { url } = await this.cloudinary.uploadImage(file, {
        folder: AVATAR_CLOUDINARY_FOLDER,
        publicId: id,
      });
      avatarUrl = url;
    } else {
      // Fallback for dev environments without Cloudinary credentials.
      const base64 = file.buffer.toString('base64');
      avatarUrl = `data:${file.mimetype};base64,${base64}`;
    }

    await this.users.update(id, { avatarUrl });
    return this.findById(id);
  }

  // ── Admin mutations (direct, no OTP) ───────────────────────────────────

  async create(adminUserId: string, dto: CreateUserDto): Promise<User> {
    if (!ASSIGNABLE_ROLES_ON_CREATE.includes(dto.role)) {
      throw new ForbiddenException(
        'Admins can only create admin, manager, or cashier accounts',
      );
    }
    await this.assertEmailAvailable(dto.email, null);

    const tempPassword = randomPasswordGenerator();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const expiresInHours = this.configService.get<number>(
      'TEMP_PASSWORD_EXPIRES_HOURS',
      24,
    );
    const otpExpiresAt = new Date();
    otpExpiresAt.setHours(otpExpiresAt.getHours() + expiresInHours);

    const saved = await this.users.createAndSave({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      branchId: dto.branchId,
      phone: this.normalizeOptionalPhone(dto.phone ?? null),
      address: dto.address ?? null,
      passwordHash,
      isFirstLogin: true,
      isVerified: false,
      otpExpiresAt,
    });
    this.logger.log(
      `User created by admin ${adminUserId}: ${saved.email} (role: ${saved.role})`,
    );

    // Fire welcome email best-effort.
    this.emailService
      .sendWelcomeEmail(
        saved.email,
        saved.firstName,
        tempPassword,
        expiresInHours,
      )
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Failed to send welcome email to ${saved.email}: ${message}`,
        );
      });

    return this.stripPassword(saved);
  }

  async update(
    adminUserId: string,
    targetUserId: string,
    dto: UpdateUserDto,
  ): Promise<User | null> {
    const target = await this.users.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('User not found');
    }
    this.assertNotSelf(adminUserId, target.id);
    if (dto.email !== undefined && dto.email !== target.email) {
      await this.assertEmailAvailable(dto.email, targetUserId);
    }

    const updateData: Partial<User> = { ...dto };
    if (dto.phone !== undefined) {
      updateData.phone = this.normalizeOptionalPhone(dto.phone);
    }

    await this.users.update(target.id, updateData);
    this.logger.log(`User ${target.email} updated by admin ${adminUserId}`);
    return this.findById(target.id);
  }

  async delete(adminUserId: string, targetUserId: string): Promise<void> {
    const target = await this.users.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('User not found');
    }
    this.assertNotSelf(adminUserId, target.id);

    await this.users.delete(target.id);
    this.logger.log(`User ${target.email} deleted by admin ${adminUserId}`);
  }

  async resetPassword(
    adminUserId: string,
    targetUserId: string,
  ): Promise<User | null> {
    const target = await this.users.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('User not found');
    }
    this.assertNotSelf(adminUserId, target.id);

    const tempPassword = randomPasswordGenerator();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const expiresInHours = this.configService.get<number>(
      'TEMP_PASSWORD_EXPIRES_HOURS',
      24,
    );
    const otpExpiresAt = new Date();
    otpExpiresAt.setHours(otpExpiresAt.getHours() + expiresInHours);

    await this.users.update(target.id, {
      passwordHash,
      isFirstLogin: true,
      isVerified: false,
      otpExpiresAt,
    });

    await this.emailService.sendPasswordResetEmail(
      target.email,
      target.firstName,
      tempPassword,
      expiresInHours,
    );

    this.logger.log(
      `Credentials reset for ${target.email} by admin ${adminUserId}`,
    );
    return this.findById(target.id);
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private async assertEmailAvailable(
    email: string,
    excludeUserId: string | null,
  ): Promise<void> {
    const trimmed = email.trim().toLowerCase();
    if (trimmed.length === 0) {
      throw new ConflictException('Email is required');
    }
    const existing = await this.users.findByEmail(trimmed);
    if (existing && existing.id !== excludeUserId) {
      throw new ConflictException('A user with this email already exists');
    }
  }

  private assertNotSelf(adminUserId: string, targetUserId: string): void {
    if (adminUserId === targetUserId) {
      throw new ForbiddenException(
        'You cannot manage your own account through this endpoint',
      );
    }
  }

  private normalizeOptionalPhone(
    phone: string | null | undefined,
  ): string | null {
    const trimmed = phone?.trim();
    if (!trimmed) return null;
    const normalized = normalizeSriLankaPhone(trimmed);
    if (!normalized) {
      throw new BadRequestException('Invalid phone number');
    }
    return normalized;
  }

  private async syncLoyaltyIfCustomer(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user?.role !== UserRole.CUSTOMER || !user.phone) return;
    await this.loyalty.syncVerifiedUserByPhone(user.id);
  }

  private stripPassword(user: User): User {
    const result = { ...user };
    delete (result as Partial<User>).passwordHash;
    return result;
  }
}
