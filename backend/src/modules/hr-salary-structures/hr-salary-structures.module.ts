import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryStructure } from '@/modules/hr-salary-structures/entities/salary-structure.entity';
import { SalaryStructuresRepository } from '@/modules/hr-salary-structures/salary-structures.repository';
import { SalaryStructuresService } from '@/modules/hr-salary-structures/salary-structures.service';
import { SalaryStructuresController } from '@/modules/hr-salary-structures/salary-structures.controller';
import { HrEmployeesModule } from '@/modules/hr-employees/hr-employees.module';

/**
 * Salary structures module — per-employee gross/allowance/deduction
 * configuration the payroll generator reads when computing each pay period.
 * Resolves employees via the exported EmployeesRepository.
 */
@Module({
  imports: [TypeOrmModule.forFeature([SalaryStructure]), HrEmployeesModule],
  controllers: [SalaryStructuresController],
  providers: [SalaryStructuresRepository, SalaryStructuresService],
  exports: [SalaryStructuresService, SalaryStructuresRepository],
})
export class HrSalaryStructuresModule {}
