import { ArrayMinSize, IsArray, IsDateString, IsUUID } from 'class-validator';

export class BranchComparisonDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  branchIds!: string[];

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
