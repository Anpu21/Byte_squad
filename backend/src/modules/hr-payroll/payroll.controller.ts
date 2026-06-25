import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import {
  PayrollService,
  type GeneratePayrollResponse,
  type PayrollActor,
  type PayrollListResponse,
} from '@/modules/hr-payroll/payroll.service';
import { Payroll } from '@/modules/hr-payroll/entities/payroll.entity';
import { ListPayrollQueryDto } from '@/modules/hr-payroll/dto/list-payroll-query.dto';
import { GeneratePayrollDto } from '@/modules/hr-payroll/dto/generate-payroll.dto';
import { MarkPayrollPaidDto } from '@/modules/hr-payroll/dto/mark-payroll-paid.dto';
import { ExportPayrollCsvQueryDto } from '@/modules/hr-payroll/dto/export-payroll-csv-query.dto';

/**
 * Thin REST surface for payroll runs (rules §9). Scope decisions
 * (admin vs. manager) and state transitions both live in the service —
 * this controller is the wire adapter only.
 */
@Controller(APP_ROUTES.HR.PAYROLL.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payroll: PayrollService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(
    @Query() query: ListPayrollQueryDto,
    @CurrentUser() actor: PayrollActor,
  ): Promise<PayrollListResponse> {
    return this.payroll.list(query, actor);
  }

  /**
   * CSV export — declared BEFORE `:id` so Nest's route matcher doesn't
   * treat `csv` as a payroll UUID. Writes directly to the response so
   * we can attach the `Content-Disposition: attachment` header (Nest's
   * normal JSON serializer would otherwise hijack the body).
   */
  @Get(APP_ROUTES.HR.PAYROLL.CSV)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async csv(
    @Query() query: ExportPayrollCsvQueryDto,
    @CurrentUser() actor: PayrollActor,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.payroll.exportCsv(query, actor);
    const filename = `payroll-${query.year}-${String(query.month).padStart(2, '0')}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get(APP_ROUTES.HR.PAYROLL.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: PayrollActor,
  ): Promise<Payroll> {
    return this.payroll.getById(id, actor);
  }

  // Writes own the payment lifecycle — admin-only. Managers keep the read
  // endpoints above (list / csv / getById), branch-scoped in the service.
  @Post(APP_ROUTES.HR.PAYROLL.GENERATE)
  @Roles(UserRole.ADMIN)
  generate(
    @Body() dto: GeneratePayrollDto,
    @CurrentUser() actor: PayrollActor,
  ): Promise<GeneratePayrollResponse> {
    return this.payroll.generate(dto, actor);
  }

  @Patch(APP_ROUTES.HR.PAYROLL.APPROVE)
  @Roles(UserRole.ADMIN)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: PayrollActor,
  ): Promise<Payroll> {
    return this.payroll.approve(id, actor);
  }

  @Patch(APP_ROUTES.HR.PAYROLL.MARK_PAID)
  @Roles(UserRole.ADMIN)
  markPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkPayrollPaidDto,
    @CurrentUser() actor: PayrollActor,
  ): Promise<Payroll> {
    return this.payroll.markPaid(id, dto, actor);
  }

  @Patch(APP_ROUTES.HR.PAYROLL.CANCEL)
  @Roles(UserRole.ADMIN)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: PayrollActor,
  ): Promise<Payroll> {
    return this.payroll.cancel(id, actor);
  }
}
