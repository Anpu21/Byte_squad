import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Customer } from '@/modules/customers/entities/customer.entity';
import { CustomerSignupDto } from '@/modules/customers/dto/customer-signup.dto';
import { CustomerLoginDto } from '@/modules/customers/dto/customer-login.dto';
import { CustomerVerifyOtpDto } from '@/modules/customers/dto/customer-verify-otp.dto';
import { CustomerResendOtpDto } from '@/modules/customers/dto/customer-resend-otp.dto';
import { EmailService } from '@/modules/email/email.service';

const OTP_EXPIRES_IN_MINUTES = 10;

export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isVerified: boolean;
  createdAt: Date;
}

export interface CustomerAuthResult {
  accessToken: string;
  customer: CustomerProfile;
}

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async signup(dto: CustomerSignupDto): Promise<{ customerId: string }> {
    const existing = await this.customerRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(
      Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000,
    );

    const customer = this.customerRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      otpCode,
      otpExpiresAt,
      isVerified: false,
    });

    const saved = await this.customerRepo.save(customer);
    this.logger.log(`Customer signup: ${saved.email}`);

    this.emailService
      .sendCustomerOtpEmail(
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

    return { customerId: saved.id };
  }

  async verifyOtp(dto: CustomerVerifyOtpDto): Promise<{ message: string }> {
    const customer = await this.customerRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!customer) {
      throw new NotFoundException('Account not found');
    }
    if (customer.isVerified) {
      return { message: 'Account already verified' };
    }
    if (!customer.otpCode || !customer.otpExpiresAt) {
      throw new BadRequestException('No verification code pending');
    }
    if (new Date() > customer.otpExpiresAt) {
      throw new BadRequestException('Verification code has expired');
    }
    if (customer.otpCode !== dto.otpCode) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.customerRepo.update(customer.id, {
      isVerified: true,
      otpCode: null,
      otpExpiresAt: null,
    });

    return { message: 'Email verified' };
  }

  async resendOtp(dto: CustomerResendOtpDto): Promise<{ message: string }> {
    const customer = await this.customerRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!customer) {
      throw new NotFoundException('Account not found');
    }
    if (customer.isVerified) {
      throw new BadRequestException('Account already verified');
    }

    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(
      Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000,
    );
    await this.customerRepo.update(customer.id, { otpCode, otpExpiresAt });

    await this.emailService.sendCustomerOtpEmail(
      customer.email,
      customer.firstName,
      otpCode,
      OTP_EXPIRES_IN_MINUTES,
    );

    return { message: 'Verification code sent' };
  }

  async login(dto: CustomerLoginDto): Promise<CustomerAuthResult> {
    const customer = await this.customerRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, customer.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!customer.isVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in',
      );
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: customer.id, email: customer.email },
      { audience: 'customer' },
    );

    await this.customerRepo.update(customer.id, { lastLoginAt: new Date() });

    return {
      accessToken,
      customer: this.toProfile(customer),
    };
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customerRepo.findOne({ where: { id } });
  }

  toProfile(customer: Customer): CustomerProfile {
    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      isVerified: customer.isVerified,
      createdAt: customer.createdAt,
    };
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }
}
