import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateGrnItemDto {
  @IsUUID()
  productId!: string;

  /** Base-unit quantity received; supports fractional stock (kg, l). */
  @IsNumber()
  @Min(0.001)
  @Max(1_000_000)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitCost!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  batchNo?: string;

  /** ISO date `YYYY-MM-DD`. */
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class CreateGrnDto {
  @IsUUID()
  supplierId!: string;

  /** Required for admins; managers are pinned to their own branch. */
  @IsOptional()
  @IsUUID()
  branchId?: string;

  /** Converting a purchase order — marked Received inside the same txn. */
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  supplierInvoiceNo?: string;

  /** ISO date `YYYY-MM-DD`; defaults to today. */
  @IsOptional()
  @IsDateString()
  grnDate?: string;

  /** Header-level discount off the items subtotal. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGrnItemDto)
  items!: CreateGrnItemDto[];
}
