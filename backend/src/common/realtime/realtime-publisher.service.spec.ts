import type { ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';
import type { NotificationsGateway } from '@notifications/notifications.gateway';
import { RealtimePublisher } from '@common/realtime/realtime-publisher.service';
import {
  REALTIME_CHANNEL,
  type RealtimeEnvelope,
} from '@common/realtime/realtime-event.type';

function envelopeFrom(publish: jest.Mock): RealtimeEnvelope {
  const call = publish.mock.calls[0] as [string, string];
  expect(call[0]).toBe(REALTIME_CHANNEL);
  return JSON.parse(call[1]) as RealtimeEnvelope;
}

describe('RealtimePublisher', () => {
  function setup(withRedis = true) {
    const gateway = { sendToUser: jest.fn(), broadcast: jest.fn() };
    const publish = jest.fn().mockResolvedValue(1);
    const redis = withRedis ? ({ publish } as unknown as Redis) : null;
    const config = {
      get: (_key: string, fallback: string) => fallback,
    } as unknown as ConfigService;
    const publisher = new RealtimePublisher(
      gateway as unknown as NotificationsGateway,
      redis,
      config,
    );
    return { publisher, gateway, publish };
  }

  it('toUser dual-emits: in-process gateway AND a user-targeted Redis envelope', () => {
    const { publisher, gateway, publish } = setup();
    const payload = {
      userId: 'u1',
      title: 'T',
      message: 'M',
      type: 'STOCK_TRANSFER',
    };
    publisher.toUser('u1', payload);

    expect(gateway.sendToUser).toHaveBeenCalledWith('u1', payload);
    expect(envelopeFrom(publish)).toEqual({
      v: 1,
      target: { type: 'user', id: 'u1' },
      namespace: '/notifications',
      event: 'notification',
      payload,
    });
  });

  it('broadcast dual-emits with a broadcast target', () => {
    const { publisher, gateway, publish } = setup();
    publisher.broadcast('customer-order:created', { id: 'o1' });

    expect(gateway.broadcast).toHaveBeenCalledWith('customer-order:created', {
      id: 'o1',
    });
    expect(envelopeFrom(publish).target).toEqual({ type: 'broadcast' });
  });

  it('toGroup scopes the Redis envelope to the group room', () => {
    const { publisher, publish } = setup();
    publisher.toGroup('g9', 'group-cart:changed', { groupId: 'g9' });

    const envelope = envelopeFrom(publish);
    expect(envelope.target).toEqual({ type: 'group', id: 'g9' });
    expect(envelope.event).toBe('group-cart:changed');
  });

  it('still emits in-process when Redis is disabled (null client)', () => {
    const { publisher, gateway, publish } = setup(false);
    publisher.broadcast('x', {});

    expect(gateway.broadcast).toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });
});
