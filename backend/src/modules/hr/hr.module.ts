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
import { EmployeeLeavesRepository } from '@/modules/hr/employee-leaves.repository';
import { EmployeeLeavesService } from '@/modules/hr/employee-leaves.service';
import { EmployeeLeavesController } from '@/modules/hr/employee-leaves.controller';
import { SalaryStructuresRepository } from '@/modules/hr/salary-structures.repository';
import { SalaryStructuresService } from '@/modules/hr/salary-structures.service';
import { SalaryStructuresController } from '@/modules/hr/salary-structures.controller';
import { PayrollSettingsRepository } from '@/modules/hr/payroll-settings.repository';
import { PayrollSettingsService } from '@/modules/hr/payroll-settings.service';
import { PayrollSettingsController } from '@/modules/hr/payroll-settings.controller';
import { PayrollRepository } from '@/modules/hr/payroll.repository';
import { PayrollService } from '@/modules/hr/payroll.service';
import { PayrollController } from '@/modules/hr/payroll.controller';

/**
 * HR module — built up incrementally:
 *
 * - BE-H1 landed the schema (entities + migration).
 * - BE-H2 added the Employees CRUD + photo upload, with strict
 *   branch scoping for managers.
 * - BE-H3 added the Attendance CRUD + bulk grid + cashier self
 *   check-in/out flow. AttendanceService leans on EmployeesRepository
 *   for branch-scoped resolution of each row's employee.
 * - BE-H4 added the EmployeeLeaves workflow + annual-balance
 *   accounting (apply / approve / reject / cancel) with atomic
 *   balance adjustments through EmployeesRepository.
 * - BE-H5 added SalaryStructure and PayrollSettings CRUD — the
 *   configurable inputs the BE-H6 payroll generator depends on to
 *   compute gross / deductions / net per pay period.
 * - BE-H6 (this phase) adds the Payroll engine — monthly generation,
 *   approve → Paid state machine, and the bank-file CSV export.
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
    EmployeeLeavesRepository,
    EmployeeLeavesService,
    SalaryStructuresRepository,
    SalaryStructuresService,
    PayrollSettingsRepository,
    PayrollSettingsService,
    PayrollRepository,
    PayrollService,
  ],
  controllers: [
    EmployeesController,
    AttendanceController,
    EmployeeLeavesController,
    SalaryStructuresController,
    PayrollSettingsController,
    PayrollController,
  ],
  exports: [
    EmployeesService,
    EmployeesRepository,
    AttendanceService,
    AttendanceRepository,
    EmployeeLeavesService,
    EmployeeLeavesRepository,
    SalaryStructuresService,
    SalaryStructuresRepository,
    PayrollSettingsService,
    PayrollSettingsRepository,
    PayrollService,
    PayrollRepository,
    TypeOrmModule,
  ],
})
export class HrModule {}
