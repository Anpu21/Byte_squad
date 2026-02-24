import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service.js';
import { NotificationsGateway } from './notifications.gateway.js';
import { Notification } from './entities/notification.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([Notification])],
    providers: [NotificationsService, NotificationsGateway],
    exports: [NotificationsService],
})
export class NotificationsModule { }
