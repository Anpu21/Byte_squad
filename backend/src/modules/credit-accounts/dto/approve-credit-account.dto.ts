import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Manager approval: set the maximum credit amount and the repayment window
 * (days) for the account, moving it to ACTIVE. Also used to resume a SUSPENDED
 * account.
 */
export class ApproveCreditAccountDto {
  @IsNumber()
  @Min(1)
  creditLimit!: number;

  @IsInt()
  @Min(1)
  @Max(365)
  creditTermDays!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  approvalNote?: string;
}
