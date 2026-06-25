import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollSettings } from '@/modules/hr-payroll-settings/entities/payroll-settings.entity';
import { PayrollSettingsRepository } from '@/modules/hr-payroll-settings/payroll-settings.repository';
import { PayrollSettingsService } from '@/modules/hr-payroll-settings/payroll-settings.service';
import { PayrollSettingsController } from '@/modules/hr-payroll-settings/payroll-settings.controller';

/**
 * Payroll settings module — leaf configuration for the payroll engine
 * (global + per-branch deduction/overtime rules). Attendance and Payroll
 * import this for the exported PayrollSettingsService.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PayrollSettings])],
  controllers: [PayrollSettingsController],
  providers: [PayrollSettingsRepository, PayrollSettingsService],
  exports: [PayrollSettingsService],
})
export class HrPayrollSettingsModule {}
