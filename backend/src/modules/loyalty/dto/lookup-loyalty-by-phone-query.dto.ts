import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * Query DTO for `GET /loyalty/lookup`. Accepts a loose phone shape
 * here (7-16 digits, optional leading `+`) so the cashier can paste
 * whatever they read off the loyalty card; the service normalizes
 * via `normalizeSriLankaPhone` before hitting the DB.
 */
export class LookupLoyaltyByPhoneQueryDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9 ()-]{7,20}$/)
  phone!: string;
}
