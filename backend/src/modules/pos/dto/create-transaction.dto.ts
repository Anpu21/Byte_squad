import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from '@common/enums/discount.enum';
import { TransactionType } from '@/common/enums/transaction.enum';
import { PaymentMethod } from '@/common/enums/payment-method';

export class TransactionItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;
}

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  // Shop accepts Cash + Card (PayHere) only. The DB enum keeps its legacy
  // mobile/online values for historical rows, but new transactions are
  // restricted to cash/card.
  @IsIn([PaymentMethod.CASH, PaymentMethod.CARD])
  paymentMethod!: PaymentMethod;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items!: TransactionItemDto[];
}
