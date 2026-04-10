import { IsInt, IsUUID, IsOptional, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  branchId!: string;

  @IsInt()
  @Min(0)
  quantity!: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  lowStockThreshold?: number;
}
