import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from '@notifications/notifications.controller';
import { NotificationsService } from '@notifications/notifications.service';
import { NotificationsRepository } from '@notifications/notifications.repository';
import { NotificationsGateway } from '@notifications/notifications.gateway';
import { Notification } from '@notifications/entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationsGateway,
  ],
  exports: [
    NotificationsService,
    NotificationsRepository,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
