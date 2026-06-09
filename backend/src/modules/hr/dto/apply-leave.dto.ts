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
 * Body for `POST /hr/leaves`. `employeeId` omitted means "the actor's
 * own employee record" (cashier self-apply, manager applying for
 * themselves); managers/admins may set it to apply on-behalf, subject
 * to branch scope. The 0.5-day floor lets half-day leaves be captured
 * without rounding (matches the `decimal(4,1)` column).
 */
export class ApplyLeaveDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

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
