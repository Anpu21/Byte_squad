/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationType } from '@common/enums/notification.enum';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: jest.Mocked<NotificationsRepository>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<NotificationsRepository>> = {
      createAndSave: jest.fn(),
      findByUser: jest.fn(),
      findOneForUser: jest.fn(),
      markRead: jest.fn(),
      markAllReadForUser: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsRepository, useValue: repoMock },
      ],
    }).compile();

    service = module.get(NotificationsService);
    repo = module.get(NotificationsRepository);
  });

  it('forwards create payload to the repo', async () => {
    await service.create({
      userId: 'u1',
      title: 't',
      message: 'm',
      type: NotificationType.SYSTEM,
    });
    expect(repo.createAndSave).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', title: 't', message: 'm' }),
    );
  });

  it('scopes findOneByUser to the requesting user', async () => {
    await service.findOneByUser('n1', 'u1');
    expect(repo.findOneForUser).toHaveBeenCalledWith('n1', 'u1');
  });

  it('marks all as read scoped to user', async () => {
    await service.markAllAsRead('u1');
    expect(repo.markAllReadForUser).toHaveBeenCalledWith('u1');
  });
});
