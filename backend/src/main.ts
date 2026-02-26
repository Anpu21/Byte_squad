import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '@/app.module.js';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { ConfigService } from '@nestjs/config';
import appConfig from '@common/config/app.config';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService.get<string>('appConfig.CORS_ORIGIN',{infer : true}),
    credentials: true,
  });

  const port = configService.get<number>('appConfig.PORT',{infer : true});
  await app.listen(port);
  console.log(`🚀 LedgerPro API running on http://localhost:${String(port)}`);
}
bootstrap();
