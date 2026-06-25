import { PartialType } from '@nestjs/mapped-types';
import { CreateDiscountSchemeDto } from '@/modules/pos-discounts/dto/create-discount-scheme.dto';

export class UpdateDiscountSchemeDto extends PartialType(
  CreateDiscountSchemeDto,
) {}
