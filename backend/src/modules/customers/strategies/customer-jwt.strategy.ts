import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface CustomerJwtPayload {
  sub: string;
  email: string;
  aud: 'customer';
}

export interface ValidatedCustomer {
  id: string;
  email: string;
}

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(
  Strategy,
  'customer-jwt',
) {
  constructor(configService: ConfigService) {
    const secretOrKey = configService.get<string>(
      'JWT_SECRET',
      'ledgerpro-dev-secret-change-me',
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
      audience: 'customer',
    });
  }

  validate(payload: CustomerJwtPayload): ValidatedCustomer {
    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}
