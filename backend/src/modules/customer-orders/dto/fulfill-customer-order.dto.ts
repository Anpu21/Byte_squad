import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@common/enums/payment-method';

export class FulfillCustomerOrderItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class FulfillCustomerOrderDto {
  @IsOptional()
  @IsIn([PaymentMethod.CASH], {
    message: 'Pickup orders can only be settled with cash',
  })
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FulfillCustomerOrderItemDto)
  items?: FulfillCustomerOrderItemDto[];
}
