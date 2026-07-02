import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsUUID,
} from 'class-validator';

/**
 * Body for POST /brands/analytics/by-branch — the brand×branch comparison.
 * `branchIds` is required (≥1) for admins; managers may omit it (their own
 * branch is always included) and add extra branches to compare against.
 */
export class BrandBranchComparisonDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  branchIds?: string[];

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
