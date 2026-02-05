import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global prefix for all routes
    app.setGlobalPrefix('api');

    // Enable CORS for Electron app
    app.enableCors({
        origin: true,
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global response transformer
    app.useGlobalInterceptors(new TransformInterceptor());

    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log(`🚀 SmartBiz ERP Backend running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api`);
}

bootstrap();
