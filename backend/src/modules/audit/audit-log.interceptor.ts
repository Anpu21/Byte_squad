import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuditLogRepository } from '@/modules/audit/audit-log.repository';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

interface RequestLike {
  method: string;
  path?: string;
  url: string;
  user?: { id?: string; role?: string; branchId?: string | null };
}

interface ResponseLike {
  statusCode: number;
}

interface HttpErrorLike {
  status?: number;
  getStatus?: () => number;
}

/**
 * Global activity logger. Every mutating HTTP call lands one append-only
 * `audit_logs` row (who, method, path, outcome, duration) — never the
 * body. Auth endpoints are skipped (credentials + noise), and a logging
 * failure can never break the request: writes are fire-and-forget.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly auditLogs: AuditLogRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<RequestLike>();
    const method = request.method?.toUpperCase() ?? '';
    const path = request.path ?? request.url ?? '';

    if (!MUTATING_METHODS.has(method) || path.includes('/auth/')) {
      return next.handle();
    }

    const startedAt = Date.now();
    const record = (statusCode: number) => {
      void this.auditLogs
        .insert({
          userId: request.user?.id ?? null,
          userRole: request.user?.role ?? null,
          method,
          path: path.slice(0, 255),
          statusCode,
          durationMs: Date.now() - startedAt,
          branchId: request.user?.branchId ?? null,
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Audit write failed: ${message}`);
        });
    };

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<ResponseLike>();
        record(response.statusCode ?? 200);
      }),
      catchError((err: HttpErrorLike) => {
        const status =
          typeof err.getStatus === 'function'
            ? err.getStatus()
            : (err.status ?? 500);
        record(status);
        return throwError(() => err);
      }),
    );
  }
}
