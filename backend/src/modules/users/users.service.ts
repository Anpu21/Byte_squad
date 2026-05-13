import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '@users/entities/user.entity';
import { UsersRepository } from '@users/users.repository';
import { PendingUserActionsRepository } from '@users/pending-user-actions.repository';
import {
  PendingUserAction,
  PendingUserActionType,
} from '@users/entities/pending-user-action.entity';
import { BranchesRepository } from '@branches/branches.repository';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { UpdateUserDto } from '@users/dto/update-user.dto';
import {
  parseCreateUserPayload,
  parseUpdateUserPayload,
} from '@users/user-payload.parser';
import { UserRole } from '@common/enums/user-roles.enums';
import { EmailService } from '../email/email.service';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import randomPasswordGenerator from '@/common/utils/random-password-generator';

const AVATAR_CLOUDINARY_FOLDER = 'ledgerpro/avatars';
const OTP_EXPIRES_IN_MINUTES = 10;

export interface Actor {
  id: string;
  role: UserRole;
  branchId: string;
}

export interface UserActionRequestResult {
  actionId: string;
  expiresAt: Date;
  action: PendingUserActionType;
}

export interface UserActionConfirmResult {
  action: PendingUserActionType;
  user: User | null;
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
    private readonly pendingActions: PendingUserActionsRepository,
    private readonly branches: BranchesRepository,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly cloudinary: CloudinaryService,
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
      phone: data.phone,
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
      const trimmed = data.phone?.trim();
      updateData.phone = trimmed && trimmed.length > 0 ? trimmed : null;
    }
    if (Object.keys(updateData).length > 0) {
      await this.users.update(id, updateData);
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

  // ── Two-step admin mutations: request* stages the action and emails OTP ─

  async requestCreate(
    adminUserId: string,
    dto: CreateUserDto,
  ): Promise<UserActionRequestResult> {
    if (!ASSIGNABLE_ROLES_ON_CREATE.includes(dto.role)) {
      throw new ForbiddenException(
        'Admins can only create admin, manager, or cashier accounts',
      );
    }
    await this.assertEmailAvailable(dto.email, null);
    return this.stageAction(adminUserId, {
      actionType: 'create',
      targetUserId: null,
      payload: { ...dto },
      targetLabel: dto.email,
    });
  }

  async requestUpdate(
    adminUserId: string,
    targetUserId: string,
    dto: UpdateUserDto,
  ): Promise<UserActionRequestResult> {
    const target = await this.users.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('User not found');
    }
    this.assertNotSelf(adminUserId, target.id);
    if (dto.email !== undefined) {
      await this.assertEmailAvailable(dto.email, targetUserId);
    }
    return this.stageAction(adminUserId, {
      actionType: 'update',
      targetUserId,
      payload: { ...dto },
      targetLabel: target.email,
    });
  }

  async requestDelete(
    adminUserId: string,
    targetUserId: string,
  ): Promise<UserActionRequestResult> {
    const target = await this.users.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('User not found');
    }
    this.assertNotSelf(adminUserId, target.id);
    return this.stageAction(adminUserId, {
      actionType: 'delete',
      targetUserId,
      payload: null,
      targetLabel: target.email,
    });
  }

  async requestResetPassword(
    adminUserId: string,
    targetUserId: string,
  ): Promise<UserActionRequestResult> {
    const target = await this.users.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('User not found');
    }
    this.assertNotSelf(adminUserId, target.id);
    return this.stageAction(adminUserId, {
      actionType: 'reset-password',
      targetUserId,
      payload: null,
      targetLabel: target.email,
    });
  }

  async confirmAction(
    adminUserId: string,
    actionId: string,
    otpCode: string,
  ): Promise<UserActionConfirmResult> {
    const pending = await this.loadOwnedPendingAction(adminUserId, actionId);

    if (pending.consumedAt) {
      throw new BadRequestException('This confirmation has already been used');
    }
    if (new Date() > pending.expiresAt) {
      throw new BadRequestException('Confirmation code has expired');
    }
    if (pending.otpCode !== otpCode) {
      throw new BadRequestException('Invalid confirmation code');
    }

    let result: User | null = null;
    switch (pending.actionType) {
      case 'create': {
        const payload = parseCreateUserPayload(pending.payload);
        await this.assertEmailAvailable(payload.email, null);
        result = await this.executeCreate(payload);
        break;
      }
      case 'update': {
        if (!pending.targetUserId) {
          throw new ConflictException(
            'Pending update is missing its target user reference',
          );
        }
        const existing = await this.users.findById(pending.targetUserId);
        if (!existing) {
          throw new NotFoundException('User no longer exists');
        }
        const payload = parseUpdateUserPayload(pending.payload);
        if (payload.email !== undefined && payload.email !== existing.email) {
          await this.assertEmailAvailable(payload.email, existing.id);
        }
        await this.users.update(existing.id, payload);
        result = await this.findById(existing.id);
        break;
      }
      case 'delete': {
        if (!pending.targetUserId) {
          throw new ConflictException(
            'Pending delete is missing its target user reference',
          );
        }
        const existing = await this.users.findById(pending.targetUserId);
        if (!existing) {
          throw new NotFoundException('User no longer exists');
        }
        await this.users.delete(existing.id);
        result = null;
        break;
      }
      case 'reset-password': {
        if (!pending.targetUserId) {
          throw new ConflictException(
            'Pending reset is missing its target user reference',
          );
        }
        const existing = await this.users.findById(pending.targetUserId);
        if (!existing) {
          throw new NotFoundException('User no longer exists');
        }
        await this.executeResetPassword(existing);
        result = await this.findById(existing.id);
        break;
      }
      default: {
        throw new ConflictException('Unknown pending action');
      }
    }

    await this.pendingActions.markConsumed(pending.id, new Date());
    return { action: pending.actionType, user: result };
  }

  async resendActionOtp(
    adminUserId: string,
    actionId: string,
  ): Promise<{ expiresAt: Date }> {
    const pending = await this.loadOwnedPendingAction(adminUserId, actionId);
    if (pending.consumedAt) {
      throw new BadRequestException('This confirmation has already been used');
    }
    const otpCode = this.generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);
    await this.pendingActions.refreshOtp(pending.id, otpCode, expiresAt);

    const admin = await this.users.findById(adminUserId);
    if (!admin) {
      throw new NotFoundException('Admin account not found');
    }
    await this.sendOtp(
      admin,
      otpCode,
      pending.actionType,
      this.payloadLabel(pending) ?? 'the selected user',
    );
    return { expiresAt };
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private async stageAction(
    adminUserId: string,
    args: {
      actionType: PendingUserActionType;
      targetUserId: string | null;
      payload: Record<string, unknown> | null;
      targetLabel: string;
    },
  ): Promise<UserActionRequestResult> {
    const admin = await this.users.findById(adminUserId);
    if (!admin) {
      throw new NotFoundException('Admin account not found');
    }

    const otpCode = this.generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);

    const pending = await this.pendingActions.create({
      userId: adminUserId,
      actionType: args.actionType,
      targetUserId: args.targetUserId,
      payload: args.payload,
      otpCode,
      expiresAt,
    });

    try {
      await this.sendOtp(admin, otpCode, args.actionType, args.targetLabel);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to send user-action OTP to ${admin.email}: ${message}`,
      );
      throw new ServiceUnavailableException(
        'Email service unavailable. Please try again in a moment.',
      );
    }

    return {
      actionId: pending.id,
      expiresAt,
      action: args.actionType,
    };
  }

  private async sendOtp(
    admin: User,
    otpCode: string,
    action: PendingUserActionType,
    targetLabel: string,
  ): Promise<void> {
    if (this.emailService.isVerified()) {
      await this.emailService.sendUserActionOtpEmail(
        admin.email,
        admin.firstName,
        otpCode,
        action,
        targetLabel,
        OTP_EXPIRES_IN_MINUTES,
      );
      return;
    }
    if (this.isProduction()) {
      throw new ServiceUnavailableException(
        'Email service unavailable. Please try again in a moment.',
      );
    }
    // Dev fallback — log so the developer can copy the code from container logs.
    this.logger.warn(
      `✨ DEV user-action OTP for ${admin.email} (${action} ${targetLabel}): ${otpCode} (expires in ${OTP_EXPIRES_IN_MINUTES}m).`,
    );
  }

  private async loadOwnedPendingAction(
    adminUserId: string,
    actionId: string,
  ): Promise<PendingUserAction> {
    const pending = await this.pendingActions.findById(actionId);
    if (!pending) {
      throw new NotFoundException('Pending action not found');
    }
    if (pending.userId !== adminUserId) {
      throw new ForbiddenException(
        'You can only confirm your own user actions',
      );
    }
    return pending;
  }

  private async executeCreate(dto: CreateUserDto): Promise<User> {
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
      phone: dto.phone ?? null,
      address: dto.address ?? null,
      passwordHash,
      isFirstLogin: true,
      isVerified: false,
      otpExpiresAt,
    });
    this.logger.log(`User created: ${saved.email} (role: ${saved.role})`);

    // Fire welcome email best-effort — OTP already verified the admin.
    this.emailService
      .sendWelcomeEmail(saved.email, saved.firstName, tempPassword, expiresInHours)
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Failed to send welcome email to ${saved.email}: ${message}`,
        );
      });

    return this.stripPassword(saved);
  }

  private async executeResetPassword(target: User): Promise<void> {
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

    this.logger.log(`Credentials reset for user: ${target.email}`);
  }

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

  private payloadLabel(action: PendingUserAction): string | null {
    if (action.payload && typeof action.payload === 'object') {
      const email = (action.payload as Record<string, unknown>).email;
      if (typeof email === 'string') return email;
    }
    return null;
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  private isProduction(): boolean {
    return (
      (this.configService.get<string>('NODE_ENV') ?? 'development') ===
      'production'
    );
  }

  private stripPassword(user: User): User {
    const result = { ...user };
    delete (result as Partial<User>).passwordHash;
    return result;
  }
}
