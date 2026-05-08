import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private verified = false;

  constructor(private readonly configService: ConfigService) {
    const portRaw = this.configService.get<string | number>('MAIL_PORT', 587);
    const port =
      typeof portRaw === 'number' ? portRaw : parseInt(String(portRaw), 10);

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port,
      secure: port === 465, // 465 → SSL/TLS, 587 → STARTTLS
      requireTLS: port === 587,
      connectionTimeout: 60_000,
      greetingTimeout: 60_000,
      socketTimeout: 60_000,
      auth: {
        user: this.configService.get<string>('MAIL_USERNAME'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.transporter.verify();
      this.verified = true;
      this.logger.log('Email transporter verified — SMTP reachable');
    } catch (error) {
      this.verified = false;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Email transporter verification failed: ${message}. OTP/welcome emails will fail until this is fixed.`,
      );
    }
  }

  isVerified(): boolean {
    return this.verified;
  }

  async sendWelcomeEmail(
    to: string,
    firstName: string,
    tempPassword: string,
    expiresInHours: number,
  ): Promise<void> {
    const loginUrl = this.configService.get<string>(
      'CORS_ORIGIN',
      'http://localhost:5173',
    );

    const subject = 'Welcome to LedgerPro — Your Account Has Been Created';

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; border: 1px solid #222; border-radius: 12px; overflow: hidden;">
        <div style="background: #111; padding: 32px 32px 24px; border-bottom: 1px solid #222;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 700;">LedgerPro</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 20px;">
            Hi <strong>${firstName}</strong>,
          </p>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            Your account has been created by an administrator. Use the credentials below to log in and set your permanent password.
          </p>

          <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding: 4px 0;">Email</td>
                <td style="color: #fff; font-size: 14px; font-weight: 600; text-align: right; padding: 4px 0;">${to}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding: 4px 0;">Temporary Password</td>
                <td style="color: #fff; font-size: 14px; font-weight: 600; text-align: right; padding: 4px 0; font-family: monospace;">${tempPassword}</td>
              </tr>
            </table>
          </div>

          <a href="${loginUrl}/login" style="display: block; text-align: center; background: #fff; color: #0a0a0a; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 8px; margin: 0 0 24px;">
            Log In to LedgerPro
          </a>

          <div style="background: #1c1007; border: 1px solid #854d0e; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px;">
            <p style="color: #fbbf24; font-size: 13px; margin: 0;">
              ⚠ This temporary password expires in <strong>${expiresInHours} hours</strong>. You must log in and change your password before it expires.
            </p>
          </div>

          <p style="color: #475569; font-size: 12px; margin: 0; line-height: 1.5;">
            If you did not expect this email, please ignore it or contact your administrator.
          </p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'MAIL_FROM',
          '"LedgerPro" <noreply@ledgerpro.com>',
        ),
        to,
        subject,
        html,
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send welcome email to ${to}: ${message}`);
      throw error;
    }
  }

  async sendOtpEmail(
    to: string,
    firstName: string,
    otpCode: string,
    expiresInMinutes: number,
  ): Promise<void> {
    const subject = 'LedgerPro — Verify Your Email';

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; border: 1px solid #222; border-radius: 12px; overflow: hidden;">
        <div style="background: #111; padding: 32px 32px 24px; border-bottom: 1px solid #222;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 700;">LedgerPro Shop</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 20px;">
            Hi <strong>${firstName}</strong>,
          </p>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            Use the code below to verify your email and finish creating your account.
          </p>

          <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 24px; margin: 0 0 24px; text-align: center;">
            <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">Verification Code</p>
            <p style="color: #fff; font-size: 32px; font-weight: 700; font-family: monospace; letter-spacing: 6px; margin: 0;">${otpCode}</p>
          </div>

          <div style="background: #1c1007; border: 1px solid #854d0e; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px;">
            <p style="color: #fbbf24; font-size: 13px; margin: 0;">
              This code expires in <strong>${expiresInMinutes} minutes</strong>.
            </p>
          </div>

          <p style="color: #475569; font-size: 12px; margin: 0; line-height: 1.5;">
            If you did not request this, ignore this email.
          </p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'MAIL_FROM',
          '"LedgerPro" <noreply@ledgerpro.com>',
        ),
        to,
        subject,
        html,
      });
      this.logger.log(`Customer OTP email sent to ${to}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send customer OTP email to ${to}: ${message}`,
      );
      throw error;
    }
  }

  async sendPasswordResetOtpEmail(
    to: string,
    firstName: string,
    otpCode: string,
    expiresInMinutes: number,
  ): Promise<void> {
    const subject = 'LedgerPro — Password Reset Code';

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; border: 1px solid #222; border-radius: 12px; overflow: hidden;">
        <div style="background: #111; padding: 32px 32px 24px; border-bottom: 1px solid #222;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 700;">LedgerPro</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 20px;">
            Hi <strong>${firstName}</strong>,
          </p>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            We received a request to reset your password. Use the code below to set a new password.
          </p>

          <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 24px; margin: 0 0 24px; text-align: center;">
            <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">Reset Code</p>
            <p style="color: #fff; font-size: 32px; font-weight: 700; font-family: monospace; letter-spacing: 6px; margin: 0;">${otpCode}</p>
          </div>

          <div style="background: #1c1007; border: 1px solid #854d0e; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px;">
            <p style="color: #fbbf24; font-size: 13px; margin: 0;">
              This code expires in <strong>${expiresInMinutes} minutes</strong>.
            </p>
          </div>

          <p style="color: #475569; font-size: 12px; margin: 0; line-height: 1.5;">
            If you did not request a password reset, you can safely ignore this email. Your password will not be changed.
          </p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'MAIL_FROM',
          '"LedgerPro" <noreply@ledgerpro.com>',
        ),
        to,
        subject,
        html,
      });
      this.logger.log(`Password reset OTP email sent to ${to}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send password reset OTP email to ${to}: ${message}`,
      );
      throw error;
    }
  }

  async sendPasswordResetEmail(
    to: string,
    firstName: string,
    tempPassword: string,
    expiresInHours: number,
  ): Promise<void> {
    const loginUrl = this.configService.get<string>(
      'CORS_ORIGIN',
      'http://localhost:5173',
    );

    const subject = 'LedgerPro — Your Credentials Have Been Reset';

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; border: 1px solid #222; border-radius: 12px; overflow: hidden;">
        <div style="background: #111; padding: 32px 32px 24px; border-bottom: 1px solid #222;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 700;">LedgerPro</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 20px;">
            Hi <strong>${firstName}</strong>,
          </p>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            Your credentials have been reset by an administrator. Use the new temporary password below to log in.
          </p>

          <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding: 4px 0;">Temporary Password</td>
                <td style="color: #fff; font-size: 14px; font-weight: 600; text-align: right; padding: 4px 0; font-family: monospace;">${tempPassword}</td>
              </tr>
            </table>
          </div>

          <a href="${loginUrl}/login" style="display: block; text-align: center; background: #fff; color: #0a0a0a; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 8px; margin: 0 0 24px;">
            Log In to LedgerPro
          </a>

          <div style="background: #1c1007; border: 1px solid #854d0e; border-radius: 8px; padding: 12px 16px;">
            <p style="color: #fbbf24; font-size: 13px; margin: 0;">
              ⚠ This temporary password expires in <strong>${expiresInHours} hours</strong>.
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'MAIL_FROM',
          '"LedgerPro" <noreply@ledgerpro.com>',
        ),
        to,
        subject,
        html,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send password reset email to ${to}: ${message}`,
      );
      throw error;
    }
  }
}
