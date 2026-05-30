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
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  checkIn(@CurrentUser() actor: AttendanceActor): Promise<Attendance> {
    return this.attendanceService.checkInSelf(actor, new Date());
  }

  @Post(APP_ROUTES.HR.ATTENDANCE.CHECK_OUT)
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  checkOut(@CurrentUser() actor: AttendanceActor): Promise<Attendance> {
    return this.attendanceService.checkOutSelf(actor, new Date());
  }
}
