import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** POS picker search: find ACTIVE credit accounts by name/phone/account no. */
export class SearchCreditAccountsQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  q!: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}
