import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Half_Day'
  | 'Leave'
  | 'Holiday'
  | 'Weekend';

/**
 * Single row inside the manager attendance grid submission. The
 * shape mirrors the visible columns of the Shanel attendance grid:
 * employee + date + check-in/out + status + optional OT and
 * cards-produced + notes.
 *
 * `checkInTime` / `checkOutTime` are clock-times in `HH:mm[:ss]`,
 * not full timestamps — the date comes from `attendanceDate`.
 */
export class BulkAttendanceRowDto {
  @IsUUID()
  employeeId!: string;

  @IsDateString()
  attendanceDate!: string;

  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'checkInTime must be in HH:mm or HH:mm:ss format',
  })
  checkInTime?: string;

  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'checkOutTime must be in HH:mm or HH:mm:ss format',
  })
  checkOutTime?: string;

  @IsEnum(['Present', 'Absent', 'Half_Day', 'Leave', 'Holiday', 'Weekend'])
  status!: AttendanceStatus;

  @IsOptional()
  @IsBoolean()
  isOvertime?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  overtimeHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  cardsProduced?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Manager bulk attendance submission. Hard-capped at 500 rows per
 * request — a typical branch's monthly grid is well under that and
 * the cap protects the batch upsert transaction from running long.
 */
export class BulkAttendanceDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceRowDto)
  rows!: BulkAttendanceRowDto[];
}
