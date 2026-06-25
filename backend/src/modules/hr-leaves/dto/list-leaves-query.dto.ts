import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export const LEAVE_STATUSES = [
  'Pending',
  'Approved',
  'Rejected',
  'Cancelled',
] as const;

export type TLeaveStatus = (typeof LEAVE_STATUSES)[number];

/**
 * Filter shape for `GET /hr/leaves`. Managers are pinned to their own
 * branch in the service layer regardless of `branchId` here — the URL
 * cannot widen scope. Cashiers are forced to their own employeeId.
 */
export class ListLeavesQueryDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsEnum(LEAVE_STATUSES)
  status?: TLeaveStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

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
