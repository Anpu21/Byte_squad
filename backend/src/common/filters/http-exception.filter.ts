import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponseBody {
    success: boolean;
    message: string;
    statusCode: number;
    timestamp: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse = exception.getResponse();
        const message =
            typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as { message?: string }).message ??
                'Internal server error';

        const errorBody: ErrorResponseBody = {
            success: false,
            message: Array.isArray(message) ? message.join(', ') : message,
            statusCode: status,
            timestamp: new Date().toISOString(),
        };

        response.status(status).json(errorBody);
    }
}
