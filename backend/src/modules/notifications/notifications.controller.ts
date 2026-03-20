import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from '@notifications/notifications.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { APP_ROUTES } from '@common/routes/app.routes';
import { Notification } from '@notifications/entities/notification.entity';

@Controller(APP_ROUTES.NOTIFICATIONS.BASE)
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string): Promise<Notification[]> {
    return this.notificationsService.findByUser(userId);
  }

  @Patch(APP_ROUTES.NOTIFICATIONS.MARK_READ)
  async markAsRead(@Param('id') id: string): Promise<void> {
    await this.notificationsService.markAsRead(id);
  }

  @Patch(APP_ROUTES.NOTIFICATIONS.MARK_ALL_READ)
  async markAllAsRead(@CurrentUser('id') userId: string): Promise<void> {
    await this.notificationsService.markAllAsRead(userId);
  }
}
