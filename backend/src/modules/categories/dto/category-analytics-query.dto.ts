import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CategoryAnalyticsQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  // Admin only: filter to one branch. Omitted = all branches.
  // Ignored (forced to the actor's branch) for Manager/Cashier.
  @IsOptional()
  @IsUUID('4')
  branchId?: string;
}
