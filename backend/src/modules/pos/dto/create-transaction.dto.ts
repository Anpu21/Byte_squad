import {
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
import { Type } from 'class-transformer';
import {
    DiscountType,
    PaymentMethod,
    TransactionType,
} from '../../../../../shared/constants/enums.js';

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

    @IsEnum(PaymentMethod)
    paymentMethod!: PaymentMethod;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TransactionItemDto)
    items!: TransactionItemDto[];
}
