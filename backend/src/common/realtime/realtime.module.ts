import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { NotificationsModule } from '@notifications/notifications.module';
import { RealtimePublisher } from '@common/realtime/realtime-publisher.service';
import { REDIS_PUBLISHER } from '@common/realtime/realtime.constants';

/**
 * Global so every domain service can inject {@link RealtimePublisher} without
 * per-module wiring. Imports NotificationsModule for the legacy in-process
 * gateway the publisher dual-emits through (removed at cutover). The Redis
 * client resolves to null when REDIS_URL is unset.
 */
@Global()
@Module({
  imports: [NotificationsModule],
  providers: [
    {
      provide: REDIS_PUBLISHER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis | null => {
        const url = config.get<string>('REDIS_URL');
        if (!url) {
          return null;
        }
        return new Redis(url, {
          maxRetriesPerRequest: null,
          enableOfflineQueue: true,
        });
      },
    },
    RealtimePublisher,
  ],
  exports: [RealtimePublisher],
})
export class RealtimeModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_PUBLISHER) private readonly redis: Redis | null) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
