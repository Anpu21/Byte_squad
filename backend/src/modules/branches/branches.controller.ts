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
import {
  BranchActionConfirmResult,
  BranchActionRequestResult,
  BranchesService,
} from '@branches/branches.service';
import type { MyBranchPerformance } from '@branches/types';
import { CreateBranchDto } from '@branches/dto/create-branch.dto';
import { UpdateBranchDto } from '@branches/dto/update-branch.dto';
import { ConfirmBranchActionDto } from '@branches/dto/confirm-branch-action.dto';
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
  @HttpCode(HttpStatus.ACCEPTED)
  requestCreate(
    @CurrentUser('id') adminUserId: string,
    @Body() createBranchDto: CreateBranchDto,
  ): Promise<BranchActionRequestResult> {
    return this.branchesService.requestCreate(adminUserId, createBranchDto);
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

  @Post(APP_ROUTES.BRANCHES.CONFIRM_ACTION)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  confirmAction(
    @CurrentUser('id') adminUserId: string,
    @Param('actionId') actionId: string,
    @Body() dto: ConfirmBranchActionDto,
  ): Promise<BranchActionConfirmResult> {
    return this.branchesService.confirmAction(
      adminUserId,
      actionId,
      dto.otpCode,
    );
  }

  @Post(APP_ROUTES.BRANCHES.RESEND_ACTION_OTP)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  resendActionOtp(
    @CurrentUser('id') adminUserId: string,
    @Param('actionId') actionId: string,
  ): Promise<{ expiresAt: Date }> {
    return this.branchesService.resendActionOtp(adminUserId, actionId);
  }

  @Get(APP_ROUTES.BRANCHES.BY_ID)
  findOne(@Param('id') id: string): Promise<Branch | null> {
    return this.branchesService.findById(id);
  }

  @Patch(APP_ROUTES.BRANCHES.BY_ID)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  requestUpdate(
    @CurrentUser('id') adminUserId: string,
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ): Promise<BranchActionRequestResult> {
    return this.branchesService.requestUpdate(
      adminUserId,
      id,
      updateBranchDto,
    );
  }

  @Patch(APP_ROUTES.BRANCHES.TOGGLE_ACTIVE)
  @Roles(UserRole.ADMIN)
  toggleActive(@Param('id') id: string): Promise<Branch> {
    return this.branchesService.toggleActive(id);
  }

  @Delete(APP_ROUTES.BRANCHES.BY_ID)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  requestDelete(
    @CurrentUser('id') adminUserId: string,
    @Param('id') id: string,
  ): Promise<BranchActionRequestResult> {
    return this.branchesService.requestDelete(adminUserId, id);
  }
}
