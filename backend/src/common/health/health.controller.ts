import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '@common/decorators/public.decorator';
import { APP_ROUTES } from '@common/routes/app.routes';

/**
 * Infra health endpoints for orchestrators / load balancers. Public (no caller
 * identity) and intentionally outside the API version prefix.
 */
@Public()
@Controller(APP_ROUTES.HEALTH.BASE)
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Liveness — the process is up. Deliberately does NOT touch the database, so
   * a transient DB blip can't get a healthy container killed and restarted.
   */
  @Get(APP_ROUTES.HEALTH.LIVE)
  live(): { status: 'ok'; uptime: number; timestamp: string } {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness — safe to route traffic. Pings the database; returns 503 when it
   * is unreachable so the load balancer stops sending requests.
   */
  @Get(APP_ROUTES.HEALTH.READY)
  async ready(): Promise<{ status: 'ok'; db: 'up' }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', db: 'up' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
  }
}
