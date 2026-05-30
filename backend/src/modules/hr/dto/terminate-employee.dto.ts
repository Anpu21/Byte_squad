import { IsDateString, IsString, MinLength } from 'class-validator';

/**
 * Body DTO for `PATCH /hr/employees/:id/terminate`. We require a
 * `reason` (audit/legal trail) and a `terminationDate` (payroll
 * cut-off). The repository writes both fields and flips status to
 * `Terminated` atomically; the row stays in place so payroll history
 * remains queryable.
 */
export class TerminateEmployeeDto {
  @IsDateString()
  terminationDate!: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
