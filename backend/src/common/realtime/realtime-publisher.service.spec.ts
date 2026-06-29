import type { ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';
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
    const publish = jest.fn().mockResolvedValue(1);
    const redis = withRedis ? ({ publish } as unknown as Redis) : null;
    const config = {
      get: (_key: string, fallback: string) => fallback,
    } as unknown as ConfigService;
    const publisher = new RealtimePublisher(redis, config);
    return { publisher, publish };
  }

  it('toUser publishes a user-targeted Redis envelope', () => {
    const { publisher, publish } = setup();
    const payload = {
      userId: 'u1',
      title: 'T',
      message: 'M',
      type: 'STOCK_TRANSFER',
    };
    publisher.toUser('u1', payload);

    expect(envelopeFrom(publish)).toEqual({
      v: 1,
      target: { type: 'user', id: 'u1' },
      namespace: '/notifications',
      event: 'notification',
      payload,
    });
  });

  it('broadcast publishes a broadcast-targeted envelope', () => {
    const { publisher, publish } = setup();
    publisher.broadcast('customer-order:created', { id: 'o1' });

    expect(envelopeFrom(publish).target).toEqual({ type: 'broadcast' });
  });

  it('toGroup scopes the Redis envelope to the group room', () => {
    const { publisher, publish } = setup();
    publisher.toGroup('g9', 'group-cart:changed', { groupId: 'g9' });

    const envelope = envelopeFrom(publish);
    expect(envelope.target).toEqual({ type: 'group', id: 'g9' });
    expect(envelope.event).toBe('group-cart:changed');
  });

  it('no-ops without throwing when Redis is disabled (null client)', () => {
    const { publisher, publish } = setup(false);

    expect(() => publisher.broadcast('x', {})).not.toThrow();
    expect(publish).not.toHaveBeenCalled();
  });
});
