import {
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
  EmployeeLeavesService,
  type LeavesActor,
  type LeavesListResponse,
} from '@/modules/hr-leaves/employee-leaves.service';
import { EmployeeLeave } from '@/modules/hr-leaves/entities/employee-leave.entity';
import { ApplyLeaveDto } from '@/modules/hr-leaves/dto/apply-leave.dto';
import { ListLeavesQueryDto } from '@/modules/hr-leaves/dto/list-leaves-query.dto';
import { RejectLeaveDto } from '@/modules/hr-leaves/dto/reject-leave.dto';

@Controller(APP_ROUTES.HR.LEAVES.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeLeavesController {
  constructor(private readonly leaves: EmployeeLeavesService) {}

  @Get()
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  list(
    @Query() query: ListLeavesQueryDto,
    @CurrentUser() actor: LeavesActor,
  ): Promise<LeavesListResponse> {
    return this.leaves.list(query, actor);
  }

  @Get(APP_ROUTES.HR.LEAVES.BY_ID)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: LeavesActor,
  ): Promise<EmployeeLeave> {
    return this.leaves.getById(id, actor);
  }

  @Post()
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  apply(
    @Body() dto: ApplyLeaveDto,
    @CurrentUser() actor: LeavesActor,
  ): Promise<EmployeeLeave> {
    return this.leaves.apply(dto, actor);
  }

  @Patch(APP_ROUTES.HR.LEAVES.APPROVE)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: LeavesActor,
  ): Promise<EmployeeLeave> {
    return this.leaves.approve(id, actor);
  }

  @Patch(APP_ROUTES.HR.LEAVES.REJECT)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectLeaveDto,
    @CurrentUser() actor: LeavesActor,
  ): Promise<EmployeeLeave> {
    return this.leaves.reject(id, dto, actor);
  }

  @Patch(APP_ROUTES.HR.LEAVES.CANCEL)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: LeavesActor,
  ): Promise<EmployeeLeave> {
    return this.leaves.cancel(id, actor);
  }
}
