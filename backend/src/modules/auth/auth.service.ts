import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '@users/users.service';
import { LoginDto } from '@auth/dto/login.dto';
import { SignupDto } from '@auth/dto/signup.dto';
import { VerifyOtpDto } from '@auth/dto/verify-otp.dto';
import { ResendOtpDto } from '@auth/dto/resend-otp.dto';
import { ChangePasswordDto } from '@auth/dto/change-password.dto';
import { UserRole } from '@common/enums/user-roles.enums';
import { EmailService } from '@/modules/email/email.service';

const OTP_EXPIRES_IN_MINUTES = 10;

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  branchId: string | null;
}

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    branchId: string | null;
    isFirstLogin: boolean;
    isVerified: boolean;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async signup(dto: SignupDto): Promise<{ userId: string }> {
    const existing = await this.usersService.findByEmail(
      dto.email.toLowerCase(),
    );
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.hashPassword(dto.password);
    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(
      Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000,
    );

    const saved = await this.usersService.createCustomerAccount({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      otpCode,
      otpExpiresAt,
    });
    this.logger.log(`Customer signup: ${saved.email}`);

    this.emailService
      .sendOtpEmail(
        saved.email,
        saved.firstName,
        otpCode,
        OTP_EXPIRES_IN_MINUTES,
      )
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Failed to send OTP email to ${saved.email}: ${message}`,
        );
      });

    return { userId: saved.id };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase());
    if (!user) {
      throw new NotFoundException('Account not found');
    }
    if (user.isVerified) {
      return { message: 'Account already verified' };
    }
    if (!user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestException('No verification code pending');
    }
    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('Verification code has expired');
    }
    if (user.otpCode !== dto.otpCode) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.usersService.markVerified(user.id);
    return { message: 'Email verified' };
  }

  async resendOtp(dto: ResendOtpDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase());
    if (!user) {
      throw new NotFoundException('Account not found');
    }
    if (user.isVerified) {
      throw new BadRequestException('Account already verified');
    }

    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(
      Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000,
    );
    await this.usersService.setOtp(user.id, otpCode, otpExpiresAt);

    await this.emailService.sendOtpEmail(
      user.email,
      user.firstName,
      otpCode,
      OTP_EXPIRES_IN_MINUTES,
    );

    return { message: 'Verification code sent' };
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    try {
      this.logger.debug(`Attempting login for email: ${loginDto.email}`);
      const user = await this.usersService.findByEmail(loginDto.email);

      if (!user) {
        this.logger.warn(
          `Login failed: User not found for email ${loginDto.email}`,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.debug(
        `User found: ${user.id}, role: ${user.role}, branchId: ${user.branchId}`,
      );

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.passwordHash,
      );

      if (!isPasswordValid) {
        this.logger.warn(
          `Login failed: Invalid password for email ${loginDto.email}`,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      // Customers must verify their email before logging in
      if (user.role === UserRole.CUSTOMER && !user.isVerified) {
        throw new ForbiddenException(
          'Please verify your email before logging in',
        );
      }

      // Check if temp password has expired (only for staff first-login users)
      if (user.isFirstLogin && user.otpExpiresAt) {
        if (new Date() > user.otpExpiresAt) {
          this.logger.warn(
            `Login failed: Temporary password expired for ${loginDto.email}`,
          );
          throw new ForbiddenException(
            'Temporary password has expired. Please contact your administrator to resend credentials.',
          );
        }
      }

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      };

      this.logger.debug(`Signing JWT with payload: ${JSON.stringify(payload)}`);
      const accessToken = await this.jwtService.signAsync(payload);
      this.logger.debug(`JWT generated successfully`);

      await this.usersService.touchLastLogin(user.id);

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          branchId: user.branchId,
          isFirstLogin: user.isFirstLogin,
          isVerified: user.isVerified,
        },
      };
    } catch (error: unknown) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Login error for ${loginDto.email}: ${message}`, stack);
      throw error;
    }
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const userWithPassword =
      await this.usersService.findByIdWithPassword(userId);

    if (!userWithPassword) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      userWithPassword.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(
      changePasswordDto.newPassword,
      salt,
    );

    await this.usersService.updatePassword(userId, newPasswordHash);

    this.logger.log(`Password changed for user: ${userId}`);

    return { message: 'Password changed successfully' };
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
}
