import { IsInt, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

/**
 * Body for `PUT /hr/payroll-settings/branch`. Same shape as the
 * global update DTO with a required `branchId` so the service can
 * upsert in one round-trip. The service is the gate that decides
 * whether a manager is allowed to touch the given branch.
 */
export class UpsertBranchPayrollSettingsDto {
  @IsUUID()
  branchId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  epfEmployeePercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  epfEmployerPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  etfEmployerPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  attendanceBonusThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  lateGraceMinutes?: number;
}
