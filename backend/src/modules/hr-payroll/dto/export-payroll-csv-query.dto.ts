import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

/**
 * Query DTO for `GET /hr/payroll/csv`. Month/year are required; the
 * bank-file export is always for a single pay period. Managers are
 * pinned to their own branch in the service layer regardless of the
 * `branchId` query param.
 */
export class ExportPayrollCsvQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year!: number;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}
