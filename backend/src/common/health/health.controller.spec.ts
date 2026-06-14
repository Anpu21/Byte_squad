import { Test } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: DataSource, useValue: dataSource }],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  it('live() reports ok without touching the database', () => {
    const res = controller.live();
    expect(res.status).toBe('ok');
    expect(typeof res.uptime).toBe('number');
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('ready() returns ok when the database answers', async () => {
    dataSource.query.mockResolvedValue([{ ok: 1 }]);
    await expect(controller.ready()).resolves.toEqual({
      status: 'ok',
      db: 'up',
    });
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('ready() throws 503 when the database is unreachable', async () => {
    dataSource.query.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
