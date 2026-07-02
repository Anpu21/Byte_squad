import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ReturnsAnalyticsQueryDto {
  /** Branch to report on (admin only; managers/cashiers are auto-scoped). */
  @IsOptional()
  @IsUUID()
  branchId?: string;

  /** Restrict to one processor (admin/manager only). */
  @IsOptional()
  @IsUUID()
  cashierId?: string;

  /** Inclusive ISO window (YYYY-MM-DD). Defaults to the last 30 days. */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
