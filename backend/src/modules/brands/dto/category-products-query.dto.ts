import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from '@common/pagination/pagination-query.dto';
import type { CategoryProductSort } from '@/modules/brands/types';

/** Query for the paginated, brand-tagged product roster within a category. */
export class CategoryProductsQueryDto extends PaginationQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  // Admin only: filter to one branch. Omitted = all branches.
  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  // Narrow the roster to one brand within the category.
  @IsOptional()
  @IsUUID('4')
  brandId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['revenue', 'units', 'profit'])
  sort?: CategoryProductSort;
}
