import { IsDateString } from 'class-validator';

/** Date window for a group's purchase analytics (inclusive). */
export class GroupAnalyticsQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
