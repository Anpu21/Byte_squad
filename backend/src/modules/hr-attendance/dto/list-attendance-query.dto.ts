import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/**
 * Query DTO for `GET /hr/attendance`.
 *
 * - `branchId` is honoured only for admins — the service overrides it
 *   with `actor.branchId` for managers so the URL cannot widen scope.
 * - `startDate` / `endDate` are required and inclusive (ISO `YYYY-MM-DD`).
 * - `employeeId` narrows the window to a single employee for the
 *   employee-profile view.
 */
export class ListAttendanceQueryDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
