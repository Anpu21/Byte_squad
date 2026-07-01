import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

/**
 * Body DTO for `POST /loyalty/enroll`. Walk-ins are intentionally
 * phone-only (no email, no password); the service will normalize
 * the phone and reject collisions with existing users or
 * pre-existing walk-in rows. First + last name are both required so a
 * first-time enrolment always captures the full name (returning
 * customers attach by phone alone via `lookupByPhone`).
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
  @Length(1, 60)
  lastName!: string;
}
