import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class TransferAnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  // Admin only — scope to one branch (its source OR destination transfers).
  // Ignored for managers (forced to their own branch).
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
