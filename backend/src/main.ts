import { NestFactory, Reflector } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from '@/app.module.js';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { requestIdMiddleware } from '@common/middleware/request-id.middleware';
import { ConfigService } from '@nestjs/config';

interface AppConfig {
  PORT: number | string;
  CORS_ORIGIN: string;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Security headers (CSP, HSTS, X-Content-Type-Options, hide x-powered-by …)
  // and a per-request correlation id — both before anything is routed.
  app.use(helmet());
  app.use(requestIdMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));

  // Graceful shutdown: on SIGTERM/SIGINT, drain in-flight requests and let
  // TypeORM close its pool (onModuleDestroy) for zero-downtime deploys.
  app.enableShutdownHooks();

  const configService = app.get(ConfigService<{ appConfig: AppConfig }, true>);

  app.enableCors({
    origin: configService.get('appConfig.CORS_ORIGIN', { infer: true }),
    credentials: true,
  });

  const port: number = Number(
    configService.get('appConfig.PORT', { infer: true }),
  );
  await app.listen(port);
  logger.log(`🚀 LedgerPro API running on http://localhost:${String(port)}`);
}
void bootstrap();
