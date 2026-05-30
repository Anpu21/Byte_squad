import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export const SALARY_TYPES = ['Monthly_Fixed', 'Production_Based'] as const;

export type TSalaryType = (typeof SALARY_TYPES)[number];

/**
 * Body for `POST /hr/salary-structures`. The four rate fields
 * (`monthlyBase`, `dailyRate`, `productionRatePerCard`,
 * `attendanceBonusAmount`) are all optional individually because the
 * relevant subset depends on `salaryType` — a `Monthly_Fixed`
 * structure usually leaves `productionRatePerCard` at zero, and a
 * `Production_Based` structure usually leaves `monthlyBase` at zero.
 * The payroll generator handles missing values as zero so the row
 * stays valid even when a single rate is configured.
 */
export class CreateSalaryStructureDto {
  @IsUUID()
  employeeId!: string;

  @IsEnum(SALARY_TYPES)
  salaryType!: TSalaryType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyBase?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  productionRatePerCard?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  teaAllowanceDaily?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otRatePerHour?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  attendanceBonusAmount?: number;

  @IsDateString()
  effectiveFromDate!: string;

  @IsOptional()
  @IsDateString()
  effectiveToDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
