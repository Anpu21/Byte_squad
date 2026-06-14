import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import {
  PURCHASE_ORDER_STATUSES,
  type PurchaseOrderStatus,
} from '@/modules/purchases/types/purchase-order-status.type';

export class ListPurchaseOrdersQueryDto {
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsIn(PURCHASE_ORDER_STATUSES)
  status?: PurchaseOrderStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
