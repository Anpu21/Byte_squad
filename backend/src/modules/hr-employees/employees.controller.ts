import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import {
  EmployeesService,
  type EmployeesListActor,
  type EmployeesListResponse,
} from '@/modules/hr-employees/employees.service';
import { Employee } from '@/modules/hr-employees/entities/employee.entity';
import { CreateEmployeeDto } from '@/modules/hr-employees/dto/create-employee.dto';
import { UpdateEmployeeDto } from '@/modules/hr-employees/dto/update-employee.dto';
import { ListEmployeesQueryDto } from '@/modules/hr-employees/dto/list-employees-query.dto';
import { TerminateEmployeeDto } from '@/modules/hr-employees/dto/terminate-employee.dto';

@Controller(APP_ROUTES.HR.EMPLOYEES.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(
    @Query() query: ListEmployeesQueryDto,
    @CurrentUser() actor: EmployeesListActor,
  ): Promise<EmployeesListResponse> {
    return this.employeesService.list(query, actor);
  }

  @Get(APP_ROUTES.HR.EMPLOYEES.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: EmployeesListActor,
  ): Promise<Employee> {
    return this.employeesService.getById(id, actor);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreateEmployeeDto,
    @CurrentUser() actor: EmployeesListActor,
  ): Promise<Employee> {
    return this.employeesService.create(dto, actor);
  }

  @Patch(APP_ROUTES.HR.EMPLOYEES.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() actor: EmployeesListActor,
  ): Promise<Employee> {
    return this.employeesService.update(id, dto, actor);
  }

  // Admin-only — ending someone's employment is not a manager call.
  @Patch(APP_ROUTES.HR.EMPLOYEES.TERMINATE)
  @Roles(UserRole.ADMIN)
  terminate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TerminateEmployeeDto,
    @CurrentUser() actor: EmployeesListActor,
  ): Promise<Employee> {
    return this.employeesService.terminate(id, dto, actor);
  }

  @Post(APP_ROUTES.HR.EMPLOYEES.PHOTO)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2 MB
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp|gif)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() actor: EmployeesListActor,
  ): Promise<Employee> {
    return this.employeesService.uploadPhoto(id, file, actor);
  }
}
