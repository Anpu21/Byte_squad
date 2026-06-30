import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import {
  ShiftsService,
  type CurrentShiftResponse,
  type ShiftsActor,
  type ShiftsListResponse,
} from '@pos/shifts.service';
import { PosShift } from '@pos/entities/pos-shift.entity';
import { PosCashMovement } from '@pos/entities/pos-cash-movement.entity';
import { OpenShiftDto } from '@pos/dto/open-shift.dto';
import { CloseShiftDto } from '@pos/dto/close-shift.dto';
import { RecordCashMovementDto } from '@pos/dto/record-cash-movement.dto';
import { ListShiftsQueryDto } from '@pos/dto/list-shifts-query.dto';

@Controller(APP_ROUTES.POS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftsController {
  constructor(private readonly shifts: ShiftsService) {}

  /** Open shift + live drawer summary for the acting cashier. */
  @Get(APP_ROUTES.POS.SHIFTS_CURRENT)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  current(@CurrentUser() actor: ShiftsActor): Promise<CurrentShiftResponse> {
    return this.shifts.current(actor);
  }

  @Post(APP_ROUTES.POS.SHIFTS_OPEN)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  open(
    @Body() dto: OpenShiftDto,
    @CurrentUser() actor: ShiftsActor,
  ): Promise<PosShift> {
    return this.shifts.open(dto, actor);
  }

  @Post(APP_ROUTES.POS.SHIFTS_CLOSE)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  close(
    @Body() dto: CloseShiftDto,
    @CurrentUser() actor: ShiftsActor,
  ): Promise<PosShift> {
    return this.shifts.close(dto, actor);
  }

  /** Record a mid-shift cash drawer movement; returns the refreshed summary. */
  @Post(APP_ROUTES.POS.SHIFTS_MOVEMENTS)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  recordMovement(
    @Body() dto: RecordCashMovementDto,
    @CurrentUser() actor: ShiftsActor,
  ): Promise<CurrentShiftResponse> {
    return this.shifts.recordMovement(dto, actor);
  }

  /** Cash movements for the acting cashier's open shift. */
  @Get(APP_ROUTES.POS.SHIFTS_MOVEMENTS)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  listMovements(@CurrentUser() actor: ShiftsActor): Promise<PosCashMovement[]> {
    return this.shifts.listMovements(actor);
  }

  /** Shift register for back-office review (branch-pinned for managers). */
  @Get(APP_ROUTES.POS.SHIFTS)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  list(
    @Query() query: ListShiftsQueryDto,
    @CurrentUser() actor: ShiftsActor,
  ): Promise<ShiftsListResponse> {
    return this.shifts.list(query, actor);
  }
}
