import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CreditAccountStatus } from '@common/enums/credit-account-status.enum';

/** Manager/admin account listing filters (branch is scoped by the service). */
export class ListCreditAccountsQueryDto {
  @IsOptional()
  @IsEnum(CreditAccountStatus)
  status?: CreditAccountStatus;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
