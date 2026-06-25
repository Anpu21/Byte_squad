import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * Body DTO for `POST /loyalty/enroll`. Walk-ins are intentionally
 * phone-only (no email, no password); the service will normalize
 * the phone and reject collisions with existing users or
 * pre-existing walk-in rows.
 */
export class EnrollWalkInCustomerDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9 ()-]{7,20}$/)
  phone!: string;

  @IsString()
  @Length(1, 60)
  firstName!: string;

  @IsString()
  @IsOptional()
  @Length(1, 60)
  lastName?: string;
}
