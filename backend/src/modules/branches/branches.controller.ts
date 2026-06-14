import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BranchesService } from '@branches/branches.service';
import type { MyBranchPerformance } from '@branches/types';
import { CreateBranchDto } from '@branches/dto/create-branch.dto';
import { UpdateBranchDto } from '@branches/dto/update-branch.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import type { BranchActor } from '@common/scope/branch-scope';
import { APP_ROUTES } from '@common/routes/app.routes';
import { Branch } from '@branches/entities/branch.entity';

@Controller(APP_ROUTES.BRANCHES.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @CurrentUser('id') adminUserId: string,
    @Body() createBranchDto: CreateBranchDto,
  ): Promise<Branch> {
    return this.branchesService.create(adminUserId, createBranchDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findAll(@CurrentUser() actor: BranchActor): Promise<Branch[]> {
    return this.branchesService.findAll(actor);
  }

  // Must be declared before :id routes so Nest does not treat
  // "my-performance" as an :id path param.
  // Manager-only: admins are not tied to a single branch — they use the
  // cross-branch /admin/overview and /admin/comparison views instead.
  @Get(APP_ROUTES.BRANCHES.MY_PERFORMANCE)
  @Roles(UserRole.MANAGER)
  getMyPerformance(
    @CurrentUser('branchId') branchId: string,
  ): Promise<MyBranchPerformance> {
    return this.branchesService.getMyPerformance(branchId);
  }

  @Get(APP_ROUTES.BRANCHES.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findOne(
    @Param('id') id: string,
    @CurrentUser() actor: BranchActor,
  ): Promise<Branch | null> {
    return this.branchesService.findById(actor, id);
  }

  @Patch(APP_ROUTES.BRANCHES.BY_ID)
  @Roles(UserRole.ADMIN)
  update(
    @CurrentUser('id') adminUserId: string,
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ): Promise<Branch | null> {
    return this.branchesService.update(adminUserId, id, updateBranchDto);
  }

  @Patch(APP_ROUTES.BRANCHES.TOGGLE_ACTIVE)
  @Roles(UserRole.ADMIN)
  toggleActive(@Param('id') id: string): Promise<Branch> {
    return this.branchesService.toggleActive(id);
  }

  @Delete(APP_ROUTES.BRANCHES.BY_ID)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('id') adminUserId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.branchesService.delete(adminUserId, id);
  }
}
