import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '@users/users.module';
import { EmployeeLeave } from '@/modules/hr-leaves/entities/employee-leave.entity';
import { EmployeeLeavesRepository } from '@/modules/hr-leaves/employee-leaves.repository';
import { EmployeeLeavesService } from '@/modules/hr-leaves/employee-leaves.service';
import { EmployeeLeavesController } from '@/modules/hr-leaves/employee-leaves.controller';
import { HrEmployeesModule } from '@/modules/hr-employees/hr-employees.module';

/**
 * Employee leaves module — apply / approve / reject / cancel workflow with
 * atomic annual-balance accounting through EmployeesRepository.
 *
 * UsersModule resolves a leave applicant's auth role — manager leaves can
 * only be approved/rejected by an admin.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeLeave]),
    HrEmployeesModule,
    UsersModule,
  ],
  controllers: [EmployeeLeavesController],
  providers: [EmployeeLeavesRepository, EmployeeLeavesService],
  exports: [],
})
export class HrLeavesModule {}
