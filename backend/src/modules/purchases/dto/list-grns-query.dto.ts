import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import {
  GRN_STATUSES,
  type GrnStatus,
} from '@/modules/purchases/types/grn-status.type';
import {
  GRN_PAYMENT_STATUSES,
  type GrnPaymentStatus,
} from '@/modules/purchases/types/grn-payment-status.type';

export class ListGrnsQueryDto {
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsIn(GRN_STATUSES)
  status?: GrnStatus;

  @IsOptional()
  @IsIn(GRN_PAYMENT_STATUSES)
  paymentStatus?: GrnPaymentStatus;

  /** ISO date `YYYY-MM-DD`, inclusive. */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /** ISO date `YYYY-MM-DD`, inclusive. */
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
