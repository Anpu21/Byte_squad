import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
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
import randomPasswordGenerator from '@/common/utils/random-password-generator';

const AVATAR_CLOUDINARY_FOLDER = 'ledgerpro/avatars';

export interface Actor {
  id: string;
  role: UserRole;
  branchId: string;
}

const ASSIGNABLE_ROLES: UserRole[] = [
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
  ) {}

  async create(createUserDto: CreateUserDto, actor: Actor): Promise<User> {
    this.assertCanCreate(actor, createUserDto);

    const existingUser = await this.users.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const tempPassword = randomPasswordGenerator();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const expiresInHours = this.configService.get<number>(
      'TEMP_PASSWORD_EXPIRES_HOURS',
      24,
    );
    const otpExpiresAt = new Date();
    otpExpiresAt.setHours(otpExpiresAt.getHours() + expiresInHours);

    const savedUser = await this.users.createAndSave({
      ...createUserDto,
      passwordHash,
      isFirstLogin: true,
      isVerified: false,
      otpExpiresAt,
    });
    this.logger.log(
      `User created: ${savedUser.email} (role: ${savedUser.role})`,
    );

    this.emailService
      .sendWelcomeEmail(
        savedUser.email,
        savedUser.firstName,
        tempPassword,
        expiresInHours,
      )
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Failed to send welcome email to ${savedUser.email}: ${message}`,
        );
      });

    return this.stripPassword(savedUser);
  }

  async findAll(actor: Actor): Promise<User[]> {
    const users = await this.users.findAllScoped(
      actor.role === UserRole.ADMIN ? null : actor.branchId,
    );
    return users.map((user) => this.stripPassword(user));
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

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actor: Actor,
  ): Promise<User | null> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    this.assertCanManage(actor, user);

    if (updateUserDto.role !== undefined) {
      this.assertRoleAssignable(actor, updateUserDto.role);
    }
    if (
      updateUserDto.branchId !== undefined &&
      actor.role !== UserRole.ADMIN &&
      updateUserDto.branchId !== actor.branchId
    ) {
      throw new ForbiddenException(
        'You cannot move users to a different branch',
      );
    }

    await this.users.update(id, updateUserDto);
    return this.findById(id);
  }

  async remove(id: string, actor: Actor): Promise<void> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    this.assertCanManage(actor, user);
    await this.users.delete(id);
  }

  /**
   * Internal: hard-delete a user row without RBAC checks. Used by AuthService
   * to roll back a half-created customer signup when the OTP email fails.
   * Do not expose via HTTP.
   */
  async removeByIdInternal(id: string): Promise<void> {
    await this.users.delete(id);
  }

  async resendCredentials(id: string, actor: Actor): Promise<void> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    this.assertCanManage(actor, user);

    const tempPassword = randomPasswordGenerator();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const expiresInHours = this.configService.get<number>(
      'TEMP_PASSWORD_EXPIRES_HOURS',
      24,
    );
    const otpExpiresAt = new Date();
    otpExpiresAt.setHours(otpExpiresAt.getHours() + expiresInHours);

    await this.users.update(id, {
      passwordHash,
      isFirstLogin: true,
      isVerified: false,
      otpExpiresAt,
    });

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      tempPassword,
      expiresInHours,
    );

    this.logger.log(`Credentials resent for user: ${user.email}`);
  }

  private assertCanCreate(actor: Actor, dto: CreateUserDto): void {
    this.assertRoleAssignable(actor, dto.role);
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not allowed to create users');
    }
  }

  private assertCanManage(actor: Actor, target: User): void {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not allowed to manage users');
    }
    if (target.id === actor.id) {
      throw new ForbiddenException(
        'You cannot manage your own account through this endpoint',
      );
    }
  }

  private assertRoleAssignable(actor: Actor, role: UserRole): void {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not allowed to create users');
    }
    if (!ASSIGNABLE_ROLES.includes(role)) {
      throw new ForbiddenException(
        'Admins can only create admin, manager, or cashier accounts',
      );
    }
  }

  private stripPassword(user: User): User {
    const result = { ...user };
    delete (result as Partial<User>).passwordHash;
    return result;
  }
}
