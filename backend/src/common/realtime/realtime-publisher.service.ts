import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';
import { NotificationsGateway } from '@notifications/notifications.gateway';
import { REDIS_PUBLISHER } from '@common/realtime/realtime.constants';
import {
  REALTIME_CHANNEL,
  type RealtimeEnvelope,
  type RealtimeTarget,
} from '@common/realtime/realtime-event.type';

/** Per-user notification payload (mirrors the gateway's emit shape). */
export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: string;
}

/**
 * Single entry point for emitting realtime events from domain services.
 *
 * During the extraction it DUAL-EMITs: the legacy in-process socket.io gateway
 * (so the current frontend keeps working) AND a Redis PUBLISH consumed by the
 * ledgerpro-realtime service. At cutover the gateway half is deleted and this
 * becomes Redis-only.
 *
 * Redis publishes are fire-and-forget and never throw into the caller — a
 * realtime outage must not break the domain operation that triggered it.
 */
@Injectable()
export class RealtimePublisher {
  private readonly logger = new Logger(RealtimePublisher.name);
  private readonly channel: string;

  constructor(
    private readonly gateway: NotificationsGateway,
    @Inject(REDIS_PUBLISHER) private readonly redis: Redis | null,
    config: ConfigService,
  ) {
    this.channel = config.get<string>(
      'REALTIME_REDIS_CHANNEL',
      REALTIME_CHANNEL,
    );
    if (!this.redis) {
      this.logger.warn(
        'REDIS_URL not set — realtime Redis publish disabled (in-process gateway only).',
      );
    }
  }

  /** Targeted per-user notification (emitted as the `notification` event). */
  toUser(userId: string, payload: NotificationPayload): void {
    this.gateway.sendToUser(userId, payload);
    this.publish({ type: 'user', id: userId }, 'notification', payload);
  }

  /** Broadcast a domain event to every connected client (live refresh). */
  broadcast(event: string, payload: unknown): void {
    this.gateway.broadcast(event, payload);
    this.publish({ type: 'broadcast' }, event, payload);
  }

  /** Scope an event to a group's room (e.g. shared-cart members). */
  toGroup(groupId: string, event: string, payload: unknown): void {
    // The legacy gateway had no group room, so it broadcast globally; preserve
    // that reach until cutover. The Redis path scopes correctly to group:<id>.
    this.gateway.broadcast(event, payload);
    this.publish({ type: 'group', id: groupId }, event, payload);
  }

  /** Scope an event to a branch's room. */
  toBranch(branchId: string, event: string, payload: unknown): void {
    this.gateway.broadcast(event, payload);
    this.publish({ type: 'branch', id: branchId }, event, payload);
  }

  private publish(
    target: RealtimeTarget,
    event: string,
    payload: unknown,
  ): void {
    if (!this.redis) {
      return;
    }
    const envelope: RealtimeEnvelope = {
      v: 1,
      target,
      namespace: '/notifications',
      event,
      payload,
    };
    void this.redis
      .publish(this.channel, JSON.stringify(envelope))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'unknown';
        this.logger.warn(`Redis publish failed for "${event}": ${message}`);
      });
  }
}
