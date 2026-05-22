import { Injectable } from '@nestjs/common';
import { Notification } from '@notifications/entities/notification.entity';
import { NotificationsRepository } from '@notifications/notifications.repository';
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
  constructor(private readonly notifications: NotificationsRepository) {}

  async create(payload: CreateNotificationPayload): Promise<Notification> {
    return this.notifications.createAndSave(payload);
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notifications.findByUser(userId);
  }

  async findOneByUser(
    id: string,
    userId: string,
  ): Promise<Notification | null> {
    return this.notifications.findOneForUser(id, userId);
  }

  async markAsRead(id: string): Promise<void> {
    await this.notifications.markRead(id);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notifications.markAllReadForUser(userId);
  }
}
