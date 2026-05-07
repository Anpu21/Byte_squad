import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Customer } from '@/modules/customers/entities/customer.entity';
import { CustomersService } from '@/modules/customers/customers.service';
import { CustomerAuthController } from '@/modules/customers/customer-auth.controller';
import { CustomersController } from '@/modules/customers/customers.controller';
import { CustomerJwtStrategy } from '@/modules/customers/strategies/customer-jwt.strategy';
import { CustomerJwtAuthGuard } from '@/modules/customers/guards/customer-jwt-auth.guard';
import { OptionalCustomerJwtAuthGuard } from '@/modules/customers/guards/optional-customer-jwt-auth.guard';
import { EmailModule } from '@/modules/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'ledgerpro-dev-secret-change-me',
        ),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
    EmailModule,
  ],
  controllers: [CustomerAuthController, CustomersController],
  providers: [
    CustomersService,
    CustomerJwtStrategy,
    CustomerJwtAuthGuard,
    OptionalCustomerJwtAuthGuard,
  ],
  exports: [
    CustomersService,
    CustomerJwtAuthGuard,
    OptionalCustomerJwtAuthGuard,
    TypeOrmModule,
  ],
})
export class CustomersModule {}
