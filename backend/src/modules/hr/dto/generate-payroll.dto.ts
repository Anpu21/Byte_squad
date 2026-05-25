import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

/**
 * Body for `POST /hr/payroll/generate`. Triggers a full monthly run
 * for the resolved branch (managers are pinned to their own branch in
 * the service layer regardless of `branchId` here).
 */
export class GeneratePayrollDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsInt()
  @Min(2020)
  @Max(2100)
  year!: number;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}
