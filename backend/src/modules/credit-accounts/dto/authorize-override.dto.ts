import {
  IsEmail,
  IsNumber,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Step-up authorization for an over-limit credit charge at the POS counter.
 * The cashier's session calls this with a manager's credentials; on success
 * the service returns a short-lived token the checkout passes back to permit
 * the over-limit charge. The plaintext password is validated and discarded —
 * never persisted or logged.
 */
export class AuthorizeOverrideDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(128)
  password!: string;

  @IsUUID()
  creditAccountId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;
}
