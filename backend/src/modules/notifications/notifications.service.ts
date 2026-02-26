import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '@notifications/entities/notification.entity';
import { NotificationType } from '@common/enums/notification.enum';

interface CreateNotificationPayload {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) { }

    async create(payload: CreateNotificationPayload): Promise<Notification> {
        const notification = this.notificationRepository.create(payload);
        return this.notificationRepository.save(notification);
    }

    async findByUser(userId: string): Promise<Notification[]> {
        return this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async markAsRead(id: string): Promise<void> {
        await this.notificationRepository.update(id, { isRead: true });
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationRepository.update(
            { userId, isRead: false },
            { isRead: true },
        );
    }
}
