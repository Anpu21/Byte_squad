import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '@common/cloudinary/cloudinary.module';
import { Employee } from '@/modules/hr-employees/entities/employee.entity';
import { EmployeesRepository } from '@/modules/hr-employees/employees.repository';
import { EmployeesService } from '@/modules/hr-employees/employees.service';
import { EmployeesController } from '@/modules/hr-employees/employees.controller';

/**
 * Employee master module — the HR foundation. Owns the Employee entity and
 * its branch-scoped CRUD + photo upload (via Cloudinary). Every other HR
 * module resolves employees through the exported EmployeesService /
 * EmployeesRepository.
 *
 * CloudinaryModule is `@Global()` elsewhere in the app, but we import it
 * explicitly here so the dependency is obvious from this module's surface.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Employee]), CloudinaryModule],
  controllers: [EmployeesController],
  providers: [EmployeesRepository, EmployeesService],
  exports: [EmployeesService, EmployeesRepository],
})
export class HrEmployeesModule {}
