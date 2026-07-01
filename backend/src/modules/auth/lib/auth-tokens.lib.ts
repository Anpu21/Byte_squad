import * as crypto from 'crypto';
import { UserRole } from '@common/enums/user-roles.enums';
import { User } from '@users/entities/user.entity';

export const OTP_EXPIRES_IN_MINUTES = 10;

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  branchId: string | null;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    branchId: string | null;
    isFirstLogin: boolean;
    isVerified: boolean;
    language: string;
  };
}

/** Six-digit numeric one-time code. */
export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/** OTP expiry `OTP_EXPIRES_IN_MINUTES` from now. */
export function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);
}

/** Access-token claims for a user. */
export function buildJwtPayload(user: {
  id: string;
  email: string;
  role: UserRole;
  branchId: string | null;
}): JwtPayload {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
  };
}

/** Shape the public auth result (tokens + safe user projection). */
export function buildAuthResult(
  accessToken: string,
  refreshToken: string,
  user: User,
): AuthResult {
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      branchId: user.branchId,
      isFirstLogin: user.isFirstLogin,
      isVerified: user.isVerified,
      language: user.language,
    },
  };
}
