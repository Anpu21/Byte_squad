import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '@users/users.service';
import { LoginDto } from '@auth/dto/login.dto';
import { ChangePasswordDto } from '@auth/dto/change-password.dto';
import { UserRole } from '@common/enums/user-roles.enums';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  branchId: string;
}

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    branchId: string;
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
  ) {}

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

      // Check if temp password has expired (only for first-login users)
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
