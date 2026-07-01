import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { SKIP_TRANSFORM_KEY } from '@common/decorators/skip-transform.decorator';

interface TransformResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  TransformResponse<T> | T
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<TransformResponse<T> | T> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        message: 'Success',
      })),
    );
  }
}
