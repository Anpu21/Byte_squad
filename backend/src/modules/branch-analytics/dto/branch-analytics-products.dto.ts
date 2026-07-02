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
import type { BranchAnalyticsProductSort } from '@/modules/branch-analytics/types';

/**
 * Body for POST /branch-analytics/products — the accurate product×branch
 * comparison. Extends the shared pagination DTO (page/limit) and mirrors the
 * comparison DTO's branch/date validation; adds product `search` + `sort`.
 */
export class BranchAnalyticsProductsDto extends PaginationQueryDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  branchIds?: string[];

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['revenue', 'quantity'])
  sort?: BranchAnalyticsProductSort;
}
