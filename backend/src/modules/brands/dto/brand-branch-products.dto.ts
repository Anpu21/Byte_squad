import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import type { BrandBranchSort } from '@/modules/brands/types';

/**
 * Body for POST /brands/analytics/by-branch/products — one brand's paginated
 * product×branch matrix. Same branch/date validation as the comparison DTO,
 * plus the brand to drill into and product `search`/`sort` controls.
 */
export class BrandBranchProductsDto extends PaginationQueryDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  branchIds?: string[];

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsUUID('4')
  brandId!: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['revenue', 'units', 'profit'])
  sort?: BrandBranchSort;
}
