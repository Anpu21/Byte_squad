import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';

export class JournalLineDto {
  /** Chart-of-accounts id (from `GET /accounting/accounts`). */
  @IsUUID()
  accountId!: string;

  @IsEnum(LedgerEntryType)
  entryType!: LedgerEntryType;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class CreateJournalVoucherDto {
  /** Required for admins; managers are pinned to their own branch. */
  @IsOptional()
  @IsUUID()
  branchId?: string;

  /** ISO date `YYYY-MM-DD`; defaults to today. */
  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  memo!: string;

  /** At least one debit and one credit; Σ debits must equal Σ credits. */
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines!: JournalLineDto[];
}
