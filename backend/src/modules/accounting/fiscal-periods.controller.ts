import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import { FiscalPeriodsService } from '@accounting/fiscal-periods.service';
import { FiscalPeriodLock } from '@accounting/entities/fiscal-period-lock.entity';
import { LockPeriodDto } from '@accounting/dto/lock-period.dto';

@Controller(APP_ROUTES.ACCOUNTING.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class FiscalPeriodsController {
  constructor(private readonly periods: FiscalPeriodsService) {}

  @Get(APP_ROUTES.ACCOUNTING.PERIODS)
  @Roles(UserRole.ADMIN)
  list(@Query('year') year?: string): Promise<FiscalPeriodLock[]> {
    return this.periods.list(year ? Number(year) : undefined);
  }

  @Post(APP_ROUTES.ACCOUNTING.PERIODS_LOCK)
  @Roles(UserRole.ADMIN)
  lock(
    @Body() dto: LockPeriodDto,
    @CurrentUser() actor: { id: string },
  ): Promise<FiscalPeriodLock> {
    return this.periods.lock(dto.year, dto.month, actor.id);
  }

  @Post(APP_ROUTES.ACCOUNTING.PERIODS_UNLOCK)
  @Roles(UserRole.ADMIN)
  async unlock(@Body() dto: LockPeriodDto): Promise<{ unlocked: true }> {
    await this.periods.unlock(dto.year, dto.month);
    return { unlocked: true };
  }
}
