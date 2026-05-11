import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Notification } from '@notifications/entities/notification.entity';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async createAndSave(
    partial: DeepPartial<Notification>,
  ): Promise<Notification> {
    return this.repo.save(this.repo.create(partial));
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForUser(
    id: string,
    userId: string,
  ): Promise<Notification | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  async markRead(id: string): Promise<void> {
    await this.repo.update(id, { isRead: true });
  }

  async markAllReadForUser(userId: string): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
  }
}
