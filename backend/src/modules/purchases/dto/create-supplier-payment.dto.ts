import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  SUPPLIER_PAYMENT_METHODS,
  type SupplierPaymentMethod,
} from '@/modules/purchases/types/supplier-payment-method.type';

export class SupplierPaymentAllocationDto {
  /** Omitted = settle the supplier's opening balance. */
  @IsOptional()
  @IsUUID()
  grnId?: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;
}

export class CreateSupplierPaymentDto {
  @IsUUID()
  supplierId!: string;

  /** Required for admins; managers are pinned to their own branch. */
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsIn(SUPPLIER_PAYMENT_METHODS)
  method!: SupplierPaymentMethod;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  /** ISO date `YYYY-MM-DD`; defaults to today. */
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  /** Must sum exactly to `amount` (bill-by-bill adjustment). */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SupplierPaymentAllocationDto)
  allocations!: SupplierPaymentAllocationDto[];
}
