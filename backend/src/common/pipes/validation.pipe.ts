import {
    PipeTransform,
    Injectable,
    ArgumentMetadata,
    BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

type ClassConstructor = new (...args: unknown[]) => object;

@Injectable()
export class ValidationPipe implements PipeTransform<unknown, Promise<unknown>> {
    async transform(value: unknown, { metatype }: ArgumentMetadata): Promise<unknown> {
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }

        const object = plainToInstance(metatype, value);
        const errors = await validate(object);

        if (errors.length > 0) {
            const messages = errors
                .map((err) => {
                    const constraints = err.constraints;
                    return constraints ? Object.values(constraints).join(', ') : '';
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
