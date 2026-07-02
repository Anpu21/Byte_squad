import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsUUID,
} from 'class-validator';

/**
 * Body for POST /brands/analytics/by-branch/trend — one brand's daily
 * revenue/units, one zero-filled series per selected branch.
 */
export class BrandBranchTrendDto {
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
}
