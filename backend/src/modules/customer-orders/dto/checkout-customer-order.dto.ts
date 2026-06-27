import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { CustomerOrderPaymentMode } from '@common/enums/customer-order-payment-mode.enum';

/**
 * One cart line for the multi-branch checkout. Unlike the legacy
 * CreateCustomerOrderDto (one branch for the whole order), each line carries
 * its own branchId so the cart can span branches; the server groups lines by
 * branch into one order per branch under a shared group code.
 */
export class CheckoutItemDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  /**
   * "Buy by amount": the exact cash the customer wants to spend on this loose
   * line. When set, the line is charged this amount; `quantity` is the derived
   * weight. Server-validated against quantity × unit price.
   */
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;
}

export class CheckoutCustomerOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(CustomerOrderPaymentMode)
  paymentMode?: CustomerOrderPaymentMode;

  @IsOptional()
  @IsInt()
  @Min(0)
  loyaltyPointsToRedeem?: number;
}
