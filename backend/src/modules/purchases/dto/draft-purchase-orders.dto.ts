import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreatePurchaseOrderDto } from '@/modules/purchases/dto/create-purchase-order.dto';

/**
 * Turn approved reorder suggestions into Draft purchase orders — one entry
 * per supplier. Each order reuses the standard create-PO contract so the
 * usual supplier/product/branch validation applies.
 */
export class DraftPurchaseOrdersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderDto)
  orders!: CreatePurchaseOrderDto[];
}
