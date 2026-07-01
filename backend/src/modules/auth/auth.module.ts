import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from '@auth/auth.service';
import { AuthController } from '@auth/auth.controller';
import { JwksController } from '@auth/jwks.controller';
import { JwksService } from '@auth/jwks.service';
import { JwtStrategy } from '@auth/strategies/jwt.strategy';
import { RefreshToken } from '@auth/entities/refresh-token.entity';
import { RefreshTokenRepository } from '@auth/refresh-token.repository';
import { RefreshTokenService } from '@auth/refresh-token.service';
import { UsersModule } from '@users/users.module';
import { EmailModule } from '@/modules/email/email.module';
import { getJwtKeyConfig } from '@common/config/jwt.config';

@Module({
  imports: [
    UsersModule,
    EmailModule,
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const keys = getJwtKeyConfig(configService);
        return {
          privateKey: keys.privateKey,
          publicKey: keys.publicKey,
          signOptions: {
            algorithm: keys.algorithm,
            keyid: keys.kid,
            issuer: keys.issuer,
            audience: keys.audience,
            expiresIn: keys.accessExpiresIn as JwtSignOptions['expiresIn'],
          },
          verifyOptions: {
            algorithms: [keys.algorithm],
            issuer: keys.issuer,
            audience: keys.audience,
          },
        };
      },
    }),
  ],
  controllers: [AuthController, JwksController],
  providers: [
    AuthService,
    JwtStrategy,
    JwksService,
    RefreshTokenRepository,
    RefreshTokenService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
