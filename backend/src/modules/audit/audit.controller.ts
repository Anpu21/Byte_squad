import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import {
  AuditLogRepository,
  type PagedAuditLogs,
} from '@/modules/audit/audit-log.repository';
import { ListAuditLogsQueryDto } from '@/modules/audit/dto/list-audit-logs-query.dto';

@Controller(APP_ROUTES.AUDIT.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditLogs: AuditLogRepository) {}

  /** Activity log (admin) — newest first, filterable. */
  @Get()
  @Roles(UserRole.ADMIN)
  async list(
    @Query() query: ListAuditLogsQueryDto,
  ): Promise<PagedAuditLogs & { limit: number; offset: number }> {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const offset = Math.max(query.offset ?? 0, 0);
    const { rows, total } = await this.auditLogs.list({
      userId: query.userId,
      method: query.method,
      search: query.search,
      startDate: query.startDate,
      endDate: query.endDate,
      limit,
      offset,
    });
    return { rows, total, limit, offset };
  }
}
