import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';
import {
  BRANCH_ANALYTICS_SECTIONS,
  type BranchAnalyticsSection,
} from '@/modules/branch-analytics/types';

export class BranchAnalyticsComparisonDto {
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
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(BRANCH_ANALYTICS_SECTIONS, { each: true })
  sections?: BranchAnalyticsSection[];
}
