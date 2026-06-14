import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/**
 * Transactional email via Resend's HTTP API. Chosen over SMTP because
 * outbound SMTP is unreliable on serverless/edge hosts (Fly.io). The public
 * surface (the four `send*` methods + `isVerified()`) is unchanged, so callers
 * in auth/users services are untouched.
 *
 * `MAIL_FROM` must be a Resend-verified sender (verify the domain in Resend and
 * add its SPF/DKIM DNS records); `onboarding@resend.dev` works for a smoke test
 * but only delivers to the Resend account owner.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = this.configService.get<string>(
      'MAIL_FROM',
      'LedgerPro <onboarding@resend.dev>',
    );
    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY not set — OTP/welcome emails will not be sent until it is configured.',
      );
    }
  }

  /** True when email is configured (API key present). Callers gate sends on this. */
  isVerified(): boolean {
    return this.resend !== null;
  }

  private async dispatch(
    to: string,
    subject: string,
    html: string,
    label: string,
  ): Promise<void> {
    if (!this.resend) {
      throw new ServiceUnavailableException('Email service is not configured');
    }
    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });
    if (error) {
      this.logger.error(`Failed to send ${label} to ${to}: ${error.message}`);
      throw new ServiceUnavailableException('Failed to send email');
    }
    this.logger.log(`${label} sent to ${to}`);
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

    await this.dispatch(to, subject, html, 'Welcome email');
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

    await this.dispatch(to, subject, html, 'Customer OTP email');
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

    await this.dispatch(to, subject, html, 'Password reset OTP email');
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

    await this.dispatch(to, subject, html, 'Password reset email');
  }
}
