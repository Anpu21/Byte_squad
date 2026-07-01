import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';
import { REDIS_PUBLISHER } from '@common/realtime/realtime.constants';
import {
  CHAT_CONTROL_CHANNEL,
  REALTIME_CHANNEL,
  type ChatControlMessage,
  type ChatRevokeTarget,
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
 * Delivery is Redis-only: each call PUBLISHes a {@link RealtimeEnvelope} that
 * the standalone ledgerpro-realtime service consumes and fans out to socket.io
 * rooms (the legacy in-process gateway was removed at cutover).
 *
 * Redis publishes are fire-and-forget and never throw into the caller — a
 * realtime outage must not break the domain operation that triggered it.
 */
@Injectable()
export class RealtimePublisher {
  private readonly logger = new Logger(RealtimePublisher.name);
  private readonly channel: string;

  constructor(
    @Inject(REDIS_PUBLISHER) private readonly redis: Redis | null,
    config: ConfigService,
  ) {
    this.channel = config.get<string>(
      'REALTIME_REDIS_CHANNEL',
      REALTIME_CHANNEL,
    );
    if (!this.redis) {
      this.logger.warn(
        'REDIS_URL not set — realtime delivery disabled (no events will reach clients).',
      );
    }
  }

  /** Targeted per-user notification (emitted as the `notification` event). */
  toUser(userId: string, payload: NotificationPayload): void {
    this.publish({ type: 'user', id: userId }, 'notification', payload);
  }

  /** Broadcast a domain event to every connected client (live refresh). */
  broadcast(event: string, payload: unknown): void {
    this.publish({ type: 'broadcast' }, event, payload);
  }

  /** Scope an event to a group's room (e.g. shared-cart members). */
  toGroup(groupId: string, event: string, payload: unknown): void {
    this.publish({ type: 'group', id: groupId }, event, payload);
  }

  /** Scope an event to a branch's room. */
  toBranch(branchId: string, event: string, payload: unknown): void {
    this.publish({ type: 'branch', id: branchId }, event, payload);
  }

  /**
   * Revoke a user (kind:'user') or every member (kind:'all', on group archive)
   * from a group's chat. Published on the dedicated control channel; the realtime
   * chat-control consumer prunes the participant row(s) and kicks live sockets.
   */
  revokeGroupChat(groupId: string, target: ChatRevokeTarget): void {
    if (!this.redis) {
      return;
    }
    const message: ChatControlMessage = {
      v: 1,
      action: 'revoke',
      groupId,
      target,
    };
    void this.redis
      .publish(CHAT_CONTROL_CHANNEL, JSON.stringify(message))
      .catch((err: unknown) => {
        const m = err instanceof Error ? err.message : 'unknown';
        this.logger.warn(`Redis publish failed for chat revoke: ${m}`);
      });
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
