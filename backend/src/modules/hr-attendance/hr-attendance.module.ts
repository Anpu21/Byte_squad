import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '@/modules/hr-attendance/entities/attendance.entity';
import { AttendanceSummary } from '@/modules/hr-attendance/entities/attendance-summary.entity';
import { AttendanceRepository } from '@/modules/hr-attendance/attendance.repository';
import { AttendanceService } from '@/modules/hr-attendance/attendance.service';
import { AttendanceController } from '@/modules/hr-attendance/attendance.controller';
import { HrEmployeesModule } from '@/modules/hr-employees/hr-employees.module';
import { HrPayrollSettingsModule } from '@/modules/hr-payroll-settings/hr-payroll-settings.module';

/**
 * Attendance module — daily attendance CRUD + bulk grid + cashier self
 * check-in/out. Leans on EmployeesRepository for branch-scoped row
 * resolution and PayrollSettingsService for overtime/late rules.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, AttendanceSummary]),
    HrEmployeesModule,
    HrPayrollSettingsModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceRepository, AttendanceService],
  exports: [AttendanceService, AttendanceRepository],
})
export class HrAttendanceModule {}
