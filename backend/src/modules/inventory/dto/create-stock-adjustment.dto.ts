import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { StockAdjustmentReason } from '@common/enums/stock-adjustment-reason.enum';

/**
 * Create a stock adjustment (Phase C2). `physicalQuantity` is the counted
 * on-hand after the event — the service computes the difference against the
 * current system quantity. Admins may target a branch; managers are scoped to
 * their own branch in the service.
 */
export class CreateStockAdjustmentDto {
  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsEnum(StockAdjustmentReason)
  reason!: StockAdjustmentReason;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  physicalQuantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
