import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BranchesService } from '@branches/branches.service';
import type { MyBranchPerformance } from '@branches/branches.service';
import { CreateBranchDto } from '@branches/dto/create-branch.dto';
import { UpdateBranchDto } from '@branches/dto/update-branch.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';
import { Branch } from '@branches/entities/branch.entity';

@Controller(APP_ROUTES.BRANCHES.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createBranchDto: CreateBranchDto): Promise<Branch> {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  findAll(): Promise<Branch[]> {
    return this.branchesService.findAll();
  }

  // Must be declared before :id routes so Nest does not treat
  // "my-performance" as an :id path param.
  @Get(APP_ROUTES.BRANCHES.MY_PERFORMANCE)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getMyPerformance(
    @CurrentUser('branchId') branchId: string,
  ): Promise<MyBranchPerformance> {
    return this.branchesService.getMyPerformance(branchId);
  }

  @Get(APP_ROUTES.BRANCHES.BY_ID)
  findOne(@Param('id') id: string): Promise<Branch | null> {
    return this.branchesService.findById(id);
  }

  @Patch(APP_ROUTES.BRANCHES.BY_ID)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ): Promise<Branch> {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Patch(APP_ROUTES.BRANCHES.TOGGLE_ACTIVE)
  @Roles(UserRole.ADMIN)
  toggleActive(@Param('id') id: string): Promise<Branch> {
    return this.branchesService.toggleActive(id);
  }

  @Delete(APP_ROUTES.BRANCHES.BY_ID)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.branchesService.remove(id);
  }
}
