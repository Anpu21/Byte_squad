import { PartialType } from '@nestjs/mapped-types';
import { CreateDiscountSchemeDto } from '@pos/dto/create-discount-scheme.dto';

export class UpdateDiscountSchemeDto extends PartialType(
  CreateDiscountSchemeDto,
) {}
