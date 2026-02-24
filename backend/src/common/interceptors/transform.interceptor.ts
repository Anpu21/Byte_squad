import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

interface TransformResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, TransformResponse<T>> {
    intercept(
        _context: ExecutionContext,
        next: CallHandler<T>,
    ): Observable<TransformResponse<T>> {
        return next.handle().pipe(
            map((data) => ({
                success: true,
                data,
                message: 'Success',
            })),
        );
    }
}
