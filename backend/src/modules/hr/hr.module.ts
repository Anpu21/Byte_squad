import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '@/modules/hr/entities/attendance.entity';
import { AttendanceSummary } from '@/modules/hr/entities/attendance-summary.entity';
import { Employee } from '@/modules/hr/entities/employee.entity';
import { EmployeeLeave } from '@/modules/hr/entities/employee-leave.entity';
import { Payroll } from '@/modules/hr/entities/payroll.entity';
import { PayrollSettings } from '@/modules/hr/entities/payroll-settings.entity';
import { SalaryStructure } from '@/modules/hr/entities/salary-structure.entity';

/**
 * Phase BE-H1 of the HR module — schema only.
 *
 * Persistence layer for the attendance + payroll feature. Mirrored on
 * the Shanel ERP HR schema (docs/sample-project) but adapted to
 * LedgerPro's NestJS + TypeORM + UUID + branch-scoped conventions.
 *
 * Repositories, services, and controllers land in BE-H2 onwards.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      SalaryStructure,
      Attendance,
      AttendanceSummary,
      EmployeeLeave,
      Payroll,
      PayrollSettings,
    ]),
  ],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class HrModule {}
