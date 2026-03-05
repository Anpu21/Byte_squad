import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

type ClassConstructor = new (...args: unknown[]) => object;

@Injectable()
export class ValidationPipe implements PipeTransform<
  unknown,
  Promise<unknown>
> {
  async transform(
    value: unknown,
    { metatype }: ArgumentMetadata,
  ): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const object: object = plainToInstance(metatype, value);
    const errors: ValidationError[] = await validate(object);

    if (errors.length > 0) {
      const messages: string[] = errors
        .map((err: ValidationError) => {
          if (err.constraints) {
            return Object.values(err.constraints).join(', ');
          }
          return '';
        })
        .filter(Boolean);

      throw new BadRequestException(messages);
    }

    return value;
  }

  private toValidate(metatype: ClassConstructor): boolean {
    const types: ClassConstructor[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
