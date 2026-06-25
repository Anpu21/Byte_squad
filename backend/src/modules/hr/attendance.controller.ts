import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
  AttendanceService,
  type AttendanceActor,
  type AttendanceListResponse,
  type TodayAttendanceStatus,
} from '@/modules/hr/attendance.service';
import { Attendance } from '@/modules/hr/entities/attendance.entity';
import { ListAttendanceQueryDto } from '@/modules/hr/dto/list-attendance-query.dto';
import { BulkAttendanceDto } from '@/modules/hr/dto/bulk-attendance.dto';

@Controller(APP_ROUTES.HR.ATTENDANCE.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(
    @Query() query: ListAttendanceQueryDto,
    @CurrentUser() actor: AttendanceActor,
  ): Promise<AttendanceListResponse> {
    return this.attendanceService.list(query, actor);
  }

  // Self-scoped "my attendance": any logged-in staff member with a
  // linked employee profile (worker / cashier / manager / admin) reads
  // only their own rows for the requested window.
  @Get(APP_ROUTES.HR.ATTENDANCE.ME)
  @Roles(UserRole.WORKER, UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  listMine(
    @Query() query: ListAttendanceQueryDto,
    @CurrentUser() actor: AttendanceActor,
  ): Promise<AttendanceListResponse> {
    return this.attendanceService.listSelf(query, actor);
  }

  // Branch-scoped "who hasn't been recorded today" — the manager's daily
  // action list. Admins may pass ?branchId= to scope or omit it to span all.
  @Get(APP_ROUTES.HR.ATTENDANCE.TODAY_STATUS)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  todayStatus(
    @Query('branchId') branchId: string | undefined,
    @CurrentUser() actor: AttendanceActor,
  ): Promise<TodayAttendanceStatus> {
    return this.attendanceService.todayStatus(actor, branchId);
  }

  @Post(APP_ROUTES.HR.ATTENDANCE.BULK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  bulk(
    @Body() dto: BulkAttendanceDto,
    @CurrentUser() actor: AttendanceActor,
  ): Promise<Attendance[]> {
    return this.attendanceService.bulkUpsert(dto, actor);
  }

  // Cashier self-flow: no body, derived entirely from the
  // authenticated actor + server clock.
  @Post(APP_ROUTES.HR.ATTENDANCE.CHECK_IN)
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN, UserRole.WORKER)
  checkIn(@CurrentUser() actor: AttendanceActor): Promise<Attendance> {
    return this.attendanceService.checkInSelf(actor, new Date());
  }

  @Post(APP_ROUTES.HR.ATTENDANCE.CHECK_OUT)
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN, UserRole.WORKER)
  checkOut(@CurrentUser() actor: AttendanceActor): Promise<Attendance> {
    return this.attendanceService.checkOutSelf(actor, new Date());
  }
}
