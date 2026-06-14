import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '@/modules/audit/entities/audit-log.entity';
import { AuditLogRepository } from '@/modules/audit/audit-log.repository';
import { AuditLogInterceptor } from '@/modules/audit/audit-log.interceptor';
import { AuditController } from '@/modules/audit/audit.controller';

/**
 * Activity-log module. Registering the interceptor via APP_INTERCEPTOR
 * makes every mutating endpoint auditable without touching any feature
 * module — the same global pattern as the JWT guard.
 */
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [
    AuditLogRepository,
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
  controllers: [AuditController],
  exports: [AuditLogRepository],
})
export class AuditModule {}
