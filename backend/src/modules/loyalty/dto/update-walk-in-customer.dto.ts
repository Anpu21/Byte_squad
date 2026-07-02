import { IsOptional, IsString, Length, Matches } from 'class-validator';

/**
 * Partial edit of a walk-in `LoyaltyCustomer` (name/phone). Any omitted field is
 * left unchanged. A changed phone is re-normalized and collision-checked against
 * both registered users and other walk-ins by the service.
 */
export class UpdateWalkInCustomerDto {
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9 ()-]{7,20}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  lastName?: string;
}
