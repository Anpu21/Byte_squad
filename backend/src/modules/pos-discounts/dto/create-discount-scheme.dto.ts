import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import type { DiscountSchemeScope } from '@/modules/pos-discounts/entities/discount-scheme.entity';

export class CreateDiscountSchemeDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  /** Omit for an all-branch scheme. */
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsIn(['Product', 'Category'])
  scope!: DiscountSchemeScope;

  @ValidateIf((dto: CreateDiscountSchemeDto) => dto.scope === 'Product')
  @IsUUID()
  productId?: string;

  @ValidateIf((dto: CreateDiscountSchemeDto) => dto.scope === 'Category')
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minQty?: number;

  @IsNumber()
  @Min(0.01)
  @Max(100)
  discountPercentage!: number;

  /** ISO date `YYYY-MM-DD`, inclusive. */
  @IsDateString()
  startDate!: string;

  /** ISO date `YYYY-MM-DD`, inclusive. */
  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
