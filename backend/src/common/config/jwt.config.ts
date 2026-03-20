import { ConfigService } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export const getJwtConfig = (configService: ConfigService): JwtConfig => ({
  secret: configService.get<string>(
    'JWT_SECRET',
    'ledgerpro-dev-secret-change-me',
  ),
  expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d'),
});
