import { IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateStockDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  branchId!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  lowStockThreshold?: number;
}
