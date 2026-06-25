import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payroll } from '@/modules/hr-payroll/entities/payroll.entity';
import { PayrollRepository } from '@/modules/hr-payroll/payroll.repository';
import { PayrollService } from '@/modules/hr-payroll/payroll.service';
import { PayrollController } from '@/modules/hr-payroll/payroll.controller';
import { HrEmployeesModule } from '@/modules/hr-employees/hr-employees.module';
import { HrAttendanceModule } from '@/modules/hr-attendance/hr-attendance.module';
import { HrSalaryStructuresModule } from '@/modules/hr-salary-structures/hr-salary-structures.module';
import { HrPayrollSettingsModule } from '@/modules/hr-payroll-settings/hr-payroll-settings.module';

/**
 * Payroll module — the HR hub. Monthly payroll generation, the
 * approve → Paid state machine, and the bank-file CSV export. Pulls
 * employees, attendance, salary structures, and payroll settings from the
 * surrounding HR modules to compute gross / deductions / net per period.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Payroll]),
    HrEmployeesModule,
    HrAttendanceModule,
    HrSalaryStructuresModule,
    HrPayrollSettingsModule,
  ],
  controllers: [PayrollController],
  providers: [PayrollRepository, PayrollService],
  exports: [],
})
export class HrPayrollModule {}
