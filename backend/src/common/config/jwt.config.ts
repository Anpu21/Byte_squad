import { ConfigService } from '@nestjs/config';

export interface JwtConfig {
    secret: string;
    expiresIn: number;
}

export const getJwtConfig = (configService: ConfigService): JwtConfig => ({
    secret: configService.get<string>('JWT_SECRET', 'ledgerpro-dev-secret-change-me'),
    expiresIn: configService.get<number>('JWT_EXPIRES_IN', 86400),
});
