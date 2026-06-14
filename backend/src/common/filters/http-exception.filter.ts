import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestWithId } from '@common/middleware/request-id.middleware';

interface ErrorResponseBody {
  success: boolean;
  message: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
}

/**
 * Catch-all filter: every thrown error becomes the standard
 * `{ success, message, statusCode, timestamp }` envelope. Server faults (5xx)
 * and any non-HttpException throw are logged with method/url + stack so nothing
 * fails silently (blaxx nestjs-09 / theprimeagen-06); client 4xx stay quiet.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();
    const requestId = request.id;

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    if (isHttp) {
      const res = exception.getResponse();
      const raw =
        typeof res === 'string'
          ? res
          : ((res as { message?: string | string[] }).message ??
            'Internal server error');
      message = Array.isArray(raw) ? raw.join(', ') : raw;
    }

    // Never swallow server faults or unexpected throws — log them with context.
    if (!isHttp || status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(
        `[${requestId ?? '-'}] ${request.method} ${request.originalUrl} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const errorBody: ErrorResponseBody = {
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      requestId,
    };

    response.status(status).json(errorBody);
  }
}
