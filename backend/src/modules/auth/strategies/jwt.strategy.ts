import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@/common/enums/user-roles.enums';
import { getJwtKeyConfig } from '@common/config/jwt.config';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  branchId: string | null;
}

interface ValidatedUser {
  id: string;
  email: string;
  role: UserRole;
  branchId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const keys = getJwtKeyConfig(configService);
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: keys.publicKey,
      algorithms: [keys.algorithm],
      issuer: keys.issuer,
      audience: keys.audience,
    };
    super(options);
  }

  validate(payload: JwtPayload): ValidatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      branchId: payload.branchId ?? null,
    };
  }
}
