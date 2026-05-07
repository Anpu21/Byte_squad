import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ListShopProductsDto {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class ShopBranchScopedDto {
  @IsUUID()
  branchId!: string;
}
