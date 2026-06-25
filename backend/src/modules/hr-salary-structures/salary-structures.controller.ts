import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import {
  SalaryStructuresService,
  type SalaryActor,
} from '@/modules/hr-salary-structures/salary-structures.service';
import { SalaryStructure } from '@/modules/hr-salary-structures/entities/salary-structure.entity';
import { CreateSalaryStructureDto } from '@/modules/hr-salary-structures/dto/create-salary-structure.dto';
import { UpdateSalaryStructureDto } from '@/modules/hr-salary-structures/dto/update-salary-structure.dto';

/**
 * Thin REST surface for per-employee salary structures. Scope and
 * transition logic live in the service — the controller is the wire
 * adapter only (rules §9).
 */
@Controller(APP_ROUTES.HR.SALARY_STRUCTURES.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalaryStructuresController {
  constructor(private readonly structures: SalaryStructuresService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(
    @Query('employeeId') employeeId: string | undefined,
    @CurrentUser() actor: SalaryActor,
  ): Promise<SalaryStructure[]> {
    if (!employeeId) {
      throw new BadRequestException('employeeId query parameter is required');
    }
    return this.structures.list(employeeId, actor);
  }

  @Get(APP_ROUTES.HR.SALARY_STRUCTURES.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: SalaryActor,
  ): Promise<SalaryStructure> {
    return this.structures.getById(id, actor);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreateSalaryStructureDto,
    @CurrentUser() actor: SalaryActor,
  ): Promise<SalaryStructure> {
    return this.structures.create(dto, actor);
  }

  @Patch(APP_ROUTES.HR.SALARY_STRUCTURES.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSalaryStructureDto,
    @CurrentUser() actor: SalaryActor,
  ): Promise<SalaryStructure> {
    return this.structures.update(id, dto, actor);
  }

  @Patch(APP_ROUTES.HR.SALARY_STRUCTURES.DEACTIVATE)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: SalaryActor,
  ): Promise<SalaryStructure> {
    return this.structures.deactivate(id, actor);
  }
}
