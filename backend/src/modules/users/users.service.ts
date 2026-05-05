import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '@users/entities/user.entity';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { UpdateUserDto } from '@users/dto/update-user.dto';
import { UserRole } from '@common/enums/user-roles.enums';
import { EmailService } from '../email/email.service';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto, actor: Actor): Promise<User> {
    this.assertCanCreate(actor, createUserDto);

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Generate secure temp password
    const tempPassword = this.generateTempPassword();

    // Hash the temp password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Calculate temp password expiry
    const expiresInHours = this.configService.get<number>(
      'TEMP_PASSWORD_EXPIRES_HOURS',
      24,
    );
    const otpExpiresAt = new Date();
    otpExpiresAt.setHours(otpExpiresAt.getHours() + expiresInHours);

    // Create user with hashed temp password
    const user = this.userRepository.create({
      ...createUserDto,
      passwordHash,
      isFirstLogin: true,
      isVerified: false,
      otpExpiresAt,
    });

    const savedUser = await this.userRepository.save(user);
    this.logger.log(
      `User created: ${savedUser.email} (role: ${savedUser.role})`,
    );

    // Send welcome email with temp password (non-blocking)
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

    // Return user without passwordHash
    return this.stripPassword(savedUser);
  }

  async findAll(actor: Actor): Promise<User[]> {
    const where =
      actor.role === UserRole.ADMIN ? {} : { branchId: actor.branchId };
    const users = await this.userRepository.find({
      where,
      relations: ['branch'],
    });
    return users.map((user) => this.stripPassword(user));
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['branch'],
    });
    if (!user) return null;
    return this.stripPassword(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.userRepository.update(id, {
      passwordHash,
      isFirstLogin: false,
      isVerified: true,
      otpExpiresAt: null,
    });
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  async updateProfile(
    id: string,
    data: { firstName?: string; lastName?: string },
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updateData: Partial<User> = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (Object.keys(updateData).length > 0) {
      await this.userRepository.update(id, updateData);
    }
    return this.findById(id);
  }

  async updateAvatar(
    id: string,
    file: Express.Multer.File,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Store as base64 data URL for dev; in production, upload to cloud storage
    const base64 = file.buffer.toString('base64');
    const avatarUrl = `data:${file.mimetype};base64,${base64}`;
    await this.userRepository.update(id, { avatarUrl });
    return this.findById(id);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actor: Actor,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });
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

    await this.userRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  async remove(id: string, actor: Actor): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    this.assertCanManage(actor, user);
    await this.userRepository.delete(id);
  }

  async resendCredentials(id: string, actor: Actor): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    this.assertCanManage(actor, user);

    // Generate new temp password
    const tempPassword = this.generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Reset expiry
    const expiresInHours = this.configService.get<number>(
      'TEMP_PASSWORD_EXPIRES_HOURS',
      24,
    );
    const otpExpiresAt = new Date();
    otpExpiresAt.setHours(otpExpiresAt.getHours() + expiresInHours);

    await this.userRepository.update(id, {
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
    // Admin is cross-branch — no branch check.
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

  private generateTempPassword(): string {
    const length = 12;
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const symbols = '@#$%&*!';

    // Ensure at least one of each type
    let password = '';
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += digits[crypto.randomInt(digits.length)];
    password += symbols[crypto.randomInt(symbols.length)];

    // Fill remaining with random mix
    const allChars = uppercase + lowercase + digits + symbols;
    for (let i = password.length; i < length; i++) {
      password += allChars[crypto.randomInt(allChars.length)];
    }

    // Shuffle the password
    const arr = password.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }
}
