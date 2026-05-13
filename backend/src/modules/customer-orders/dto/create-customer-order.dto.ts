import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
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

  @IsInt()
  @Min(1)
  quantity!: number;
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
