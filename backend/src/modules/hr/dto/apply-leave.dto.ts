import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const LEAVE_TYPES = [
  'Annual',
  'Sick',
  'Casual',
  'No_Pay',
  'Maternity',
  'Paternity',
] as const;

export type TLeaveType = (typeof LEAVE_TYPES)[number];

/**
 * Body for `POST /hr/leaves`. When a cashier applies, the service
 * forces `employeeId` to the actor's own employee record — the field
 * stays required on the DTO so manager-on-behalf flows can use the
 * same controller path. The 0.5-day floor lets half-day leaves be
 * captured without rounding (matches the `decimal(4,1)` column).
 */
export class ApplyLeaveDto {
  @IsUUID()
  employeeId!: string;

  @IsEnum(LEAVE_TYPES)
  leaveType!: TLeaveType;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsNumber()
  @Min(0.5)
  @Max(366)
  totalDays!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
