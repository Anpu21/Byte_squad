import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * The cashier's "special form": enroll a walk-in customer for store credit.
 * Creates a PENDING account that a branch manager must approve. `branchId` is
 * admin-only (a manager/cashier always enrolls under their own branch).
 */
export class CreateCreditAccountRequestDto {
  @IsString()
  @MaxLength(120)
  holderName!: string;

  @IsString()
  @MaxLength(16)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  nic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  // The cashier's suggested limit — advisory; the manager sets the real one.
  @IsOptional()
  @IsNumber()
  @Min(0)
  requestedCreditLimit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}
