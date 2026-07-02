import { IsOptional, IsUUID } from 'class-validator';

export class CustomerAnalyticsQueryDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
