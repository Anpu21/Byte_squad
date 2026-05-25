import {
  Body,
  Controller,
  Get,
  Patch,
  Put,
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
  PayrollSettingsService,
  type PayrollSettingsActor,
} from '@/modules/hr/payroll-settings.service';
import { PayrollSettings } from '@/modules/hr/entities/payroll-settings.entity';
import { UpdatePayrollSettingsDto } from '@/modules/hr/dto/update-payroll-settings.dto';
import { UpsertBranchPayrollSettingsDto } from '@/modules/hr/dto/upsert-branch-payroll-settings.dto';

/**
 * Thin REST surface for payroll settings. The service is the gate
 * for scope decisions (admin vs. manager) — this controller just
 * forwards the actor and the body (rules §9).
 */
@Controller(APP_ROUTES.HR.PAYROLL_SETTINGS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollSettingsController {
  constructor(private readonly settings: PayrollSettingsService) {}

  @Get(APP_ROUTES.HR.PAYROLL_SETTINGS.GLOBAL)
  @Roles(UserRole.ADMIN)
  getGlobal(): Promise<PayrollSettings> {
    return this.settings.getGlobal();
  }

  /**
   * Returns the effective row for `branchId` — branch override when
   * present, global fallback otherwise. Managers are pinned to their
   * own branch so the URL cannot widen scope.
   */
  @Get(APP_ROUTES.HR.PAYROLL_SETTINGS.EFFECTIVE)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getEffective(
    @Query('branchId') branchId: string | undefined,
    @CurrentUser() actor: PayrollSettingsActor,
  ): Promise<PayrollSettings> {
    const resolved =
      actor.role === UserRole.ADMIN ? (branchId ?? null) : actor.branchId;
    return this.settings.getEffective(resolved);
  }

  @Patch(APP_ROUTES.HR.PAYROLL_SETTINGS.GLOBAL)
  @Roles(UserRole.ADMIN)
  updateGlobal(
    @Body() dto: UpdatePayrollSettingsDto,
    @CurrentUser() actor: PayrollSettingsActor,
  ): Promise<PayrollSettings> {
    return this.settings.updateGlobal(dto, actor);
  }

  @Put(APP_ROUTES.HR.PAYROLL_SETTINGS.BRANCH)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  upsertBranch(
    @Body() dto: UpsertBranchPayrollSettingsDto,
    @CurrentUser() actor: PayrollSettingsActor,
  ): Promise<PayrollSettings> {
    return this.settings.upsertBranch(dto, actor);
  }
}
