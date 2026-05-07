import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TransferStatus } from '@common/enums/transfer-status.enum';

const TERMINAL_STATUSES: TransferStatus[] = [
  TransferStatus.COMPLETED,
  TransferStatus.REJECTED,
  TransferStatus.CANCELLED,
];

export class ListTransferHistoryQueryDto {
  @IsOptional()
  @Transform(({ value }): string[] | undefined => {
    if (value == null || value === '') return undefined;
    if (Array.isArray(value)) return value.map((v: unknown) => String(v));
    return String(value).split(',');
  })
  @IsArray()
  @IsEnum(TransferStatus, { each: true })
  status?: TransferStatus[];

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export const HISTORY_TERMINAL_STATUSES = TERMINAL_STATUSES;
