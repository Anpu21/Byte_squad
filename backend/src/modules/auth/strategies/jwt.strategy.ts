import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@/common/enums/user-roles.enums';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  branchId: string;
  aud?: string;
}

interface ValidatedUser {
  id: string;
  email: string;
  role: UserRole;
  branchId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secretOrKey = configService.get<string>(
      'JWT_SECRET',
      'ledgerpro-dev-secret-change-me',
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
    });
  }

  validate(payload: JwtPayload): ValidatedUser {
    if (payload.aud === 'customer') {
      throw new UnauthorizedException();
    }
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      branchId: payload.branchId,
    };
  }
}
