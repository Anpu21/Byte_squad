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

export class CreateCustomerOrderItemDto {
  @IsUUID()
  productId!: string;

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

export class CreateCustomerOrderDto {
  @IsUUID()
  branchId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerOrderItemDto)
  items!: CreateCustomerOrderItemDto[];

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
