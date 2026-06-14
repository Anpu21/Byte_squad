import { IsNumber, Min, ValidateIf } from 'class-validator';

export class SetCreditLimitDto {
  /** Numeric ceiling, or explicit null to restore unlimited credit. */
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  creditLimit!: number | null;
}
