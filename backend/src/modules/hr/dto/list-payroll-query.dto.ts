import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export const PAYROLL_STATUSES = [
  'Pending',
  'Approved',
  'Paid',
  'Cancelled',
] as const;

export type TPayrollStatus = (typeof PAYROLL_STATUSES)[number];

/**
 * Filter shape for `GET /hr/payroll`. Managers are pinned to their own
 * branch in the service layer regardless of `branchId` here — the URL
 * cannot widen scope.
 */
export class ListPayrollQueryDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsEnum(PAYROLL_STATUSES)
  status?: TPayrollStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
