import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * Body for `PATCH /hr/payroll-settings/global`. Every field is
 * optional so callers can tune a single knob (e.g. lift the EPF
 * employee percent) without re-sending the whole settings shape.
 */
export class UpdatePayrollSettingsDto {
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
