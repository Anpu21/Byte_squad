import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '@common/cloudinary/cloudinary.module';
import { Attendance } from '@/modules/hr/entities/attendance.entity';
import { AttendanceSummary } from '@/modules/hr/entities/attendance-summary.entity';
import { Employee } from '@/modules/hr/entities/employee.entity';
import { EmployeeLeave } from '@/modules/hr/entities/employee-leave.entity';
import { Payroll } from '@/modules/hr/entities/payroll.entity';
import { PayrollSettings } from '@/modules/hr/entities/payroll-settings.entity';
import { SalaryStructure } from '@/modules/hr/entities/salary-structure.entity';
import { EmployeesRepository } from '@/modules/hr/employees.repository';
import { EmployeesService } from '@/modules/hr/employees.service';
import { EmployeesController } from '@/modules/hr/employees.controller';
import { AttendanceRepository } from '@/modules/hr/attendance.repository';
import { AttendanceService } from '@/modules/hr/attendance.service';
import { AttendanceController } from '@/modules/hr/attendance.controller';

/**
 * HR module — built up incrementally:
 *
 * - BE-H1 landed the schema (entities + migration).
 * - BE-H2 added the Employees CRUD + photo upload, with strict
 *   branch scoping for managers.
 * - BE-H3 (this phase) adds the Attendance CRUD + bulk grid + cashier
 *   self check-in/out flow. AttendanceService leans on
 *   EmployeesRepository for branch-scoped resolution of each row's
 *   employee — that's the same scoping rule the Employees module
 *   already enforces.
 *
 * CloudinaryModule is `@Global()` elsewhere in the app, but we import
 * it explicitly here so the dependency is obvious from this module's
 * surface — and to keep the module self-contained for the spec
 * harness.
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
    CloudinaryModule,
  ],
  providers: [
    EmployeesRepository,
    EmployeesService,
    AttendanceRepository,
    AttendanceService,
  ],
  controllers: [EmployeesController, AttendanceController],
  exports: [
    EmployeesService,
    EmployeesRepository,
    AttendanceService,
    AttendanceRepository,
    TypeOrmModule,
  ],
})
export class HrModule {}
