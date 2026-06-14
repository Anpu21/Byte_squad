import { Module } from '@nestjs/common';
import { HealthController } from '@common/health/health.controller';

// DataSource is provided globally by TypeOrmModule.forRoot, so the controller
// needs no extra imports.
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
