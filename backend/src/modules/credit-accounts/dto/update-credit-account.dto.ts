import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

/** Manager edit of an ACTIVE/SUSPENDED account's credit limit and/or term. */
export class UpdateCreditAccountDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  creditLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  creditTermDays?: number;
}
